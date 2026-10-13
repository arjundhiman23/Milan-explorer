import type { CategoryId, Place } from "@/types";
import { matchConcepts, normalize } from "./search";
import { mapCategory } from "./photon";

// Live nearby search on OpenStreetMap via Overpass. Concept queries become
// tag filters ("pizza" → cuisine~pizza, "tabacchi" → shop=tobacco); several
// concepts combine with AND ("vegan pizza" → cuisine~pizza AND diet:vegan).
// Anything else falls back to a name / brand / cuisine match near the base,
// so "esselunga" or an unlisted cuisine still finds places.
const ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
const cache = new Map<string, Place[]>();

// Accent-insensitive regex for Italian names: "caffe" also matches "Caffè".
function looseRegex(s: string): string {
  return normalize(s).split("").map((ch) => ({ a: "[aàá]", e: "[eèé]", i: "[iìí]", o: "[oòó]", u: "[uùú]" } as Record<string, string>)[ch] ?? ch.replace(/[^a-z0-9 ]/g, "")).join("");
}

export function overpassPlan(query: string): { selectors: string[]; category?: CategoryId } | null {
  const { groups } = matchConcepts(query);
  const withOsm = groups.map((g) => [...new Set(g.flatMap((c) => c.osm))]).filter((f) => f.length);
  if (withOsm.length) {
    // Cartesian product across groups = AND; alternatives inside a group = OR.
    let combos: string[][] = [[]];
    for (const filters of withOsm) combos = combos.flatMap((c) => filters.map((f) => [...c, f])).slice(0, 16);
    return { selectors: combos.map((c) => c.map((f) => `[${f}]`).join("")), category: groups[0].find((c) => c.category)?.category };
  }
  if (groups.length) return null; // vibe-only queries ("quiet", "date") stay local
  const q = normalize(query);
  if (q.length < 4) return null;
  const re = looseRegex(q);
  return { selectors: [`["name"~"${re}",i]`, `["brand"~"${re}",i]`, `["cuisine"~"${re}",i]`] };
}

const TAG_KEYS = ["amenity", "shop", "tourism", "leisure", "craft", "office", "historic", "railway", "natural", "place"];

async function run(selectors: string[], near: { lat: number; lng: number }, radiusM: number, fallbackCat: CategoryId | undefined, signal?: AbortSignal): Promise<Place[]> {
  const around = `(around:${radiusM},${near.lat},${near.lng})`;
  const body = `[out:json][timeout:15];(${selectors.map((s) => `nwr${s}["name"]${around};`).join("")});out center 80;`;
  let lastErr: unknown;
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, { method: "POST", body: `data=${encodeURIComponent(body)}`, headers: { "Content-Type": "application/x-www-form-urlencoded" }, signal });
      if (!res.ok) throw new Error(`Overpass ${res.status}`);
      const json = await res.json();
      const seen = new Set<string>();
      const out: Place[] = [];
      for (const el of json.elements ?? []) {
        const t = el.tags ?? {};
        const lat = el.lat ?? el.center?.lat, lng = el.lon ?? el.center?.lon;
        if (!t.name || lat == null || lng == null) continue;
        const id = `osm_${el.type[0].toUpperCase()}${el.id}`;
        if (seen.has(id)) continue;
        seen.add(id);
        const key = TAG_KEYS.find((k) => t[k]);
        const fromTags = key ? mapCategory(key, t[key]) : undefined;
        const category = fromTags && fromTags !== "gems" ? fromTags : fallbackCat ?? fromTags ?? "gems";
        const addr = [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" ") || undefined;
        const kind = key ? String(t[key]).replace(/_/g, " ") : undefined;
        const what = [t.cuisine?.replace(/_/g, " ").replace(/;/g, ", "), kind].filter(Boolean).join(" · ");
        out.push({ id, name: t.name, category, lat, lng, address: addr, website: t.website ?? t["contact:website"], hours: t.opening_hours,
          shortDescription: what ? what.charAt(0).toUpperCase() + what.slice(1) : undefined, source: "photon", sourceUpdatedAt: new Date().toISOString() });
      }
      return out;
    } catch (e) { lastErr = e; if (signal?.aborted) throw e; }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Search failed");
}

export async function searchOverpass(query: string, near: { lat: number; lng: number }, radiusM: number, signal?: AbortSignal): Promise<Place[]> {
  const plan = overpassPlan(query);
  if (!plan) return [];
  const key = `${plan.selectors.join("|")}@${near.lat.toFixed(3)},${near.lng.toFixed(3)}:${radiusM}`;
  if (cache.has(key)) return cache.get(key)!;
  let places = await run(plan.selectors, near, radiusM, plan.category, signal);
  // Niche searches ("ethiopian", "shawarma") often need a wider net.
  if (places.length < 5 && radiusM < 5000) places = await run(plan.selectors, near, 5000, plan.category, signal);
  cache.set(key, places);
  return places;
}

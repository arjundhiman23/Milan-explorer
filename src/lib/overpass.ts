import type { Place } from "@/types";
import { matchSynonyms } from "./search";

// Live category search on OpenStreetMap via Overpass: "pizza" → every
// pizzeria within the radius of the origin, named or not. Public endpoint,
// so keep queries small and cached.
const ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
const cache = new Map<string, Place[]>();

export function overpassFiltersFor(query: string): { filters: string[]; category: Place["category"] } | null {
  const syns = matchSynonyms(query).filter((s) => s.osm?.length);
  if (!syns.length) return null;
  return { filters: [...new Set(syns.flatMap((s) => s.osm!))], category: syns[0].category ?? "gems" };
}

export async function searchOverpass(query: string, near: { lat: number; lng: number }, radiusM: number, signal?: AbortSignal): Promise<Place[]> {
  const spec = overpassFiltersFor(query);
  if (!spec) return [];
  const key = `${spec.filters.join("|")}@${near.lat.toFixed(3)},${near.lng.toFixed(3)}:${radiusM}`;
  if (cache.has(key)) return cache.get(key)!;
  const around = `(around:${radiusM},${near.lat},${near.lng})`;
  const body = `[out:json][timeout:12];(${spec.filters.map((f) => `nwr[${f}]["name"]${around};`).join("")});out center 60;`;
  let lastErr: unknown;
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, { method: "POST", body: `data=${encodeURIComponent(body)}`, headers: { "Content-Type": "application/x-www-form-urlencoded" }, signal });
      if (!res.ok) throw new Error(`Overpass ${res.status}`);
      const json = await res.json();
      const seen = new Set<string>();
      const places: Place[] = [];
      for (const el of json.elements ?? []) {
        const t = el.tags ?? {};
        const lat = el.lat ?? el.center?.lat, lng = el.lon ?? el.center?.lon;
        if (!t.name || lat == null || lng == null) continue;
        const id = `osm_${el.type[0].toUpperCase()}${el.id}`;
        if (seen.has(id)) continue;
        seen.add(id);
        const addr = [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" ") || undefined;
        const what = [t.cuisine?.replace(/[_;]/g, " "), t.amenity ?? t.shop ?? t.tourism ?? t.leisure].filter(Boolean).join(" · ").replace(/_/g, " ");
        places.push({ id, name: t.name, category: spec.category, lat, lng, address: addr, website: t.website ?? t["contact:website"], hours: t.opening_hours,
          shortDescription: what ? what.charAt(0).toUpperCase() + what.slice(1) : undefined, source: "photon", sourceUpdatedAt: new Date().toISOString() });
      }
      cache.set(key, places);
      return places;
    } catch (e) { lastErr = e; if (signal?.aborted) throw e; }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Search failed");
}

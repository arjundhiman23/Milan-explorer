import type { CategoryId, Place } from "@/types";
import { MILAN_BBOX } from "./geo";

// Live place search via Photon (OpenStreetMap data, no API key).
// Terms: https://photon.komoot.io — fair use, attribute OSM.
const ENDPOINT = "https://photon.komoot.io/api/";

const OSM_TO_CATEGORY: Array<[RegExp, CategoryId]> = [
  [/^(cafe|coffee_shop|library|internet_cafe|coworking)/, "cafes"],
  [/^(restaurant|fast_food|bakery|ice_cream|pizza|food_court|bar|pub|biergarten|deli|pastry|confectionery)/, "food"],
  [/^(museum|gallery|theatre|cinema|arts_centre|place_of_worship|monument|memorial|castle|attraction|artwork|archaeological_site|ruins|viewpoint|university|college)/, "culture"],
  [/^(park|garden|nature_reserve|playground|dog_park|beach|water|river|canal|common|pitch|sports_centre|fitness_centre)/, "outdoors"],
  [/^(books|supermarket|convenience|marketplace|clothes|second_hand|gift|art|stationery|department_store|mall|shoes|music|vintage|antiques|boutique|florist|bicycle)/, "shopping"],
  [/^(pharmacy|chemist|laundry|dry_cleaning|post_office|bank|atm|hospital|doctors|dentist|clinic|police|bus_station|station|subway_entrance|copyshop|mobile_phone)/, "essentials"],
];

export function mapCategory(osmKey?: string, osmValue?: string): CategoryId {
  const v = (osmValue ?? "").toLowerCase();
  if (osmKey === "shop" && /^(supermarket|convenience|chemist|laundry)/.test(v)) return "essentials";
  if (osmKey === "shop") return "shopping";
  for (const [re, cat] of OSM_TO_CATEGORY) if (re.test(v)) return cat;
  return "gems";
}

export interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_id: number; osm_type: string; osm_key?: string; osm_value?: string;
    name?: string; street?: string; housenumber?: string; district?: string;
    city?: string; postcode?: string; website?: string; opening_hours?: string;
  };
}

export async function searchPhoton(query: string, near?: { lat: number; lng: number }, limit = 12, signal?: AbortSignal): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  // No lang param: Photon then returns local (Italian) names, as signs show them.
  const params = new URLSearchParams({ q, limit: String(limit) });
  params.set("bbox", `${MILAN_BBOX.west},${MILAN_BBOX.south},${MILAN_BBOX.east},${MILAN_BBOX.north}`);
  if (near) { params.set("lat", String(near.lat)); params.set("lon", String(near.lng)); }
  const res = await fetch(`${ENDPOINT}?${params.toString()}`, { signal });
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  const json = (await res.json()) as { features: PhotonFeature[] };
  const seen = new Set<string>();
  return json.features
    .filter((f) => f.properties.name)
    .map((f) => {
      const pr = f.properties;
      const id = `osm_${pr.osm_type}${pr.osm_id}`;
      const address = [pr.street, pr.housenumber].filter(Boolean).join(" ") || undefined;
      const place: Place = {
        id,
        name: pr.name!,
        category: mapCategory(pr.osm_key, pr.osm_value),
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        address,
        neighbourhood: pr.district,
        website: pr.website,
        hours: pr.opening_hours,
        shortDescription: pr.osm_value ? humanize(pr.osm_value) : undefined,
        source: "photon",
        sourceUpdatedAt: new Date().toISOString(),
      };
      return place;
    })
    .filter((pl) => (seen.has(pl.id) ? false : (seen.add(pl.id), true)));
}

function humanize(s: string) {
  return s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

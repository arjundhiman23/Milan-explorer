import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore, originOf, activeUserPlaces } from "@/store/useStore";
import { distanceMeters } from "@/lib/geo";
import type { CategoryId, Place, UserPlace } from "@/types";

export interface PlaceWithMeta {
  place: Place;
  user?: UserPlace;
  distance: number;
}

export function useOrigin() {
  return useStore(useShallow(originOf));
}

// Places near the active origin, filtered by chips, radius and hidden categories.
export function useNearbyPlaces(opts: { ignoreRadius?: boolean; categories?: CategoryId[] } = {}): PlaceWithMeta[] {
  const places = useStore((s) => s.places);
  const userPlaces = useStore((s) => s.userPlaces);
  const active = useStore((s) => s.activeCategories);
  const radius = useStore((s) => s.radius);
  const hidden = useStore((s) => s.settings.hiddenCategories);
  const origin = useOrigin();
  const cats = opts.categories ?? active;

  return useMemo(() => {
    const out: PlaceWithMeta[] = [];
    for (const place of Object.values(places)) {
      if (hidden.includes(place.category)) continue;
      if (cats.length && !cats.includes(place.category)) continue;
      const user = userPlaces[place.id];
      const u = user && !user.deletedAt ? user : undefined;
      // Search results that were never saved stay out of the ambient map.
      if (place.source === "photon" && !u) continue;
      const distance = distanceMeters(origin, place);
      if (!opts.ignoreRadius && distance > radius) continue;
      out.push({ place, user: u, distance });
    }
    return out.sort((a, b) => a.distance - b.distance);
  }, [places, userPlaces, cats, radius, hidden, origin.lat, origin.lng, opts.ignoreRadius]);
}

export function useMyPlaces(): PlaceWithMeta[] {
  const places = useStore((s) => s.places);
  const ups = useStore(useShallow(activeUserPlaces));
  const origin = useOrigin();
  return useMemo(
    () => ups.map((u) => ({ user: u, place: places[u.placeId], distance: places[u.placeId] ? distanceMeters(origin, places[u.placeId]) : 0 })).filter((x) => x.place),
    [places, ups, origin.lat, origin.lng],
  );
}

export function usePlace(id: string | undefined): PlaceWithMeta | null {
  const place = useStore((s) => (id ? s.places[id] : undefined));
  const user = useStore((s) => (id ? s.userPlaces[id] : undefined));
  const origin = useOrigin();
  if (!place) return null;
  return { place, user: user && !user.deletedAt ? user : undefined, distance: distanceMeters(origin, place) };
}

export function useStats() {
  const ups = useStore(useShallow(activeUserPlaces));
  return useMemo(
    () => ({
      saved: ups.filter((u) => u.verdict === "want").length,
      visited: ups.filter((u) => u.visitedAt).length,
      favourites: ups.filter((u) => u.verdict === "again").length,
    }),
    [ups],
  );
}

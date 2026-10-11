export interface LatLng { lat: number; lng: number }

export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function formatDistance(m: number): string {
  if (m < 950) return `${Math.round(m / 10) * 10} m`;
  return `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
}

export function walkMinutes(m: number): number {
  return Math.max(1, Math.round(m / 80));
}

export function formatRadius(m: number): string {
  return m >= 1000 ? `${m / 1000} km` : `${m} m`;
}

export const MILAN_BBOX = { west: 9.04, south: 45.38, east: 9.30, north: 45.56 };

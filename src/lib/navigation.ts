import { Linking, Platform } from "react-native";
import type { Place } from "@/types";

// Hands off to an installed maps app (FR-07). geo: URI lets Android pick
// Google Maps or any compatible navigation app; web falls back to Google Maps.
export async function openInMaps(place: Place) {
  const label = encodeURIComponent(place.name);
  const geo = `geo:${place.lat},${place.lng}?q=${place.lat},${place.lng}(${label})`;
  const gmaps = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&destination_place_id=&travelmode=walking`;
  if (Platform.OS === "android") {
    try {
      if (await Linking.canOpenURL(geo)) return Linking.openURL(geo);
    } catch {}
  }
  return Linking.openURL(gmaps);
}

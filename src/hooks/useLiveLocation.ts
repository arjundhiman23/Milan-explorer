import { useCallback, useState } from "react";
import * as Location from "expo-location";
import { useStore } from "@/store/useStore";

// Foreground-only, on demand (FR-08 / §13). Never requests background access.
export function useLiveLocation() {
  const [state, setState] = useState<"idle" | "asking" | "denied" | "error" | "ok">("idle");
  const setLive = useStore((s) => s.setLiveLocation);
  const setMode = useStore((s) => s.setLocationMode);

  const locate = useCallback(async () => {
    setState("asking");
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) { setState("denied"); return null; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setLive(loc);
      setMode("live");
      setState("ok");
      return loc;
    } catch {
      setState("error");
      return null;
    }
  }, [setLive, setMode]);

  return { state, locate };
}

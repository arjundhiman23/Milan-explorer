import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { scheduleSync } from "@/lib/sync";

// Pushes changes to Supabase shortly after they happen, when signed in.
export function useSyncOnChange() {
  useEffect(() => {
    return useStore.subscribe((s, prev) => {
      if (s.dirty && (s.userPlaces !== prev.userPlaces || s.bases !== prev.bases) && s.userId) scheduleSync();
    });
  }, []);
}

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import { syncNow } from "@/lib/sync";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabaseConfigured);
  const setUserId = useStore((s) => s.setUserId);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUserId(data.session?.user.id ?? null);
      setReady(true);
      if (data.session) syncNow().catch(() => {});
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUserId(s?.user.id ?? null);
      if (s) syncNow().catch(() => {});
    });
    return () => sub.subscription.unsubscribe();
  }, [setUserId]);

  return { session, ready, configured: supabaseConfigured };
}

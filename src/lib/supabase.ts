import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Tolerate quotes and whitespace around values in .env.
const clean = (v?: string) => (v ?? "").trim().replace(/^["']|["']$/g, "");
const url = clean(process.env.EXPO_PUBLIC_SUPABASE_URL);
const anon = clean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

const urlValid = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url);
export const supabaseConfigured = urlValid && anon.length > 20 && !url.includes("your-project");

if (!supabaseConfigured && (url || anon)) {
  console.warn(
    `[Milan Explorer] Supabase keys ignored. URL="${url}" ${urlValid ? "ok" : "is not a valid https://xxxx.supabase.co URL"}; ` +
    `key ${anon ? `starts with "${anon.slice(0, 8)}…"` : "is empty"}. Check .env and restart with --clear.`,
  );
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  if (!client) {
    client = createClient(url, anon, {
      auth: {
        storage: Platform.OS === "web" ? undefined : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === "web",
      },
    });
  }
  return client;
}

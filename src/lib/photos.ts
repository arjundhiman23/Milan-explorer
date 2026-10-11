import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";
import { getSupabase } from "./supabase";
import { useStore } from "@/store/useStore";
import { uid } from "./ids";

export const BUCKET = "visit-photos";
const REMOTE_PREFIX = "sb://";

// Opens the photo library only when the user asks (FR-12).
export async function pickPhotos(): Promise<string[]> {
  if (Platform.OS !== "web") {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return [];
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    selectionLimit: 4,
    quality: 0.7,
    base64: Platform.OS === "web",
  });
  if (res.canceled) return [];
  return res.assets.map((a) => (Platform.OS === "web" && a.base64 ? `data:${a.mimeType ?? "image/jpeg"};base64,${a.base64}` : a.uri));
}

export const isRemote = (uri: string) => uri.startsWith(REMOTE_PREFIX);

export async function uploadPendingPhotos(userId: string) {
  const sb = getSupabase();
  if (!sb) return;
  const st = useStore.getState();
  for (const up of Object.values(st.userPlaces)) {
    if (!up.photoUris?.length || up.deletedAt) continue;
    const pending = up.photoUris.filter((u) => !isRemote(u));
    if (!pending.length) continue;
    const next = [...up.photoUris];
    for (const local of pending) {
      try {
        const blob = await (await fetch(local)).blob();
        const path = `${userId}/${up.placeId}/${uid()}.jpg`;
        const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: false });
        if (error) throw error;
        next[next.indexOf(local)] = REMOTE_PREFIX + path;
      } catch {
        // Leave the local URI in place; retried on the next sync.
      }
    }
    if (next.some((u, i) => u !== up.photoUris![i])) {
      useStore.setState((s) => ({ userPlaces: { ...s.userPlaces, [up.placeId]: { ...up, photoUris: next } } }));
    }
  }
}

const signedCache = new Map<string, { url: string; exp: number }>();

export async function resolvePhoto(uri: string): Promise<string | null> {
  if (!isRemote(uri)) return uri;
  const cached = signedCache.get(uri);
  if (cached && cached.exp > Date.now()) return cached.url;
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(uri.slice(REMOTE_PREFIX.length), 3600);
  if (error || !data) return null;
  signedCache.set(uri, { url: data.signedUrl, exp: Date.now() + 3500_000 });
  return data.signedUrl;
}

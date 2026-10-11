import { getSupabase } from "./supabase";
import { useStore } from "@/store/useStore";
import type { BaseLocation, Place, UserPlace } from "@/types";
import { uploadPendingPhotos } from "./photos";

// Local-first sync. Local store is always the source of truth for the UI;
// Supabase is a per-user backup that is pushed after every change and pulled
// on sign-in / app start. Conflicts resolve by newest updatedAt.

let inFlight: Promise<void> | null = null;

export async function syncNow(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const sb = getSupabase();
    if (!sb) return;
    const { data: sess } = await sb.auth.getSession();
    const user = sess.session?.user;
    if (!user) return;
    const s = useStore.getState();

    // 1. Upload any local photos that are not yet in storage.
    await uploadPendingPhotos(user.id);

    // 2. Push local rows.
    const st = useStore.getState();
    const ups = Object.values(st.userPlaces);
    const referenced = new Set(ups.map((u) => u.placeId));
    const places = Object.values(st.places).filter((p) => referenced.has(p.id));

    if (places.length) {
      const { error } = await sb.from("places").upsert(places.map(placeToRow), { onConflict: "id" });
      if (error) throw error;
    }
    if (ups.length) {
      const { error } = await sb.from("user_places").upsert(ups.map((u) => userPlaceToRow(u, user.id)), { onConflict: "user_id,place_id" });
      if (error) throw error;
    }
    if (st.bases.length) {
      const { error } = await sb.from("bases").upsert(st.bases.map((b) => baseToRow(b, user.id)), { onConflict: "user_id,id" });
      if (error) throw error;
    }

    // 3. Pull everything and merge newest-wins.
    const [upRes, baseRes] = await Promise.all([
      sb.from("user_places").select("*").eq("user_id", user.id),
      sb.from("bases").select("*").eq("user_id", user.id),
    ]);
    if (upRes.error) throw upRes.error;
    if (baseRes.error) throw baseRes.error;
    const remoteUps = (upRes.data ?? []).map(rowToUserPlace);
    const placeIds = remoteUps.map((u) => u.placeId).filter((id) => !s.places[id]);
    let remotePlaces: Place[] = [];
    if (placeIds.length) {
      const { data, error } = await sb.from("places").select("*").in("id", placeIds);
      if (error) throw error;
      remotePlaces = (data ?? []).map(rowToPlace);
    }
    useStore.getState().applyRemote({ userPlaces: remoteUps, bases: (baseRes.data ?? []).map(rowToBase), places: remotePlaces });
    useStore.getState().markSynced();
  })().finally(() => { inFlight = null; });
  return inFlight;
}

export function scheduleSync(delay = 1500) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { syncNow().catch(() => {}); }, delay);
}
let timer: ReturnType<typeof setTimeout> | null = null;

// ── Row mappers ───────────────────────────────────────────────────────────
function placeToRow(p: Place) {
  return {
    id: p.id, name: p.name, category: p.category, lat: p.lat, lng: p.lng,
    address: p.address ?? null, short_description: p.shortDescription ?? null, neighbourhood: p.neighbourhood ?? null,
    hours: p.hours ?? null, website: p.website ?? null, price_level: p.priceLevel ?? null, photo: p.photo ?? null,
    source: p.source, source_updated_at: p.sourceUpdatedAt ?? null, tags: p.tags ?? null,
  };
}
function rowToPlace(r: any): Place {
  return {
    id: r.id, name: r.name, category: r.category, lat: r.lat, lng: r.lng,
    address: r.address ?? undefined, shortDescription: r.short_description ?? undefined, neighbourhood: r.neighbourhood ?? undefined,
    hours: r.hours ?? undefined, website: r.website ?? undefined, priceLevel: r.price_level ?? undefined, photo: r.photo ?? undefined,
    source: r.source, sourceUpdatedAt: r.source_updated_at ?? undefined, tags: r.tags ?? undefined,
  };
}
function userPlaceToRow(u: UserPlace, userId: string) {
  return {
    id: u.id, user_id: userId, place_id: u.placeId, verdict: u.verdict,
    saved_at: u.savedAt ?? null, visited_at: u.visitedAt ?? null, rating: u.rating ?? null,
    note: u.note ?? null, tags: u.tags ?? null, photo_uris: u.photoUris ?? null,
    created_at: u.createdAt, updated_at: u.updatedAt, deleted_at: u.deletedAt ?? null,
  };
}
function rowToUserPlace(r: any): UserPlace {
  return {
    id: r.id, placeId: r.place_id, verdict: r.verdict,
    savedAt: r.saved_at ?? undefined, visitedAt: r.visited_at ?? undefined, rating: r.rating ?? undefined,
    note: r.note ?? undefined, tags: r.tags ?? undefined, photoUris: r.photo_uris ?? undefined,
    createdAt: r.created_at, updatedAt: r.updated_at, deletedAt: r.deleted_at ?? undefined,
  };
}
function baseToRow(b: BaseLocation, userId: string) {
  return { id: b.id, user_id: userId, label: b.label, lat: b.lat, lng: b.lng, is_default: b.isDefault ?? false };
}
function rowToBase(r: any): BaseLocation {
  return { id: r.id, label: r.label, lat: r.lat, lng: r.lng, isDefault: r.is_default ?? false };
}

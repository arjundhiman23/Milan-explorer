import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { BaseLocation, CategoryId, Place, Settings, UserPlace, Verdict } from "@/types";
import { SEED_PLACES } from "@/data/places.seed";
import { DEFAULT_BASES } from "@/data/bases";
import { nowIso, uid } from "@/lib/ids";
import { mergeBases, tombstoneBase } from "@/lib/merge";

export interface VisitInput {
  rating: number;
  verdict: Exclude<Verdict, "want">;
  note?: string;
  tags?: string[];
  photoUris?: string[];
  visitedAt?: string;
}

interface State {
  places: Record<string, Place>;
  userPlaces: Record<string, UserPlace>; // keyed by placeId
  bases: BaseLocation[];
  settings: Settings;
  // transient UI state (also persisted so filters survive restarts, harmlessly)
  activeCategories: CategoryId[];
  radius: number;
  selectedPlaceId: string | null;
  liveLocation: { lat: number; lng: number } | null;
  // sync bookkeeping
  dirty: boolean;
  lastSyncAt: string | null;
  userId: string | null;
  stamp: { placeId: string; at: number } | null;

  upsertPlace: (p: Place) => void;
  upsertPlaces: (ps: Place[]) => void;
  savePlace: (placeId: string) => void;
  setVerdict: (placeId: string, verdict: Verdict) => void;
  logVisit: (placeId: string, v: VisitInput) => void;
  removeUserPlace: (placeId: string) => void;
  addBase: (b: Omit<BaseLocation, "id">) => string;
  updateBase: (id: string, patch: Partial<BaseLocation>) => void;
  removeBase: (id: string) => void;
  setActiveBase: (id: string) => void;
  setLocationMode: (mode: Settings["locationMode"]) => void;
  setLiveLocation: (loc: { lat: number; lng: number } | null) => void;
  setSettings: (patch: Partial<Settings>) => void;
  toggleCategory: (id: CategoryId) => void;
  setCategories: (ids: CategoryId[]) => void;
  setRadius: (m: number) => void;
  select: (placeId: string | null) => void;
  applyRemote: (data: { userPlaces: UserPlace[]; bases: BaseLocation[]; places: Place[] }) => void;
  markSynced: () => void;
  setUserId: (id: string | null) => void;
  setStamp: (placeId: string | null) => void;
  importData: (data: { userPlaces?: UserPlace[]; places?: Place[]; bases?: BaseLocation[] }) => void;
  clearPersonalData: () => void;
}

const seedMap = Object.fromEntries(SEED_PLACES.map((p) => [p.id, p]));

const defaultSettings: Settings = {
  reducedMotion: false,
  defaultRadius: 1000,
  hiddenCategories: [],
  onboarded: false,
  activeBaseId: "santa-sofia",
  locationMode: "base",
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      places: seedMap,
      userPlaces: {},
      bases: DEFAULT_BASES,
      settings: defaultSettings,
      activeCategories: [],
      radius: 1000,
      selectedPlaceId: null,
      liveLocation: null,
      dirty: false,
      lastSyncAt: null,
      userId: null,
      stamp: null,

      upsertPlace: (p) => set((s) => ({ places: { ...s.places, [p.id]: { ...s.places[p.id], ...p } } })),
      upsertPlaces: (ps) =>
        set((s) => {
          const places = { ...s.places };
          for (const p of ps) places[p.id] = { ...places[p.id], ...p };
          return { places };
        }),

      savePlace: (placeId) =>
        set((s) => {
          const existing = s.userPlaces[placeId];
          if (existing && !existing.deletedAt) return {};
          const t = nowIso();
          const up: UserPlace = { id: existing?.id ?? uid("up"), placeId, verdict: "want", savedAt: t, createdAt: existing?.createdAt ?? t, updatedAt: t };
          return { userPlaces: { ...s.userPlaces, [placeId]: up }, dirty: true };
        }),

      setVerdict: (placeId, verdict) =>
        set((s) => {
          const t = nowIso();
          const prev = s.userPlaces[placeId];
          const up: UserPlace = prev
            ? { ...prev, verdict, deletedAt: undefined, updatedAt: t }
            : { id: uid("up"), placeId, verdict, savedAt: t, createdAt: t, updatedAt: t };
          return { userPlaces: { ...s.userPlaces, [placeId]: up }, dirty: true };
        }),

      logVisit: (placeId, v) =>
        set((s) => {
          const t = nowIso();
          const prev = s.userPlaces[placeId];
          const up: UserPlace = {
            id: prev?.id ?? uid("up"),
            placeId,
            verdict: v.verdict,
            savedAt: prev?.savedAt ?? t,
            visitedAt: v.visitedAt ?? prev?.visitedAt ?? t,
            rating: v.rating,
            note: v.note?.trim() || undefined,
            tags: v.tags?.length ? v.tags : undefined,
            photoUris: v.photoUris?.length ? v.photoUris : undefined,
            createdAt: prev?.createdAt ?? t,
            updatedAt: t,
          };
          return { userPlaces: { ...s.userPlaces, [placeId]: up }, dirty: true };
        }),

      removeUserPlace: (placeId) =>
        set((s) => {
          const prev = s.userPlaces[placeId];
          if (!prev) return {};
          const t = nowIso();
          // Tombstone so the deletion syncs; filtered out everywhere in the UI.
          return { userPlaces: { ...s.userPlaces, [placeId]: { ...prev, deletedAt: t, updatedAt: t } }, dirty: true };
        }),

      addBase: (b) => {
        const id = uid("base");
        set((s) => ({ bases: [...s.bases, { ...b, id, updatedAt: nowIso() }], dirty: true }));
        return id;
      },
      updateBase: (id, patch) => set((s) => ({ bases: s.bases.map((b) => (b.id === id ? { ...b, ...patch, updatedAt: nowIso() } : b)), dirty: true })),
      removeBase: (id) =>
        set((s) => {
          // Tombstone instead of filtering out: a missing row can't tell sync
          // "this was deleted", so the server copy used to be pulled straight back.
          const t = nowIso();
          const bases = tombstoneBase(s.bases, id, t);
          const firstActive = bases.find((b) => !b.deletedAt)?.id ?? "";
          const activeBaseId = s.settings.activeBaseId === id ? firstActive : s.settings.activeBaseId;
          return { bases, settings: { ...s.settings, activeBaseId }, dirty: true };
        }),
      setActiveBase: (id) => set((s) => ({ settings: { ...s.settings, activeBaseId: id, locationMode: "base" }, selectedPlaceId: null })),
      setLocationMode: (mode) => set((s) => ({ settings: { ...s.settings, locationMode: mode } })),
      setLiveLocation: (loc) => set({ liveLocation: loc }),
      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      toggleCategory: (id) =>
        set((s) => ({
          activeCategories: s.activeCategories.includes(id) ? s.activeCategories.filter((c) => c !== id) : [...s.activeCategories, id],
          selectedPlaceId: null,
        })),
      setCategories: (ids) => set({ activeCategories: ids, selectedPlaceId: null }),
      setRadius: (m) => set({ radius: m, selectedPlaceId: null }),
      select: (placeId) => set({ selectedPlaceId: placeId }),

      applyRemote: ({ userPlaces, bases, places }) =>
        set((s) => {
          const merged = { ...s.userPlaces };
          for (const r of userPlaces) {
            const local = merged[r.placeId];
            if (!local || new Date(r.updatedAt) >= new Date(local.updatedAt)) merged[r.placeId] = r;
          }
          const merged2 = mergeBases(s.bases, bases);
          const placeMap = { ...s.places };
          for (const p of places) placeMap[p.id] = { ...placeMap[p.id], ...p };
          const activeOk = merged2.some((b) => b.id === s.settings.activeBaseId && !b.deletedAt);
          const settings = activeOk ? s.settings : { ...s.settings, activeBaseId: merged2.find((b) => !b.deletedAt)?.id ?? "" };
          return { userPlaces: merged, bases: merged2, places: placeMap, settings };
        }),
      markSynced: () => set({ dirty: false, lastSyncAt: nowIso() }),
      setUserId: (id) => set({ userId: id }),
      setStamp: (placeId) => set({ stamp: placeId ? { placeId, at: Date.now() } : null }),

      importData: (data) =>
        set((s) => {
          const userPlaces = { ...s.userPlaces };
          for (const up of data.userPlaces ?? []) userPlaces[up.placeId] = up;
          const places = { ...s.places };
          for (const p of data.places ?? []) places[p.id] = p;
          return { userPlaces, places, bases: mergeBases(s.bases, data.bases ?? []), dirty: true };
        }),

      clearPersonalData: () =>
        set((s) => {
          const t = nowIso();
          const tomb: Record<string, UserPlace> = {};
          for (const up of Object.values(s.userPlaces)) tomb[up.placeId] = { ...up, deletedAt: t, updatedAt: t };
          return { userPlaces: tomb, dirty: true, selectedPlaceId: null };
        }),
    }),
    {
      name: "milan-explorer-v1",
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persisted: any, fromVersion) => {
        // v2: Comasina is no longer a base. Tombstone it so the removal also syncs.
        if (persisted && fromVersion < 2 && Array.isArray(persisted.bases)) {
          const t = nowIso();
          persisted.bases = persisted.bases.map((b: BaseLocation) => (b.id === "comasina" && !b.deletedAt ? { ...b, deletedAt: t, updatedAt: t } : b));
          if (persisted.settings?.activeBaseId === "comasina") persisted.settings.activeBaseId = "santa-sofia";
          persisted.dirty = true;
        }
        return persisted;
      },
      partialize: (s) => ({
        places: s.places,
        userPlaces: s.userPlaces,
        bases: s.bases,
        settings: s.settings,
        activeCategories: s.activeCategories,
        radius: s.radius,
        dirty: s.dirty,
        lastSyncAt: s.lastSyncAt,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        // Keep curated seed fresh: seed wins for curated fields, user-added places survive.
        const places = { ...(p.places ?? {}), ...seedMap };
        return { ...current, ...p, places, settings: { ...defaultSettings, ...(p.settings ?? {}) } };
      },
    },
  ),
);

// ── Selectors ─────────────────────────────────────────────────────────────
export const activeUserPlaces = (s: State) => Object.values(s.userPlaces).filter((u) => !u.deletedAt);
export const activeBases = (s: State) => s.bases.filter((b) => !b.deletedAt);

export function originOf(s: State): { lat: number; lng: number; label: string } {
  if (s.settings.locationMode === "live" && s.liveLocation) return { ...s.liveLocation, label: "Current location" };
  const live = activeBases(s);
  const base = live.find((b) => b.id === s.settings.activeBaseId) ?? live[0];
  return base ? { lat: base.lat, lng: base.lng, label: base.label } : { lat: 45.4642, lng: 9.19, label: "Milan" };
}

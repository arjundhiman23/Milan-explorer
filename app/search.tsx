import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, TextInput, View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/Text";
import { CATEGORIES } from "@/data/categories";
import { useShallow } from "zustand/react/shallow";
import { useStore, originOf } from "@/store/useStore";
import { searchPhoton } from "@/lib/photon";
import { searchOverpass, overpassFiltersFor } from "@/lib/overpass";
import { scoreLocal } from "@/lib/search";
import { distanceMeters, formatDistance } from "@/lib/geo";
import { categoryColors, colors, fonts, radius, space } from "@/theme/tokens";
import type { Place } from "@/types";

type Row = { place: Place; distance: number; section: "local" | "osm"; score?: number };

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState("");
  const [osm, setOsm] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const places = useStore((s) => s.places);
  const origin = useStore(useShallow(originOf));
  const upsertPlace = useStore((s) => s.upsertPlace);
  const select = useStore((s) => s.select);
  const setCategories = useStore((s) => s.setCategories);

  const radius = useStore((s) => s.radius);

  // Local: fuzzy name match + synonyms ("pizza" finds every pizzeria, "study" finds libraries).
  const local = useMemo<Row[]>(() => {
    if (!q.trim()) return [];
    return scoreLocal(q, Object.values(places))
      .map(({ place, score }) => ({ place, score, distance: distanceMeters(origin, place), section: "local" as const }))
      .sort((a, b) => b.score - a.score || a.distance - b.distance)
      .slice(0, 20);
  }, [q, places, origin]);

  useEffect(() => {
    abort.current?.abort();
    setError(null);
    if (q.trim().length < 3) { setOsm([]); setLoading(false); return; }
    const ctrl = new AbortController();
    abort.current = ctrl;
    setLoading(true);
    const t = setTimeout(() => {
      // Name search (Photon) plus, when the query names a kind of place,
      // a category search around the origin (Overpass).
      const jobs: Promise<Place[]>[] = [searchPhoton(q, origin, 10, ctrl.signal)];
      if (overpassFiltersFor(q)) jobs.push(searchOverpass(q, origin, Math.max(radius, 2000), ctrl.signal).catch(() => []));
      Promise.all(jobs)
        .then((lists) => {
          if (ctrl.signal.aborted) return;
          const seen = new Set<string>();
          const merged = lists.flat().filter((p) => !places[p.id] && !seen.has(p.id) && seen.add(p.id));
          merged.sort((a, b) => distanceMeters(origin, a) - distanceMeters(origin, b));
          setOsm(merged.slice(0, 30));
        })
        .catch((e) => { if (!ctrl.signal.aborted) setError(e?.message ?? "Search failed"); })
        .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    }, 350);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q, origin.lat, origin.lng, radius]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows: Row[] = [...local, ...osm.map((place) => ({ place, distance: distanceMeters(origin, place), section: "osm" as const }))];

  const open = (row: Row) => {
    if (row.section === "osm") upsertPlace(row.place);
    setCategories([]);
    select(row.place.id);
    router.replace(`/place/${row.place.id}`);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.bar}>
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close search"><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable>
        <TextInput autoFocus value={q} onChangeText={setQ} placeholder="Cafés, museums, a street name…" placeholderTextColor={colors.inkFaint} style={styles.input} returnKeyType="search" accessibilityLabel="Search" />
        {q.length > 0 && <Pressable onPress={() => setQ("")} hitSlop={8} accessibilityLabel="Clear"><Ionicons name="close-circle" size={20} color={colors.inkFaint} /></Pressable>}
      </View>

      {!q.trim() ? (
        <View style={{ padding: space.xl }}>
          <Text v="label" color={colors.inkMuted} style={{ marginBottom: 10 }}>Try a category</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {CATEGORIES.map((c) => (
              <Pressable key={c.id} onPress={() => setQ(c.label)} style={styles.catChip}>
                <Ionicons name={c.icon as any} size={14} color={categoryColors[c.id]} />
                <Text v="smallMedium" style={{ marginLeft: 6 }}>{c.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text v="small" color={colors.inkMuted} style={{ marginTop: space.xl }}>Search by name, or by what you want — "pizza", "study", "gelato", "supermarket" — to see everything nearby, including places not on this map yet.</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.section + r.place.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          ListHeaderComponent={local.length ? <Text v="label" color={colors.inkMuted} style={styles.sectionHead}>Your map</Text> : null}
          renderItem={({ item, index }) => {
            const cat = CATEGORIES.find((c) => c.id === item.place.category)!;
            const firstOsm = item.section === "osm" && (index === 0 || rows[index - 1].section === "local");
            return (
              <>
                {firstOsm && <Text v="label" color={colors.inkMuted} style={styles.sectionHead}>Nearby from OpenStreetMap</Text>}
                <Pressable onPress={() => open(item)} style={styles.row} accessibilityRole="button">
                  <View style={[styles.dot, { backgroundColor: categoryColors[item.place.category] }]}><Ionicons name={cat.icon as any} size={15} color={colors.white} /></View>
                  <View style={{ flex: 1 }}>
                    <Text v="bodyMedium" numberOfLines={1}>{item.place.name}</Text>
                    <Text v="small" color={colors.inkMuted} numberOfLines={1}>{[item.place.shortDescription?.split(".")[0], item.place.address ?? item.place.neighbourhood].filter(Boolean).join(" · ")}</Text>
                  </View>
                  <Text v="smallMedium" color={colors.inkSoft}>{formatDistance(item.distance)}</Text>
                </Pressable>
              </>
            );
          }}
          ListFooterComponent={
            <View style={{ padding: space.xl, alignItems: "center" }}>
              {loading && <ActivityIndicator color={colors.inkMuted} />}
              {error && <Text v="small" color={colors.rosso} center>{error}. Check your connection and try again.</Text>}
              {!loading && !error && !rows.length && q.trim().length >= 3 && <Text v="small" color={colors.inkMuted} center>No matches in Milan. Try a shorter name or the street.</Text>}
              {osm.length > 0 && <Text v="small" color={colors.inkFaint} center style={{ marginTop: 8 }}>Search data © OpenStreetMap contributors via Photon</Text>}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.marble },
  bar: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, height: 52, paddingHorizontal: 14, backgroundColor: colors.white, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, gap: 10 },
  input: { flex: 1, fontFamily: fonts.body, fontSize: 16, color: colors.ink, height: 52 },
  catChip: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, height: 36, paddingHorizontal: 12 },
  sectionHead: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  dot: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
});

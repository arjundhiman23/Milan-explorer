import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/Text";
import { Chip } from "@/components/ui/Chip";
import { PlaceCard } from "@/components/PlaceCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExploreMap } from "@/components/map/ExploreMap";
import type { MapHandle } from "@/components/map/types";
import { useMyPlaces, useOrigin, useStats } from "@/hooks/usePlaces";
import { useStore } from "@/store/useStore";
import { CATEGORIES, VERDICTS } from "@/data/categories";
import { categoryColors, colors, radius, space, verdictColors } from "@/theme/tokens";
import type { CategoryId, Verdict } from "@/types";

type Filter = "all" | Verdict | "visited";
type Sort = "recent" | "rating" | "distance";

export default function MyPlacesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const all = useMyPlaces();
  const stats = useStats();
  const origin = useOrigin();
  const reducedMotion = useStore((s) => s.settings.reducedMotion);
  const [filter, setFilter] = useState<Filter>("all");
  const [cat, setCat] = useState<CategoryId | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<Sort>("recent");
  const [view, setView] = useState<"list" | "map">("list");
  const [selected, setSelected] = useState<string | null>(null);
  const mapRef = useRef<MapHandle>(null);

  const items = useMemo(() => {
    let xs = all;
    if (filter === "visited") xs = xs.filter((x) => x.user?.visitedAt);
    else if (filter !== "all") xs = xs.filter((x) => x.user?.verdict === filter);
    if (cat) xs = xs.filter((x) => x.place.category === cat);
    if (minRating) xs = xs.filter((x) => (x.user?.rating ?? 0) >= minRating);
    const key = (x: typeof xs[number]) => x.user?.visitedAt ?? x.user?.savedAt ?? x.user?.updatedAt ?? "";
    return [...xs].sort((a, b) =>
      sort === "rating" ? (b.user?.rating ?? 0) - (a.user?.rating ?? 0) || a.distance - b.distance
      : sort === "distance" ? a.distance - b.distance
      : key(b).localeCompare(key(a)));
  }, [all, filter, cat, minRating, sort]);

  useEffect(() => {
    if (view === "map") setTimeout(() => mapRef.current?.fitTo(items.length ? items.map((i) => ({ lng: i.place.lng, lat: i.place.lat })) : [origin]), 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, items.length, filter, cat]);

  const hasAny = all.length > 0;
  const reset = () => { setFilter("all"); setCat(null); setMinRating(0); };

  const header = (
    <View style={{ paddingTop: insets.top + 16 }}>
      <View style={styles.titleRow}>
        <Text v="title">My places</Text>
        <View style={styles.viewToggle}>
          {(["list", "map"] as const).map((v) => (
            <Pressable key={v} onPress={() => setView(v)} accessibilityRole="button" accessibilityState={{ selected: view === v }} style={[styles.toggleBtn, view === v && styles.toggleOn]}>
              <Ionicons name={v === "list" ? "list" : "map-outline"} size={18} color={view === v ? colors.marble : colors.ink} />
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.stats}>
        <Stat n={stats.saved} label="want to go" color={verdictColors.want} />
        <Stat n={stats.visited} label="visited" color={colors.inkSoft} />
        <Stat n={stats.favourites} label="visit again" color={verdictColors.again} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <Chip label="All" active={filter === "all"} onPress={() => setFilter("all")} />
        {VERDICTS.map((v) => <Chip key={v.id} label={v.label} icon={v.icon as any} active={filter === v.id} color={verdictColors[v.id]} onPress={() => setFilter(v.id)} />)}
        <Chip label="Visited" icon="footsteps-outline" active={filter === "visited"} onPress={() => setFilter("visited")} />
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}>
        {CATEGORIES.map((c) => <Chip key={c.id} label={c.label} dot={categoryColors[c.id]} active={cat === c.id} color={categoryColors[c.id]} onPress={() => setCat(cat === c.id ? null : c.id)} />)}
      </ScrollView>
      <View style={styles.sortRow}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text v="small" color={colors.inkMuted}>Sort </Text>
          {(["recent", "rating", "distance"] as Sort[]).map((s) => (
            <Pressable key={s} onPress={() => setSort(s)} hitSlop={6} style={{ marginLeft: 10 }} accessibilityRole="button" accessibilityState={{ selected: sort === s }}>
              <Text v="smallMedium" color={sort === s ? colors.ink : colors.inkFaint} style={sort === s && { textDecorationLine: "underline" }}>{s}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={() => setMinRating((r) => (r >= 4 ? 0 : r + 1))} hitSlop={6} accessibilityRole="button" accessibilityLabel="Minimum rating" style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="star" size={13} color={minRating ? colors.saffron : colors.inkFaint} />
          <Text v="smallMedium" color={minRating ? colors.ink : colors.inkFaint} style={{ marginLeft: 4 }}>{minRating ? `${minRating}+` : "any"}</Text>
        </Pressable>
      </View>
    </View>
  );

  if (view === "map") {
    return (
      <View style={{ flex: 1 }}>
        <ExploreMap ref={mapRef} markers={items.map((i) => ({ place: i.place, user: i.user }))} selectedId={selected} origin={{ ...origin, live: false }}
          initial={{ lng: origin.lng, lat: origin.lat, zoom: 13 }} reducedMotion={reducedMotion} bottomInset={selected ? 170 : 24}
          onMarkerPress={(id) => { setSelected(id); const i = items.find((x) => x.place.id === id); if (i) mapRef.current?.flyTo({ lng: i.place.lng, lat: i.place.lat, zoom: 16 }); }}
          onMapPress={() => setSelected(null)} />
        <View style={[styles.mapHeader, { paddingTop: insets.top + 10 }]} pointerEvents="box-none">
          <View style={styles.titleRow}>
            <View style={styles.mapTitle}><Text v="cardTitle">{items.length} place{items.length === 1 ? "" : "s"}</Text></View>
            <View style={styles.viewToggle}>
              {(["list", "map"] as const).map((v) => (
                <Pressable key={v} onPress={() => setView(v)} accessibilityRole="button" style={[styles.toggleBtn, view === v && styles.toggleOn]}>
                  <Ionicons name={v === "list" ? "list" : "map-outline"} size={18} color={view === v ? colors.marble : colors.ink} />
                </Pressable>
              ))}
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10 }}>
            <Chip label="All" active={filter === "all"} onPress={() => setFilter("all")} />
            {VERDICTS.map((v) => <Chip key={v.id} label={v.label} icon={v.icon as any} active={filter === v.id} color={verdictColors[v.id]} onPress={() => setFilter(v.id)} />)}
            <Chip label="Visited" icon="footsteps-outline" active={filter === "visited"} onPress={() => setFilter("visited")} />
          </ScrollView>
        </View>
        {selected && (() => { const i = items.find((x) => x.place.id === selected); return i ? (
          <View style={{ position: "absolute", left: 16, right: 16, bottom: insets.bottom + 16 }}>
            <PlaceCard item={i} onOpen={() => router.push(`/place/${i.place.id}`)} />
          </View>) : null; })()}
      </View>
    );
  }

  return (
    <FlatList
      data={hasAny ? items : []}
      keyExtractor={(i) => i.place.id}
      ListHeaderComponent={header}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <PlaceCard item={item} onOpen={() => router.push(`/place/${item.place.id}`)} onVisited={() => router.push(`/review/${item.place.id}`)} />
        </View>
      )}
      ListEmptyComponent={
        hasAny
          ? <EmptyState icon="funnel-outline" title="No places match" body="Loosen the filters to see the rest of your map." action={{ title: "Reset filters", onPress: reset }} />
          : <EmptyState icon="bookmark-outline" title="Your map is empty" body="Save a place from Explore, or log a visit, and it will appear here with your own verdict." action={{ title: "Explore Milan", onPress: () => router.push("/(tabs)") }} />
      }
    />
  );
}

function Stat({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <View style={styles.stat}>
      <Text v="heading" color={color}>{n}</Text>
      <Text v="small" color={colors.inkMuted}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space.xl },
  viewToggle: { flexDirection: "row", backgroundColor: colors.white, borderRadius: radius.pill, padding: 3, borderWidth: 1, borderColor: colors.line },
  toggleBtn: { width: 38, height: 32, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  toggleOn: { backgroundColor: colors.ink },
  stats: { flexDirection: "row", paddingHorizontal: space.xl, marginTop: space.lg, marginBottom: space.sm, gap: 12 },
  stat: { flex: 1, backgroundColor: colors.white, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: colors.line },
  sortRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space.xl, paddingVertical: 12 },
  mapHeader: { position: "absolute", top: 0, left: 0, right: 0 },
  mapTitle: { backgroundColor: colors.white, height: 40, paddingHorizontal: 16, borderRadius: radius.pill, justifyContent: "center" },
});

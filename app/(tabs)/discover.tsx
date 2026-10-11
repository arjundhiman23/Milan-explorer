import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/Text";
import { Stars } from "@/components/ui/Stars";
import { useToast } from "@/components/ui/Toast";
import { useNearbyPlaces, useOrigin } from "@/hooks/usePlaces";
import { useStore } from "@/store/useStore";
import { CATEGORIES } from "@/data/categories";
import { categoryColors, colors, radius, shadow, space, verdictColors } from "@/theme/tokens";
import { formatDistance, walkMinutes } from "@/lib/geo";

export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const origin = useOrigin();
  const all = useNearbyPlaces({ ignoreRadius: true, categories: [] });
  const hidden = useStore((s) => s.settings.hiddenCategories);
  const savePlace = useStore((s) => s.savePlace);
  const select = useStore((s) => s.select);
  const setCategories = useStore((s) => s.setCategories);

  const groups = useMemo(() =>
    CATEGORIES.filter((c) => !hidden.includes(c.id)).map((c) => ({ cat: c, items: all.filter((x) => x.place.category === c.id).slice(0, 10) })).filter((g) => g.items.length),
  [all, hidden]);

  const closest = all.slice(0, 3);

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
      <View style={{ paddingHorizontal: space.xl }}>
        <Text v="title">Discover</Text>
        <Text v="body" color={colors.inkMuted} style={{ marginTop: 4 }}>Hand-picked places, measured from {origin.label}.</Text>
      </View>

      {closest.length > 0 && (
        <View style={styles.closest}>
          <Text v="label" color={colors.marble} style={{ opacity: 0.7 }}>Closest to you right now</Text>
          {closest.map((x, i) => (
            <Pressable key={x.place.id} onPress={() => router.push(`/place/${x.place.id}`)} accessibilityRole="button" style={[styles.closestRow, i > 0 && { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)" }]}>
              <View style={{ flex: 1 }}>
                <Text v="cardTitle" color={colors.marble}>{x.place.name}</Text>
                <Text v="small" color={colors.inkFaint}>{CATEGORIES.find((c) => c.id === x.place.category)?.label} · {walkMinutes(x.distance)} min walk</Text>
              </View>
              <Text v="smallMedium" color={colors.saffron}>{formatDistance(x.distance)}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {groups.map(({ cat, items }) => (
        <View key={cat.id} style={{ marginTop: space.xl }}>
          <Pressable onPress={() => { setCategories([cat.id]); select(null); router.push("/(tabs)"); }} accessibilityRole="button" accessibilityLabel={`Show ${cat.label} on the map`} style={styles.sectionHead}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={[styles.catDot, { backgroundColor: categoryColors[cat.id] }]}><Ionicons name={cat.icon as any} size={13} color={colors.white} /></View>
              <Text v="heading" style={{ marginLeft: 10 }}>{cat.label}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text v="smallMedium" color={colors.inkMuted}>Map</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />
            </View>
          </Pressable>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
            {items.map((x) => (
              <Pressable key={x.place.id} onPress={() => router.push(`/place/${x.place.id}`)} accessibilityRole="button" style={styles.tile}>
                <View style={[styles.tileBand, { backgroundColor: categoryColors[cat.id] }]} />
                <View style={{ padding: 14, flex: 1 }}>
                  <Text v="small" color={colors.inkMuted} numberOfLines={1}>{x.place.neighbourhood} · {formatDistance(x.distance)}</Text>
                  <Text v="cardTitle" numberOfLines={2} style={{ marginTop: 4 }}>{x.place.name}</Text>
                  <Text v="small" color={colors.inkMuted} numberOfLines={3} style={{ marginTop: 6, flex: 1 }}>{x.place.shortDescription}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                    {x.user ? (
                      x.user.rating ? <Stars value={x.user.rating} size={12} /> : <Text v="label" color={verdictColors[x.user.verdict]}>Saved</Text>
                    ) : (
                      <Pressable onPress={() => { savePlace(x.place.id); toast("Saved to Want to go", "bookmark"); }} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Save ${x.place.name}`} style={styles.saveBtn}>
                        <Ionicons name="bookmark-outline" size={14} color={colors.ink} />
                        <Text v="label" style={{ marginLeft: 4 }}>Save</Text>
                      </Pressable>
                    )}
                    {x.place.priceLevel ? <Text v="label" color={colors.inkFaint}>{"€".repeat(x.place.priceLevel)}</Text> : null}
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ))}
      <Text v="small" color={colors.inkFaint} center style={{ marginTop: space.xxl, paddingHorizontal: space.xl }}>Suggestions are hand-picked and not live listings. Check opening hours before you go.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  closest: { marginHorizontal: 16, marginTop: space.xl, backgroundColor: colors.ink, borderRadius: radius.lg, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 6, ...shadow.card },
  closestRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space.xl, marginBottom: 12 },
  catDot: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tile: { width: 230, height: 210, backgroundColor: colors.white, borderRadius: radius.lg, overflow: "hidden", ...shadow.card },
  tileBand: { height: 6 },
  saveBtn: { flexDirection: "row", alignItems: "center", height: 28, paddingHorizontal: 10, borderRadius: radius.pill, backgroundColor: colors.marbleDeep },
});

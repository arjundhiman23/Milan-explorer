import { useCallback, useEffect, useState } from "react";
import { Alert, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { Stars } from "@/components/ui/Stars";
import { VerdictBadge } from "@/components/ui/VerdictBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Stamp } from "@/components/Stamp";
import { useToast } from "@/components/ui/Toast";
import { usePlace } from "@/hooks/usePlaces";
import { useStore } from "@/store/useStore";
import { CATEGORIES, VERDICTS } from "@/data/categories";
import { categoryColors, colors, radius, shadow, space, verdictColors } from "@/theme/tokens";
import { formatDistance, walkMinutes } from "@/lib/geo";
import { openInMaps } from "@/lib/navigation";
import { resolvePhoto } from "@/lib/photos";
import type { Verdict } from "@/types";

export default function PlaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const item = usePlace(id);
  const savePlace = useStore((s) => s.savePlace);
  const setVerdict = useStore((s) => s.setVerdict);
  const removeUserPlace = useStore((s) => s.removeUserPlace);
  const reducedMotion = useStore((s) => s.settings.reducedMotion);
  const stamp = useStore((s) => s.stamp);
  const setStamp = useStore((s) => s.setStamp);
  const [showStamp, setShowStamp] = useState(false);

  useEffect(() => {
    if (stamp && stamp.placeId === id && Date.now() - stamp.at < 4000) { setShowStamp(true); setStamp(null); }
  }, [stamp, id, setStamp]);
  const onStampDone = useCallback(() => setShowStamp(false), []);

  if (!item) return <EmptyState title="Place not found" body="It may have been removed." action={{ title: "Back to map", onPress: () => router.back() }} />;
  const { place, user, distance } = item;
  const cat = CATEGORIES.find((c) => c.id === place.category)!;
  const color = categoryColors[place.category];

  const confirmRemove = () => {
    const doIt = () => { removeUserPlace(place.id); toast("Removed from your places"); };
    if (Platform.OS === "web") { if (confirm("Remove this place and its notes from your map?")) doIt(); return; }
    Alert.alert("Remove from My Places?", "Your rating, notes and photos for this place will be deleted.", [{ text: "Cancel", style: "cancel" }, { text: "Remove", style: "destructive", onPress: doIt }]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.marble }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 110 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: color, paddingTop: insets.top + 12 }]}>
          <View style={styles.heroTop}>
            <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back" style={styles.heroBtn}><Ionicons name="arrow-back" size={20} color={colors.white} /></Pressable>
            {user && <Pressable onPress={confirmRemove} hitSlop={10} accessibilityRole="button" accessibilityLabel="Remove from my places" style={styles.heroBtn}><Ionicons name="trash-outline" size={18} color={colors.white} /></Pressable>}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: space.xl }}>
            <Ionicons name={cat.icon as any} size={16} color="rgba(255,255,255,0.85)" />
            <Text v="label" color="rgba(255,255,255,0.85)" style={{ marginLeft: 6 }}>{cat.label}{place.neighbourhood ? `  ·  ${place.neighbourhood}` : ""}</Text>
          </View>
          <Text v="title" color={colors.white} style={{ marginTop: 8 }}>{place.name}</Text>
          <Text v="body" color="rgba(255,255,255,0.85)" style={{ marginTop: 6 }}>{formatDistance(distance)} away · about {walkMinutes(distance)} min on foot</Text>
        </View>

        <View style={styles.body}>
          {user ? (
            <View style={styles.statusCard}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <VerdictBadge verdict={user.verdict} />
                {user.rating ? <Stars value={user.rating} /> : null}
              </View>
              {user.visitedAt && <Text v="small" color={colors.inkMuted} style={{ marginTop: 10 }}>Visited {new Date(user.visitedAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</Text>}
              {user.note ? <Text v="body" style={{ marginTop: 10, fontStyle: "italic" }}>“{user.note}”</Text> : null}
              {user.tags?.length ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  {user.tags.map((t) => <View key={t} style={styles.tag}><Text v="label" color={colors.inkSoft}>{t}</Text></View>)}
                </View>
              ) : null}
              {user.photoUris?.length ? <PhotoStrip uris={user.photoUris} /> : null}
              {user.visitedAt && <Button small variant="secondary" title="Edit visit" icon="create-outline" onPress={() => router.push(`/review/${place.id}`)} style={{ alignSelf: "flex-start", marginTop: 12 }} />}
            </View>
          ) : (
            <Text v="small" color={colors.inkMuted}>Not on your map yet. Save it for later or log a visit.</Text>
          )}

          {/* Verdict switcher */}
          {user && (
            <View style={{ marginTop: space.xl }}>
              <Text v="label" color={colors.inkMuted} style={{ marginBottom: 8 }}>Your verdict</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {VERDICTS.map((v) => {
                  const on = user.verdict === v.id;
                  return (
                    <Pressable key={v.id} onPress={() => setVerdict(place.id, v.id as Verdict)} accessibilityRole="button" accessibilityState={{ selected: on }}
                      style={[styles.verdictChip, on && { backgroundColor: verdictColors[v.id], borderColor: verdictColors[v.id] }]}>
                      <Ionicons name={v.icon as any} size={14} color={on ? colors.white : verdictColors[v.id]} />
                      <Text v="smallMedium" color={on ? colors.white : colors.ink} style={{ marginLeft: 6 }}>{v.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Details */}
          <View style={{ marginTop: space.xl }}>
            {place.shortDescription && <Text v="body" style={{ marginBottom: space.lg }}>{place.shortDescription}</Text>}
            {place.address && <Row icon="location-outline" text={place.address} />}
            {place.hours && <Row icon="time-outline" text={place.hours} sub="From OpenStreetMap — may be out of date" />}
            {place.website && <Row icon="globe-outline" text={place.website.replace(/^https?:\/\//, "")} onPress={() => Linking.openURL(place.website!)} />}
            {place.priceLevel && <Row icon="cash-outline" text={"€".repeat(place.priceLevel)} />}
            {place.tags?.length ? <Row icon="pricetag-outline" text={place.tags.join(", ")} /> : null}
            <Text v="small" color={colors.inkFaint} style={{ marginTop: space.md }}>
              {place.source === "curated" ? "Hand-picked suggestion. " : "Place data © OpenStreetMap contributors. "}Hours and details can change — check before you go.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky actions */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
        {!user && <Button title="Save" icon="bookmark-outline" variant="secondary" onPress={() => { savePlace(place.id); toast("Saved to Want to go", "bookmark"); }} style={{ flex: 1 }} />}
        {!user?.visitedAt && <Button title="I visited" icon="checkmark" onPress={() => router.push(`/review/${place.id}`)} style={{ flex: 1 }} />}
        <Button title="Directions" icon="navigate-outline" variant={user?.visitedAt ? "primary" : "secondary"} onPress={() => openInMaps(place)} style={{ flex: 1 }} />
      </View>

      {showStamp && <Stamp label="Visited" onDone={onStampDone} reducedMotion={reducedMotion} />}
    </View>
  );
}

function Row({ icon, text, sub, onPress }: { icon: any; text: string; sub?: string; onPress?: () => void }) {
  const inner = (
    <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 12 }}>
      <Ionicons name={icon} size={18} color={colors.inkMuted} style={{ marginTop: 2, width: 26 }} />
      <View style={{ flex: 1 }}>
        <Text v="body" color={onPress ? colors.slate : colors.ink}>{text}</Text>
        {sub && <Text v="small" color={colors.inkFaint}>{sub}</Text>}
      </View>
    </View>
  );
  return onPress ? <Pressable onPress={onPress} accessibilityRole="link">{inner}</Pressable> : inner;
}

function PhotoStrip({ uris }: { uris: string[] }) {
  const [resolved, setResolved] = useState<string[]>([]);
  useEffect(() => { Promise.all(uris.map(resolvePhoto)).then((r) => setResolved(r.filter(Boolean) as string[])); }, [uris]);
  if (!resolved.length) return null;
  return (
    <Animated.ScrollView entering={FadeIn} horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8 }}>
      {resolved.map((u) => <Image key={u} source={{ uri: u }} style={styles.photo} accessibilityLabel="Visit photo" />)}
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: space.xl, paddingBottom: space.xl, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  heroTop: { flexDirection: "row", justifyContent: "space-between" },
  heroBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.18)", alignItems: "center", justifyContent: "center" },
  body: { padding: space.xl },
  statusCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: space.lg, ...shadow.card },
  tag: { backgroundColor: colors.marbleDeep, paddingHorizontal: 10, height: 26, borderRadius: radius.pill, justifyContent: "center" },
  verdictChip: { flexDirection: "row", alignItems: "center", height: 38, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  actions: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", gap: 10, paddingHorizontal: space.lg, paddingTop: 12, backgroundColor: colors.marble, borderTopWidth: 1, borderTopColor: colors.line },
  photo: { width: 120, height: 120, borderRadius: radius.md, backgroundColor: colors.marbleDeep },
});

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, View, useWindowDimensions, type ViewToken } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { ExploreMap } from "@/components/map/ExploreMap";
import type { MapHandle } from "@/components/map/types";
import { PlaceCard } from "@/components/PlaceCard";
import { CategoryChips } from "@/components/CategoryChips";
import { IconButton } from "@/components/ui/IconButton";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useNearbyPlaces, useOrigin, type PlaceWithMeta } from "@/hooks/usePlaces";
import { useLiveLocation } from "@/hooks/useLiveLocation";
import { useStore } from "@/store/useStore";
import { colors, radius, shadow, space } from "@/theme/tokens";
import { formatRadius } from "@/lib/geo";
import { RADII } from "@/types";

const zoomForRadius = (m: number) => (m <= 500 ? 15.6 : m <= 1000 ? 14.8 : m <= 3000 ? 13.4 : 12.6);

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const toast = useToast();
  const mapRef = useRef<MapHandle>(null);
  const listRef = useRef<FlatList<PlaceWithMeta>>(null);

  const results = useNearbyPlaces();
  const origin = useOrigin();
  const selectedId = useStore((s) => s.selectedPlaceId);
  const select = useStore((s) => s.select);
  const radius = useStore((s) => s.radius);
  const setRadius = useStore((s) => s.setRadius);
  const activeCategories = useStore((s) => s.activeCategories);
  const setCategories = useStore((s) => s.setCategories);
  const reducedMotion = useStore((s) => s.settings.reducedMotion);
  const locationMode = useStore((s) => s.settings.locationMode);
  const bases = useStore((s) => s.bases);
  const activeBaseId = useStore((s) => s.settings.activeBaseId);
  const setActiveBase = useStore((s) => s.setActiveBase);
  const savePlace = useStore((s) => s.savePlace);
  const { locate, state: locState } = useLiveLocation();
  const [basePicker, setBasePicker] = useState(false);
  const [showTip, setShowTip] = useState(false);

  const cardWidth = Math.min(width - 32, 440);
  const cardGap = 12;
  const bottomInset = 170 + insets.bottom;

  const markers = useMemo(() => results.map((r) => ({ place: r.place, user: r.user })), [results]);

  // Camera: follow origin / radius changes.
  const originKey = `${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}`;
  useEffect(() => {
    mapRef.current?.flyTo({ lng: origin.lng, lat: origin.lat, zoom: zoomForRadius(radius) }, { duration: 1100 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originKey, radius]);

  // Camera: frame results when filters change.
  const catKey = activeCategories.join(",");
  useEffect(() => {
    if (!results.length || selectedId) return;
    if (activeCategories.length) mapRef.current?.fitTo([{ lng: origin.lng, lat: origin.lat }, ...results.slice(0, 12).map((r) => ({ lng: r.place.lng, lat: r.place.lat }))]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catKey]);

  // Selection → camera + carousel.
  useEffect(() => {
    if (!selectedId) return;
    const idx = results.findIndex((r) => r.place.id === selectedId);
    const r = results[idx];
    if (!r) return;
    mapRef.current?.flyTo({ lng: r.place.lng, lat: r.place.lat, zoom: 16 });
    if (idx >= 0) listRef.current?.scrollToIndex({ index: idx, animated: !reducedMotion, viewPosition: 0.5 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Only let the carousel drive selection while the user is swiping it,
  // so programmatic scrolls (marker taps) don't bounce the camera around.
  const swiping = useRef(false);
  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken<PlaceWithMeta>[] }) => {
    if (!swiping.current) return;
    const first = viewableItems.find((v) => v.isViewable)?.item;
    if (first && useStore.getState().selectedPlaceId !== first.place.id) select(first.place.id);
  }).current;

  const onLocate = useCallback(async () => {
    const loc = await locate();
    if (!loc) toast("Location is off — browsing from your base instead", "navigate-outline");
  }, [locate, toast]);

  const onReady = useCallback(() => {
    if (!useStore.getState().settings.onboarded) return;
    const seen = (globalThis as any).__milanTipSeen;
    if (!seen) { (globalThis as any).__milanTipSeen = true; setShowTip(true); setTimeout(() => setShowTip(false), 5000); }
  }, []);

  const activeBase = bases.find((b) => b.id === activeBaseId);
  const originLabel = locationMode === "live" ? "Current location" : activeBase?.label ?? "Milan";

  return (
    <View style={styles.root}>
      <ExploreMap
        ref={mapRef}
        markers={markers}
        selectedId={selectedId}
        origin={{ lng: origin.lng, lat: origin.lat, live: locationMode === "live" }}
        initial={{ lng: origin.lng, lat: origin.lat, zoom: zoomForRadius(radius) }}
        reducedMotion={reducedMotion}
        bottomInset={bottomInset}
        onMarkerPress={(id) => select(id)}
        onMapPress={() => { select(null); setBasePicker(false); }}
        onReady={onReady}
      />

      {/* Top chrome */}
      <View style={[styles.top, { paddingTop: insets.top + 10 }]} pointerEvents="box-none">
        <View style={styles.topRow}>
          <Pressable onPress={() => router.push("/search")} accessibilityRole="search" accessibilityLabel="Search places" style={styles.search}>
            <Ionicons name="search" size={18} color={colors.inkMuted} />
            <Text v="body" color={colors.inkMuted} numberOfLines={1} style={{ marginLeft: 10, flex: 1 }}>Search cafés, museums…</Text>
          </Pressable>
          <Pressable onPress={() => setBasePicker((v) => !v)} accessibilityRole="button" accessibilityLabel={`Base: ${originLabel}. Tap to switch`} style={styles.basePill}>
            <Ionicons name={locationMode === "live" ? "navigate" : "home"} size={14} color={colors.marble} />
            <Text v="smallMedium" color={colors.marble} numberOfLines={1} style={{ marginLeft: 6, maxWidth: 120 }}>{originLabel}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.marble} style={{ marginLeft: 4 }} />
          </Pressable>
        </View>
        <View style={{ marginTop: 10 }}><CategoryChips /></View>

        {basePicker && (
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(180)} exiting={reducedMotion ? undefined : FadeOut.duration(120)} style={styles.basePicker}>
            {bases.map((b) => (
              <Pressable key={b.id} onPress={() => { setActiveBase(b.id); setBasePicker(false); }} style={styles.baseRow} accessibilityRole="button">
                <Ionicons name={b.id === activeBaseId && locationMode === "base" ? "radio-button-on" : "radio-button-off"} size={18} color={colors.ink} />
                <Text v="bodyMedium" style={{ marginLeft: 10, flex: 1 }}>{b.label}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => { setBasePicker(false); onLocate(); }} style={styles.baseRow} accessibilityRole="button">
              <Ionicons name="navigate-outline" size={18} color={colors.slate} />
              <Text v="bodyMedium" color={colors.slate} style={{ marginLeft: 10, flex: 1 }}>Use current location</Text>
            </Pressable>
            <Pressable onPress={() => { setBasePicker(false); router.push("/bases"); }} style={[styles.baseRow, { borderTopWidth: 1, borderTopColor: colors.line }]} accessibilityRole="button">
              <Ionicons name="create-outline" size={18} color={colors.inkMuted} />
              <Text v="small" color={colors.inkMuted} style={{ marginLeft: 10 }}>Manage bases</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>

      {/* Right controls */}
      <View style={[styles.controls, { bottom: bottomInset + 12 }]} pointerEvents="box-none">
        <IconButton icon="locate" label="Jump to my location" onPress={onLocate} active={locationMode === "live"} style={{ marginBottom: 10 }} />
        <IconButton icon="home-outline" label="Return to base" onPress={() => { select(null); mapRef.current?.flyTo({ lng: origin.lng, lat: origin.lat, zoom: zoomForRadius(radius) }); }} />
      </View>

      {/* Radius */}
      <View style={[styles.radiusWrap, { bottom: bottomInset + 12 }]} pointerEvents="box-none">
        <View style={styles.radius}>
          {RADII.map((r) => (
            <Pressable key={r} onPress={() => setRadius(r)} accessibilityRole="button" accessibilityState={{ selected: r === radius }} style={[styles.radiusBtn, r === radius && styles.radiusActive]}>
              <Text v="label" color={r === radius ? colors.marble : colors.inkSoft}>{formatRadius(r)}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Tip */}
      {showTip && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={[styles.tip, { bottom: bottomInset + 112 }]} pointerEvents="none">
          <Text v="small" color={colors.marble}>Tap a pin to see its card · swipe cards to move the map</Text>
        </Animated.View>
      )}

      {/* Bottom carousel */}
      <View style={[styles.carousel, { paddingBottom: insets.bottom + 8 }]} pointerEvents="box-none">
        {results.length ? (
          <FlatList
            ref={listRef}
            data={results}
            keyExtractor={(r) => r.place.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={cardWidth + cardGap}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: (width - cardWidth) / 2 }}
            ItemSeparatorComponent={() => <View style={{ width: cardGap }} />}
            getItemLayout={(_, i) => ({ length: cardWidth + cardGap, offset: (cardWidth + cardGap) * i, index: i })}
            onViewableItemsChanged={onViewable}
            viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
            onScrollToIndexFailed={() => {}}
            onScrollBeginDrag={() => { swiping.current = true; }}
            onMomentumScrollEnd={() => { swiping.current = false; }}
            onScrollEndDrag={() => { setTimeout(() => { swiping.current = false; }, 400); }}
            renderItem={({ item }) => (
              <PlaceCard
                item={item}
                width={cardWidth}
                onOpen={() => router.push(`/place/${item.place.id}`)}
                onSave={() => { savePlace(item.place.id); toast("Saved to Want to go", "bookmark"); }}
                onVisited={() => router.push(`/review/${item.place.id}`)}
              />
            )}
          />
        ) : (
          <View style={[styles.empty, { width: cardWidth, alignSelf: "center" }]}>
            <Text v="cardTitle">Nothing within {formatRadius(radius)}</Text>
            <Text v="small" color={colors.inkMuted} style={{ marginTop: 4 }}>
              {activeCategories.length ? "Try clearing the category filter or widening the radius." : "Widen the radius to see more of the city."}
            </Text>
            <View style={{ flexDirection: "row", marginTop: 12, gap: 8 }}>
              {activeCategories.length > 0 && <Button small title="Clear filters" variant="secondary" onPress={() => setCategories([])} />}
              {radius < 5000 && <Button small title="Widen radius" onPress={() => setRadius(RADII[Math.min(RADII.indexOf(radius as any) + 1, RADII.length - 1)])} />}
            </View>
          </View>
        )}
      </View>

      {locState === "asking" && (
        <View style={[styles.locating, { top: insets.top + 110 }]} pointerEvents="none">
          <Text v="smallMedium" color={colors.marble}>Finding you…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.marbleDeep },
  top: { position: "absolute", left: 0, right: 0, top: 0 },
  topRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 10 },
  search: { flex: 1, flexDirection: "row", alignItems: "center", height: 48, paddingHorizontal: 16, backgroundColor: colors.white, borderRadius: radius.pill, ...shadow.float },
  basePill: { flexDirection: "row", alignItems: "center", height: 40, paddingHorizontal: 12, backgroundColor: colors.ink, borderRadius: radius.pill, ...shadow.float },
  basePicker: { marginTop: 10, marginHorizontal: 16, backgroundColor: colors.white, borderRadius: radius.lg, paddingVertical: 6, ...shadow.card },
  baseRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 46 },
  controls: { position: "absolute", right: 16 },
  radiusWrap: { position: "absolute", left: 16 },
  radius: { flexDirection: "row", backgroundColor: colors.white, borderRadius: radius.pill, padding: 4, ...shadow.float },
  radiusBtn: { height: 32, paddingHorizontal: 11, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  radiusActive: { backgroundColor: colors.ink },
  tip: { position: "absolute", alignSelf: "center", backgroundColor: colors.ink, paddingHorizontal: 14, height: 36, borderRadius: radius.pill, justifyContent: "center" },
  carousel: { position: "absolute", left: 0, right: 0, bottom: 0, paddingTop: 8 },
  empty: { backgroundColor: colors.white, borderRadius: radius.lg, padding: space.lg, ...shadow.card },
  locating: { position: "absolute", alignSelf: "center", backgroundColor: colors.slate, paddingHorizontal: 14, height: 34, borderRadius: radius.pill, justifyContent: "center" },
});

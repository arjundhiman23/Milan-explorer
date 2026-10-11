import { memo, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming, cancelAnimation } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { CATEGORIES } from "@/data/categories";
import { categoryColors, colors, verdictColors } from "@/theme/tokens";
import type { Place, UserPlace } from "@/types";

export interface MarkerData { place: Place; user?: UserPlace }

interface Props { data: MarkerData; selected: boolean; reducedMotion: boolean }

// One marker visual shared by web (via react-dom roots) and native (Marker children).
// Category colour + icon; saved places get a bookmark tab; visited places get a
// verdict-coloured ring; the selected marker scales up with a single soft pulse.
export const MarkerPin = memo(function MarkerPin({ data, selected, reducedMotion }: Props) {
  const { place, user } = data;
  const cat = CATEGORIES.find((c) => c.id === place.category)!;
  const color = categoryColors[place.category];
  const visited = !!user?.visitedAt;
  const ring = user ? verdictColors[user.verdict] : undefined;

  const scale = useSharedValue(1);
  const pulse = useSharedValue(0);
  useEffect(() => {
    scale.value = reducedMotion ? (selected ? 1.25 : 1) : withSpring(selected ? 1.25 : 1, { damping: 14, stiffness: 180 });
    if (selected && !reducedMotion) {
      pulse.value = 0;
      pulse.value = withRepeat(withSequence(withTiming(1, { duration: 1400 }), withTiming(0, { duration: 0 })), -1, false);
    } else {
      cancelAnimation(pulse);
      pulse.value = 0;
    }
  }, [selected, reducedMotion, scale, pulse]);

  const pinStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: selected ? 0.35 * (1 - pulse.value) : 0,
    transform: [{ scale: 1 + pulse.value * 1.1 }],
  }));

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Animated.View style={[styles.pulse, { backgroundColor: color }, pulseStyle]} />
      <Animated.View style={[styles.pin, pinStyle]}>
        <View style={[styles.circle, { backgroundColor: visited ? colors.white : color, borderColor: ring ?? colors.white, borderWidth: ring ? 3 : 2 }]}>
          <Ionicons name={(visited ? cat.icon.replace("-outline", "") : cat.icon) as any} size={16} color={visited ? color : colors.white} />
        </View>
        {user?.verdict === "want" && !visited && (
          <View style={styles.tab}><Ionicons name="bookmark" size={9} color={colors.ink} /></View>
        )}
        {visited && user?.rating ? (
          <View style={[styles.ratingBadge, { backgroundColor: ring }]}>
            <Ionicons name="star" size={8} color={colors.white} />
          </View>
        ) : null}
        <View style={[styles.stem, { backgroundColor: ring ?? color }]} />
      </Animated.View>
    </View>
  );
});

const SIZE = 34;
const styles = StyleSheet.create({
  wrap: { width: 60, height: 60, alignItems: "center", justifyContent: "flex-end" },
  pulse: { position: "absolute", width: SIZE, height: SIZE, borderRadius: SIZE / 2, bottom: 13 },
  pin: { alignItems: "center" },
  circle: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  stem: { width: 3, height: 9, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, marginTop: -1 },
  tab: { position: "absolute", top: -4, right: -6, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.saffron, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: colors.white },
  ratingBadge: { position: "absolute", top: -4, right: -6, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: colors.white },
});

import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./ui/Text";
import { colors, fonts } from "@/theme/tokens";

// Visit stamp: a quick passport-stamp slam that never blocks the UI (§9).
export function Stamp({ label, onDone, reducedMotion }: { label: string; onDone: () => void; reducedMotion: boolean }) {
  const scale = useSharedValue(reducedMotion ? 1 : 2.2);
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const rot = useSharedValue(reducedMotion ? -8 : -24);

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = withDelay(700, withTiming(0, { duration: 200 }, () => runOnJS(onDone)()));
      return;
    }
    opacity.value = withSequence(withTiming(1, { duration: 120 }), withDelay(800, withTiming(0, { duration: 260 }, () => runOnJS(onDone)())));
    scale.value = withSpring(1, { damping: 12, stiffness: 320, mass: 0.6 });
    rot.value = withTiming(-8, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [reducedMotion, onDone, opacity, scale, rot]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }, { rotate: `${rot.value}deg` }] }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.center}>
        <Animated.View style={[styles.stamp, style]}>
          <Ionicons name="checkmark-circle" size={22} color={colors.verdigris} />
          <Text style={{ fontFamily: fonts.display, fontSize: 20, color: colors.verdigris, marginLeft: 8, letterSpacing: 0.5 }}>{label}</Text>
        </Animated.View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  stamp: { flexDirection: "row", alignItems: "center", borderWidth: 3, borderColor: colors.verdigris, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: "rgba(255,255,255,0.92)" },
});

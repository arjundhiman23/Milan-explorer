import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInUp, FadeOut } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { useShallow } from "zustand/react/shallow";
import { useStore, activeBases } from "@/store/useStore";
import { useLiveLocation } from "@/hooks/useLiveLocation";
import { supabaseConfigured } from "@/lib/supabase";
import { colors, fonts, radius, space } from "@/theme/tokens";

type Step = "welcome" | "base" | "location";

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>("welcome");
  const bases = useStore(useShallow(activeBases));
  const setActiveBase = useStore((s) => s.setActiveBase);
  const setSettings = useStore((s) => s.setSettings);
  const activeBaseId = useStore((s) => s.settings.activeBaseId);
  const { locate } = useLiveLocation();
  const [busy, setBusy] = useState(false);

  const finish = () => {
    setSettings({ onboarded: true });
    router.replace("/(tabs)");
    if (supabaseConfigured) setTimeout(() => router.push("/auth"), 400);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      {/* Cinematic backdrop: three slow-drifting marble "roads" */}
      <View style={styles.backdrop} pointerEvents="none">
        <View style={[styles.road, { top: "18%", transform: [{ rotate: "-14deg" }] }]} />
        <View style={[styles.road, { top: "46%", transform: [{ rotate: "9deg" }], opacity: 0.5 }]} />
        <View style={[styles.road, { top: "74%", transform: [{ rotate: "-6deg" }], opacity: 0.3 }]} />
      </View>

      {step === "welcome" && (
        <Animated.View entering={FadeIn.duration(500)} exiting={FadeOut.duration(200)} style={styles.content}>
          <View style={{ flex: 1, justifyContent: "flex-end" }}>
            <Animated.Text entering={FadeInUp.delay(150).duration(700)} style={styles.kicker}>Milano</Animated.Text>
            <Animated.Text entering={FadeInUp.delay(300).duration(700)} style={styles.hero}>Your city,{"\n"}remembered.</Animated.Text>
            <Animated.Text entering={FadeInUp.delay(500).duration(700)} style={styles.sub}>
              A personal map of places to discover, visit and keep an honest opinion of — around campus, around home, around Milan.
            </Animated.Text>
          </View>
          <Animated.View entering={FadeInUp.delay(700).duration(600)}>
            <Button title="Explore Milan" icon="compass-outline" variant="secondary" onPress={() => setStep("base")} />
          </Animated.View>
        </Animated.View>
      )}

      {step === "base" && (
        <Animated.View entering={FadeIn.duration(350)} exiting={FadeOut.duration(200)} style={styles.content}>
          <View style={{ flex: 1, justifyContent: "center" }}>
            <Text style={styles.kicker}>Start from</Text>
            <Text style={[styles.hero, { fontSize: 32, lineHeight: 36 }]}>Where are you based?</Text>
            <Text style={styles.sub}>Distances and nearby suggestions are measured from here. You can switch any time.</Text>
            <View style={{ marginTop: space.xl, gap: 10 }}>
              {bases.map((b) => (
                <Pressable key={b.id} onPress={() => setActiveBase(b.id)} accessibilityRole="button" accessibilityState={{ selected: activeBaseId === b.id }}
                  style={[styles.option, activeBaseId === b.id && styles.optionOn]}>
                  <Ionicons name={activeBaseId === b.id ? "radio-button-on" : "radio-button-off"} size={20} color={colors.marble} />
                  <Text v="bodyMedium" color={colors.marble} style={{ marginLeft: 12 }}>{b.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Button title="Continue" variant="secondary" onPress={() => setStep("location")} />
        </Animated.View>
      )}

      {step === "location" && (
        <Animated.View entering={FadeIn.duration(350)} style={styles.content}>
          <View style={{ flex: 1, justifyContent: "center" }}>
            <Ionicons name="navigate-circle-outline" size={44} color={colors.saffron} />
            <Text style={[styles.hero, { fontSize: 32, lineHeight: 36, marginTop: 16 }]}>Use your location?</Text>
            <Text style={styles.sub}>
              Only when you tap the locate button, to jump the map to where you are. Never in the background, never stored, never shared. The map works fully without it.
            </Text>
          </View>
          <View style={{ gap: 10 }}>
            <Button title="Use my location" icon="locate" variant="secondary" loading={busy} onPress={async () => { setBusy(true); await locate(); setBusy(false); finish(); }} />
            <Button title="Not now" variant="ghost" onPress={finish} style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink, paddingHorizontal: space.xl },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" },
  road: { position: "absolute", left: -80, right: -80, height: 2, backgroundColor: colors.saffron, opacity: 0.7 },
  content: { flex: 1 },
  kicker: { fontFamily: fonts.displayItalic, fontSize: 18, color: colors.saffron, marginBottom: 10 },
  hero: { fontFamily: fonts.display, fontSize: 44, lineHeight: 48, letterSpacing: -1, color: colors.marble },
  sub: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.inkFaint, marginTop: 16, maxWidth: 360 },
  option: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: radius.md, borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" },
  optionOn: { backgroundColor: "rgba(255,255,255,0.08)", borderColor: colors.saffron },
});

import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, Fraunces_600SemiBold, Fraunces_500Medium_Italic } from "@expo-google-fonts/fraunces";
import { InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold } from "@expo-google-fonts/instrument-sans";
import { ToastProvider } from "@/components/ui/Toast";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/hooks/useAuth";
import { useSyncOnChange } from "@/hooks/useSyncOnChange";
import { colors } from "@/theme/tokens";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Fraunces_600SemiBold, Fraunces_500Medium_Italic, InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold });
  const hydrated = useHydrated();
  const onboarded = useStore((s) => s.settings.onboarded);
  const { ready } = useAuth();
  useSyncOnChange();
  const segments = useSegments();
  const router = useRouter();

  const booted = fontsLoaded && hydrated && ready;

  useEffect(() => {
    if (booted) SplashScreen.hideAsync().catch(() => {});
  }, [booted]);

  useEffect(() => {
    if (!booted) return;
    const inOnboarding = segments[0] === "onboarding";
    if (!onboarded && !inOnboarding) router.replace("/onboarding");
    if (onboarded && inOnboarding) router.replace("/(tabs)");
  }, [booted, onboarded, segments, router]);

  if (!booted) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.marble }}>
      <SafeAreaProvider>
        <ToastProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.marble }, animation: "slide_from_right" }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
            <Stack.Screen name="auth" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
            <Stack.Screen name="search" options={{ presentation: "modal", animation: "fade" }} />
            <Stack.Screen name="place/[id]" options={{ presentation: "card", animation: "slide_from_bottom" }} />
            <Stack.Screen name="review/[id]" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
            <Stack.Screen name="bases" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
          </Stack>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function useHydrated() {
  const [h, setH] = useStoreHydration();
  useEffect(() => {
    if (useStore.persist.hasHydrated()) setH(true);
    return useStore.persist.onFinishHydration(() => setH(true));
  }, [setH]);
  return h;
}
import { useState } from "react";
function useStoreHydration() { return useState(useStore.persist.hasHydrated()); }

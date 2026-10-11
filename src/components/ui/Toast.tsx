import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "./Text";
import { colors, radius, shadow } from "@/theme/tokens";

interface ToastMsg { id: number; text: string; icon?: keyof typeof Ionicons.glyphMap }
const Ctx = createContext<(text: string, icon?: ToastMsg["icon"]) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<ToastMsg | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const show = useCallback((text: string, icon?: ToastMsg["icon"]) => {
    setMsg({ id: Date.now(), text, icon });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2200);
  }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      {msg && (
        <Animated.View key={msg.id} entering={FadeInDown.duration(220)} exiting={FadeOutDown.duration(180)} pointerEvents="none"
          style={[styles.wrap, { bottom: insets.bottom + 262 }]}>
          <View style={styles.toast}>
            {msg.icon && <Ionicons name={msg.icon} size={16} color={colors.saffron} style={{ marginRight: 8 }} />}
            <Text v="smallMedium" color={colors.marble}>{msg.text}</Text>
          </View>
        </Animated.View>
      )}
    </Ctx.Provider>
  );
}
const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  toast: { flexDirection: "row", alignItems: "center", backgroundColor: colors.ink, paddingHorizontal: 16, height: 42, borderRadius: radius.pill, ...shadow.card },
});

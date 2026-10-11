import { Pressable, StyleSheet, ActivityIndicator, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { Text } from "./Text";
import { colors, radius, space } from "@/theme/tokens";

interface Props {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  small?: boolean;
}

export function Button({ title, onPress, variant = "primary", icon, loading, disabled, style, small }: Props) {
  const fg = variant === "primary" ? colors.marble : variant === "danger" ? colors.rosso : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled || loading}
      onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); onPress?.(); }}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        styles[variant],
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
        (disabled || loading) && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : (
        <>
          {icon && <Ionicons name={icon} size={small ? 16 : 18} color={fg} style={{ marginRight: 8 }} />}
          <Text v={small ? "smallMedium" : "bodyMedium"} color={fg}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: "row", alignItems: "center", justifyContent: "center", minHeight: 48, paddingHorizontal: space.xl, borderRadius: radius.pill },
  small: { minHeight: 38, paddingHorizontal: space.lg },
  primary: { backgroundColor: colors.ink },
  secondary: { backgroundColor: colors.marbleDeep },
  ghost: { backgroundColor: "transparent" },
  danger: { backgroundColor: colors.rossoSoft },
});

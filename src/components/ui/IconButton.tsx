import { Pressable, StyleSheet, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, shadow } from "@/theme/tokens";

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  label: string;
  size?: number;
  active?: boolean;
  style?: ViewStyle;
  tone?: "light" | "dark";
}

export function IconButton({ icon, onPress, label, size = 44, active, style, tone = "light" }: Props) {
  const bg = active ? colors.ink : tone === "dark" ? colors.ink : colors.white;
  const fg = active || tone === "dark" ? colors.marble : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.btn, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }, pressed && { opacity: 0.8 }, style]}
    >
      <Ionicons name={icon} size={size * 0.46} color={fg} />
    </Pressable>
  );
}
const styles = StyleSheet.create({ btn: { alignItems: "center", justifyContent: "center", ...shadow.float } });

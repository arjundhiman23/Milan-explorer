import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./Text";
import { colors, radius } from "@/theme/tokens";

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  dot?: string;
}

export function Chip({ label, active, onPress, icon, color, dot }: Props) {
  const bg = active ? (color ?? colors.ink) : colors.white;
  const fg = active ? colors.marble : colors.ink;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!active }} onPress={onPress}
      style={({ pressed }) => [styles.chip, { backgroundColor: bg, borderColor: active ? bg : colors.line }, pressed && { opacity: 0.85 }]}>
      {icon && <Ionicons name={icon} size={15} color={fg} style={{ marginRight: 6 }} />}
      {dot && !icon && <View style={[styles.dot, { backgroundColor: active ? colors.marble : dot }]} />}
      <Text v="smallMedium" color={fg}>{label}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  chip: { flexDirection: "row", alignItems: "center", height: 36, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, marginRight: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
});

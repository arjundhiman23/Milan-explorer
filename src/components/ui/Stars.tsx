import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/tokens";

interface Props { value: number; onChange?: (v: number) => void; size?: number; color?: string }

export function Stars({ value, onChange, size = 18, color = colors.saffron }: Props) {
  return (
    <View style={{ flexDirection: "row" }} accessibilityLabel={`${value} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Pressable key={i} disabled={!onChange} onPress={() => onChange?.(i)} hitSlop={4} accessibilityRole={onChange ? "button" : undefined} accessibilityLabel={`${i} star${i > 1 ? "s" : ""}`}>
          <Ionicons name={i <= value ? "star" : "star-outline"} size={size} color={i <= value ? color : colors.inkFaint} style={{ marginRight: onChange ? 6 : 2 }} />
        </Pressable>
      ))}
    </View>
  );
}

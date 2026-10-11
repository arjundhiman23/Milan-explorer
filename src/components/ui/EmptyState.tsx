import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./Text";
import { Button } from "./Button";
import { colors, space } from "@/theme/tokens";

interface Props { icon?: keyof typeof Ionicons.glyphMap; title: string; body?: string; action?: { title: string; onPress: () => void } }

export function EmptyState({ icon = "compass-outline", title, body, action }: Props) {
  return (
    <View style={{ alignItems: "center", paddingVertical: space.xxl, paddingHorizontal: space.xl }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.marbleDeep, alignItems: "center", justifyContent: "center", marginBottom: space.lg }}>
        <Ionicons name={icon} size={28} color={colors.inkMuted} />
      </View>
      <Text v="heading" center>{title}</Text>
      {body && <Text v="body" color={colors.inkMuted} center style={{ marginTop: space.sm, maxWidth: 300 }}>{body}</Text>}
      {action && <Button title={action.title} onPress={action.onPress} variant="secondary" style={{ marginTop: space.lg }} />}
    </View>
  );
}

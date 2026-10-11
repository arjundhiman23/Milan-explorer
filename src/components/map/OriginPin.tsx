import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/tokens";

export function OriginPin({ live }: { live?: boolean }) {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={[styles.halo, live && { backgroundColor: colors.slate + "33" }]} />
      <View style={[styles.dot, live && { backgroundColor: colors.slate }]}>
        <Ionicons name={live ? "navigate" : "home"} size={11} color={colors.marble} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  halo: { position: "absolute", width: 48, height: 48, borderRadius: 24, backgroundColor: colors.ink + "22" },
  dot: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.ink, borderWidth: 2, borderColor: colors.white, alignItems: "center", justifyContent: "center" },
});

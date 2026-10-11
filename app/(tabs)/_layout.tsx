import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { colors, fonts } from "@/theme/tokens";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.line, height: Platform.OS === "web" ? 64 : undefined, paddingTop: 6 },
        sceneStyle: { backgroundColor: colors.marble },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Explore", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "map" : "map-outline"} size={22} color={color} /> }} />
      <Tabs.Screen name="discover" options={{ title: "Discover", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "compass" : "compass-outline"} size={22} color={color} /> }} />
      <Tabs.Screen name="places" options={{ title: "My places", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "bookmark" : "bookmark-outline"} size={22} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "settings" : "settings-outline"} size={22} color={color} /> }} />
    </Tabs>
  );
}

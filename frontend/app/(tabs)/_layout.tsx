import { Tabs } from "expo-router";
import { Platform, View } from "react-native";
import { House, Music4, Images, Mic } from "lucide-react-native";

import { MiniPlayer } from "@/src/components/mini-player";
import { fonts, useTheme } from "@/src/theme";

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.brandPrimary,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: {
            backgroundColor: colors.surfaceSecondary,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            ...(Platform.OS === "web" ? { height: 64 } : {}),
          },
          tabBarItemStyle: { alignSelf: "center" },
          tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11, letterSpacing: 0.2 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Accueil",
            tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="beats"
          options={{
            title: "Beats",
            tabBarIcon: ({ color, size }) => <Music4 color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="portfolio"
          options={{
            title: "Portfolio",
            tabBarIcon: ({ color, size }) => <Images color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="studio"
          options={{
            title: "Studio",
            tabBarIcon: ({ color, size }) => <Mic color={color} size={size} />,
          }}
        />
      </Tabs>
      <MiniPlayer />
    </View>
  );
}

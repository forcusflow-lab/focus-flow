import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform, useColorScheme } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { isEnglish } from "@/lib/focus-flow/i18n";
import { useFocusFlow } from "@/lib/focus-flow/provider";
import { getAppPalette } from "@/lib/focus-flow/app-themes";

export default function TabLayout() {
  return <FocusTabs />;
}

function FocusTabs() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { displaySettings } = useFocusFlow();
  const systemScheme = useColorScheme() === "dark" ? "dark" : "light";
  const palette = getAppPalette(displaySettings, systemScheme);
  const english = isEnglish(displaySettings);
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 64 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: palette.tab,
          borderTopColor: palette.border,
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginTop: 1 },
        tabBarItemStyle: { minWidth: 60 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: english ? "Today" : "今日", tabBarIcon: ({ color }) => <IconSymbol size={25} name="house.fill" color={color} /> }} />
      <Tabs.Screen name="todos" options={{ title: english ? "Tasks" : "Todo", tabBarIcon: ({ color }) => <IconSymbol size={25} name="checklist" color={color} /> }} />
      <Tabs.Screen name="habits" options={{ title: english ? "Habits" : "習慣", tabBarIcon: ({ color }) => <IconSymbol size={25} name="repeat" color={color} /> }} />
      <Tabs.Screen name="notes" options={{ title: english ? "Notes" : "メモ", tabBarIcon: ({ color }) => <IconSymbol size={24} name="note.text" color={color} /> }} />
      <Tabs.Screen name="more" options={{ title: english ? "Manage" : "管理", tabBarIcon: ({ color }) => <IconSymbol size={24} name="ellipsis.circle" color={color} /> }} />
      <Tabs.Screen name="insights" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}

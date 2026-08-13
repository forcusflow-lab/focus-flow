import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { isEnglish } from "@/lib/focus-flow/i18n";
import { FocusFlowProvider, useFocusFlow } from "@/lib/focus-flow/provider";

export default function TabLayout() {
  return (
    <FocusFlowProvider>
      <FocusTabs />
    </FocusFlowProvider>
  );
}

function FocusTabs() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { displaySettings } = useFocusFlow();
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
          backgroundColor: "rgba(247,250,255,0.92)",
          borderTopColor: "#D7E1F0",
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginTop: 1 },
        tabBarItemStyle: { minWidth: 60 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: english ? "Today" : "今日", tabBarIcon: ({ color }) => <IconSymbol size={25} name="house.fill" color={color} /> }} />
      <Tabs.Screen name="todos" options={{ title: "Todo", tabBarIcon: ({ color }) => <IconSymbol size={25} name="checklist" color={color} /> }} />
      <Tabs.Screen name="habits" options={{ title: english ? "Habits" : "習慣", tabBarIcon: ({ color }) => <IconSymbol size={25} name="repeat" color={color} /> }} />
      <Tabs.Screen name="notes" options={{ title: english ? "Notes" : "メモ", tabBarIcon: ({ color }) => <IconSymbol size={24} name="note.text" color={color} /> }} />
      <Tabs.Screen name="more" options={{ title: english ? "Manage" : "管理", tabBarIcon: ({ color }) => <IconSymbol size={24} name="ellipsis.circle" color={color} /> }} />
      <Tabs.Screen name="insights" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}

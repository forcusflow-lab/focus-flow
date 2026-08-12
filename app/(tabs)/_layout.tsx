import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { FocusFlowProvider } from "@/lib/focus-flow/provider";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <FocusFlowProvider>
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "今日", tabBarIcon: ({ color }) => <IconSymbol size={25} name="house.fill" color={color} /> }} />
      <Tabs.Screen name="todos" options={{ title: "Todo", tabBarIcon: ({ color }) => <IconSymbol size={25} name="checklist" color={color} /> }} />
      <Tabs.Screen name="habits" options={{ title: "習慣", tabBarIcon: ({ color }) => <IconSymbol size={25} name="repeat" color={color} /> }} />
      <Tabs.Screen name="insights" options={{ title: "振り返り", tabBarIcon: ({ color }) => <IconSymbol size={25} name="chart.bar.fill" color={color} /> }} />
    </Tabs>
    </FocusFlowProvider>
  );
}

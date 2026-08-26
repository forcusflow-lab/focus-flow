import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Animated, Easing, Platform, StyleSheet, Text, View, useColorScheme } from "react-native";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider, useThemeContext } from "@/lib/theme-provider";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";
import { initializeReminders } from "@/lib/focus-flow/reminders";
import { FocusFlowProvider, useFocusFlow } from "@/lib/focus-flow/provider";
import { resolveAppearance } from "@/lib/focus-flow/app-themes";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

if (Platform.OS !== "web") {
  void SplashScreen.preventAutoHideAsync().catch(() => undefined);
  SplashScreen.setOptions({ duration: 280, fade: true });
}

function FocusFlowLaunchShell() {
  const { isReady } = useFocusFlow();
  const opacity = useRef(new Animated.Value(1)).current;
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!isReady) return;
    if (Platform.OS !== "web") void SplashScreen.hideAsync();
    Animated.timing(opacity, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => setVisible(false));
  }, [isReady, opacity]);

  return <View style={launchStyles.root}>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="legal" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="support" />
      <Stack.Screen name="policy" />
      <Stack.Screen name="help" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="oauth/callback" />
    </Stack>
    <StatusBar style={visible ? "light" : "auto"} />
    {visible ? <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[launchStyles.overlay, { opacity }]}><View style={launchStyles.haloOne} /><View style={launchStyles.haloTwo} /><View style={launchStyles.content}><View style={launchStyles.mark}><View style={launchStyles.markArc} /><View style={launchStyles.markCore} /></View><Text style={launchStyles.wordmark}>Focus Flow</Text><Text style={launchStyles.tagline}>今日を、ひとつずつ。</Text><View style={launchStyles.rule} /></View><Text style={launchStyles.footer}>PLAN · FOCUS · FINISH</Text></Animated.View> : null}
  </View>;
}

function FocusFlowThemeBridge({ children }: { children: React.ReactNode }) {
  const { displaySettings } = useFocusFlow();
  const { setColorScheme } = useThemeContext();
  const systemScheme = useColorScheme() === "dark" ? "dark" : "light";
  const resolved = resolveAppearance(displaySettings, systemScheme);

  useEffect(() => {
    setColorScheme(resolved);
  }, [resolved, setColorScheme]);

  return <>{children}</>;
}

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  // Initialize Manus runtime for cookie injection from parent container
  useEffect(() => {
    initManusRuntime();
    void initializeReminders();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // Create clients once and reuse them
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Disable automatic refetching on window focus for mobile
            refetchOnWindowFocus: false,
            // Retry failed requests once
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  // Ensure minimum 8px padding for top and bottom on mobile
  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <FocusFlowProvider><FocusFlowThemeBridge><FocusFlowLaunchShell /></FocusFlowThemeBridge></FocusFlowProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              {content}
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
    </ThemeProvider>
  );
}

const launchStyles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: "#163E35" },
  haloOne: { position: "absolute", width: 460, height: 460, borderRadius: 230, backgroundColor: "#215A4D", opacity: 0.48, top: -150, right: -160 },
  haloTwo: { position: "absolute", width: 360, height: 360, borderRadius: 180, borderWidth: 1, borderColor: "#78B5A4", opacity: 0.32, bottom: -155, left: -125 },
  content: { alignItems: "center", transform: [{ translateY: -14 }] },
  mark: { width: 82, height: 82, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  markArc: { position: "absolute", width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: "#B7E4D7", borderTopColor: "transparent", transform: [{ rotate: "-34deg" }] },
  markCore: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#D9F1E9", shadowColor: "#D9F1E9", shadowOpacity: 0.35, shadowRadius: 18, elevation: 2 },
  wordmark: { color: "#F6FBF8", fontSize: 31, lineHeight: 39, fontWeight: "700", letterSpacing: -0.8 },
  tagline: { color: "#B8DCD1", fontSize: 14, lineHeight: 21, fontWeight: "600", letterSpacing: 1.4, marginTop: 8 },
  rule: { width: 34, height: 2, borderRadius: 1, backgroundColor: "#7FC2AE", marginTop: 24 },
  footer: { position: "absolute", bottom: 62, color: "#9FCABD", fontSize: 10, fontWeight: "700", letterSpacing: 2.2 },
});

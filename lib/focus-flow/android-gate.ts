import { NativeModules, Platform } from "react-native";

import { getGateRuleSummaries, getGateSummary } from "./utils";
import type { GateConfig } from "./types";
import type { FocusFlowData } from "./types";
import { getAppLanguage } from "./i18n";

type LaunchableApp = { packageName: string; label: string };
export type GateDiagnostics = { accessibilityEnabled: boolean; batteryOptimizationIgnored: boolean | null; backgroundRestricted: boolean; apiLevel: number; manufacturer: string; model: string; lastGateStateUpdatedAt: number; safetyPauseUntil: number };

type FocusGateNativeModule = {
  saveGateState: (serialized: string) => Promise<void>;
  getAccessibilityStatus: () => Promise<boolean>;
  openAccessibilitySettings: () => Promise<void>;
  openAppDetailsSettings: () => Promise<void>;
  getGateDiagnostics: () => Promise<GateDiagnostics>;
  getLaunchableApps: () => Promise<LaunchableApp[]>;
};

function nativeModule() {
  return Platform.OS === "android" ? (NativeModules.FocusGate as FocusGateNativeModule | undefined) : undefined;
}

export function isNativeGateAvailable() { return Boolean(nativeModule()); }

export async function syncAndroidGate(data: FocusFlowData) {
  const module = nativeModule();
  if (!module) return;
  const language = getAppLanguage(data.displaySettings);
  const summary = getGateSummary(data, new Date(), language);
  const rules = getGateRuleSummaries(data, new Date(), language);
  await module.saveGateState(JSON.stringify({ active: data.gateConfig.enabled, language, pendingCount: summary.pendingCount, pendingTodos: summary.pendingTodos, pendingHabits: summary.pendingHabits, message: summary.message, rules }));
}

export async function getAccessibilityStatus() { return (await nativeModule()?.getAccessibilityStatus()) ?? false; }
export async function openAccessibilitySettings() { await nativeModule()?.openAccessibilitySettings(); }
export async function openAppDetailsSettings() { await nativeModule()?.openAppDetailsSettings(); }
export async function getGateDiagnostics() { return await nativeModule()?.getGateDiagnostics(); }
export async function getLaunchableApps() { return (await nativeModule()?.getLaunchableApps()) ?? [] as LaunchableApp[]; }
export type { LaunchableApp };

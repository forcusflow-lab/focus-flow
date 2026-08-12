import { NativeModules, Platform } from "react-native";

import { getGateRuleSummaries, getGateSummary } from "./utils";
import type { GateConfig } from "./types";
import type { FocusFlowData } from "./types";

type LaunchableApp = { packageName: string; label: string };

type FocusGateNativeModule = {
  saveGateState: (serialized: string) => Promise<void>;
  getAccessibilityStatus: () => Promise<boolean>;
  openAccessibilitySettings: () => Promise<void>;
  getLaunchableApps: () => Promise<LaunchableApp[]>;
};

function nativeModule() {
  return Platform.OS === "android" ? (NativeModules.FocusGate as FocusGateNativeModule | undefined) : undefined;
}

export function isNativeGateAvailable() { return Boolean(nativeModule()); }

export async function syncAndroidGate(data: FocusFlowData) {
  const module = nativeModule();
  if (!module) return;
  const summary = getGateSummary(data);
  const rules = getGateRuleSummaries(data);
  await module.saveGateState(JSON.stringify({ active: data.gateConfig.enabled, pendingCount: summary.pendingCount, pendingTodos: summary.pendingTodos, pendingHabits: summary.pendingHabits, message: summary.message, rules }));
}

export async function getAccessibilityStatus() { return (await nativeModule()?.getAccessibilityStatus()) ?? false; }
export async function openAccessibilitySettings() { await nativeModule()?.openAccessibilitySettings(); }
export async function getLaunchableApps() { return (await nativeModule()?.getLaunchableApps()) ?? [] as LaunchableApp[]; }
export type { LaunchableApp };

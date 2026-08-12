import { NativeModules, Platform } from "react-native";

import type { GateSummary } from "./utils";
import type { GateConfig } from "./types";

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

export async function syncAndroidGate(config: GateConfig, summary: GateSummary) {
  const module = nativeModule();
  if (!module) return;
  await module.saveGateState(JSON.stringify({ active: config.enabled && config.blockedPackages.length > 0 && summary.pendingCount > 0, blockedPackages: config.blockedPackages, schedules: config.schedules, pendingCount: summary.pendingCount, pendingTodos: summary.pendingTodos, pendingHabits: summary.pendingHabits, message: summary.message }));
}

export async function getAccessibilityStatus() { return (await nativeModule()?.getAccessibilityStatus()) ?? false; }
export async function openAccessibilitySettings() { await nativeModule()?.openAccessibilitySettings(); }
export async function getLaunchableApps() { return (await nativeModule()?.getLaunchableApps()) ?? [] as LaunchableApp[]; }
export type { LaunchableApp };

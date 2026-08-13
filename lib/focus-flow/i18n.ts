import { NativeModules, Platform } from "react-native";

import type { DisplaySettings } from "./types";

export type AppLanguage = "ja" | "en";

export function getAppLanguage(settings: Pick<DisplaySettings, "language">): AppLanguage {
  if (settings.language === "ja" || settings.language === "en") return settings.language;
  const locale = Platform.OS === "ios" ? NativeModules.SettingsManager?.settings?.AppleLocale : NativeModules.I18nManager?.localeIdentifier;
  return typeof locale === "string" && locale.toLowerCase().startsWith("ja") ? "ja" : "en";
}

export function isEnglish(settings: Pick<DisplaySettings, "language">) {
  return getAppLanguage(settings) === "en";
}

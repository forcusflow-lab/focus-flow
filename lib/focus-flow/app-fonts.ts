import { Platform, type TextStyle } from "react-native";
import type { AppFontId } from "./types";

const FONT_PREVIEW = { ja: "今日の必須項目", en: "Today’s must-dos" };

export const APP_FONT_OPTIONS: Array<{ id: AppFontId; label: { ja: string; en: string }; sample: { ja: string; en: string } }> = [
  { id: "system", label: { ja: "標準", en: "Standard" }, sample: FONT_PREVIEW },
  { id: "reading", label: { ja: "リーディング", en: "Reading" }, sample: FONT_PREVIEW },
  { id: "notebook", label: { ja: "ノート", en: "Notebook" }, sample: FONT_PREVIEW },
  { id: "focus", label: { ja: "フォーカス", en: "Focus" }, sample: FONT_PREVIEW },
];

export function getAppFontStyle(font: AppFontId = "system"): TextStyle {
  if (font === "reading") return { fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" }) };
  if (font === "notebook") return { fontFamily: Platform.select({ ios: "Avenir Next", android: "sans-serif-light", default: "Arial" }) };
  if (font === "focus") return { fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }) };
  return {};
}

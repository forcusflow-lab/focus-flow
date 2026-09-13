import { Alert, Platform, Share } from "react-native";
import type { FocusFlowData } from "./types";

export type ExportPayload = {
  app: "Focus Flow";
  version: "1.0.0";
  exportedAt: string;
  summary: {
    todoCount: number;
    habitCount: number;
    memoCount: number;
    scheduleCount: number;
  };
  todos: FocusFlowData["todos"];
  habits: FocusFlowData["habits"];
  memos: FocusFlowData["memos"];
  gateConfig: {
    enabled: boolean;
    strictMode?: boolean;
    schedules: FocusFlowData["gateConfig"]["schedules"];
  };
  displaySettings: {
    appTheme: string;
    appearance: string;
    fontFamily?: string;
    widgetBackgroundStyle?: string;
    widgetBackgroundOpacity?: number;
    widgetCardOpacity?: number;
    language?: string;
  };
};

/**
 * FocusFlowDataからエクスポート用JSON文字列を生成する
 */
export function generateExportJson(data: FocusFlowData): string {
  const payload: ExportPayload = {
    app: "Focus Flow",
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    summary: {
      todoCount: data.todos.length,
      habitCount: data.habits.length,
      memoCount: data.memos.length,
      scheduleCount: data.gateConfig.schedules.length,
    },
    todos: data.todos,
    habits: data.habits,
    memos: data.memos,
    gateConfig: {
      enabled: data.gateConfig.enabled,
      strictMode: data.gateConfig.strictMode,
      schedules: data.gateConfig.schedules,
    },
    displaySettings: {
      appTheme: data.displaySettings.appTheme ?? "mist",
      appearance: data.displaySettings.appearance ?? "system",
      fontFamily: data.displaySettings.fontFamily,
      widgetBackgroundStyle: data.displaySettings.widgetBackgroundStyle,
      widgetBackgroundOpacity: data.displaySettings.widgetBackgroundOpacity,
      widgetCardOpacity: data.displaySettings.widgetCardOpacity,
      language: data.displaySettings.language,
    },
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * 端末の共有ダイアログを起動してデータをエクスポートする
 */
export async function exportAndShareData(
  data: FocusFlowData,
  isEnglish: boolean
): Promise<boolean> {
  try {
    const jsonString = generateExportJson(data);
    const dateStr = new Date().toISOString().split("T")[0];
    const title = isEnglish
      ? `FocusFlow_Backup_${dateStr}.json`
      : `FocusFlow_バックアップ_${dateStr}.json`;

    if (Platform.OS === "web") {
      // Webブラウザではクリップボードまたはファイル保存の案内
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(jsonString);
        Alert.alert(
          isEnglish ? "Data copied" : "データをコピーしました",
          isEnglish
            ? "Your backup JSON has been copied to your clipboard."
            : "バックアップ用JSONデータをクリップボードにコピーしました。テキストファイルやメモ帳に貼り付けて保管してください。"
        );
        return true;
      }
    }

    const result = await Share.share({
      title,
      message: jsonString,
    });

    if (result.action === Share.sharedAction) {
      return true;
    }
    return false;
  } catch {
    Alert.alert(
      isEnglish ? "Export failed" : "エクスポート失敗",
      isEnglish
        ? "Could not export backup data. Please try again."
        : "バックアップデータのエクスポートに失敗しました。時間をおいて再試行してください。"
    );
    return false;
  }
}

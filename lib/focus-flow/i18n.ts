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

export function localized(language: AppLanguage, japanese: string, english: string) {
  return language === "en" ? english : japanese;
}

const STATIC_ENGLISH: Record<string, string> = {
  "今日": "Today", "習慣": "Habits", "メモ": "Notes", "管理": "Manage", "設定": "Settings", "振り返り": "Review",
  "すべて見る": "View all", "記録する": "Record", "完了": "Done", "未完了": "Open", "削除": "Delete", "追加": "Add", "閉じる": "Close",
  "情報を多く見たいときは「情報量優先」を選べます。": "Choose Compact to fit more information on screen.",
  "文字サイズ": "Text size", "配色": "Color theme", "カードの透過率": "Card opacity", "表示プレビュー": "Display preview",
  "ホーム画面ウィジェット": "Home screen widget", "集中ルール": "Focus rule", "日課ルールと有効時間帯": "Daily rules and active hours",
  "時間帯を追加": "Add time window", "開始": "Start", "終了": "End", "毎日": "Every day", "平日": "Weekdays", "曜日を選択": "Choose days",
  "この日課ルールを削除": "Delete this daily rule", "状態を再確認": "Refresh status", "アプリ情報を開く": "Open app settings",
  "アクセシビリティ": "Accessibility", "バッテリー最適化": "Battery optimization", "バックグラウンド実行": "Background activity", "安全停止": "Safety pause",
  "あなたの記録を読み込んでいます": "Loading your records", "Todo": "Tasks", "必須": "Must-do", "通常のTodo": "Regular task", "通常の習慣": "Regular habit",
  "プライバシー": "Privacy", "サポート": "Support", "英語 / English": "Language", "自動": "Automatic", "日本語": "Japanese", "小さめ": "Compact", "標準": "Standard", "大きめ": "Large",
  "ミスト": "Mist", "スレート": "Slate", "不透明": "Solid", "やわらかく": "Soft", "ガラス": "Glass",
  "自分に合わせる": "Make it yours", "アプリを整える": "Set up your app", "行動を整える": "Plan your day", "続ける仕組み": "Build consistency", "あとで整理する": "Capture for later",
  "集中ルールはオフです": "Focus rule is off", "必須項目を終えるまで制限": "Restrict until must-dos are complete", "期限当日のTodoを自動で必須にする": "Make tasks due today must-dos automatically",
  "常時適用": "Always active", "現在は時間帯の範囲内です": "This time window is active", "現在は時間帯の範囲外です": "Outside active hours",
  "重要：アプリ制限に必要なアクセス": "Important: access needed for app limits", "アクセシビリティの利用について": "About AccessibilityService", "Androidのアクセシビリティ権限": "Android accessibility permission",
  "ホーム画面を長押しして「ウィジェット」から Focus Flow を追加してください。Todo・習慣の完了に合わせて状態が更新されます。": "Long press your home screen, choose Widgets, then add Focus Flow. It updates as you finish tasks and habits.",
  "端末の動作確認": "Device check", "アプリの制限": "App limits", "表示": "Display", "言語 / Language": "Language",
  "今週の完了Todo": "Completed tasks this week", "今週の記録": "This week's activity", "過去7日間": "Last 7 days", "今日の必須項目": "Today's must-dos",
  "クローズドベータについて": "About the closed beta", "データの取り扱い": "How your data is handled", "プライバシーとベータ案内": "Privacy & beta",
  "未完了の期限当日Todoを、日課ルールに追加しなくても解除条件にします。": "Makes unfinished tasks due today an unlock condition even when they are not added to a daily rule.",
  "必須項目が完了すると、制限は自動的に解除されます": "Limits lift automatically when all must-dos are complete.",
  "必須項目はいつでも解除条件です。ここでは制限する時間帯とアプリだけを決めます。": "Must-dos are always unlock conditions. Set only the time window and apps to limit here.",
  "この時間帯に制限するアプリを選ぶ": "Choose apps to limit in this time window", "対象アプリを閉じる": "Hide selected apps",
  "この時間帯は、必須Todo・必須習慣が未完了の間だけ、選択したアプリを制限します。": "During this time window, selected apps are limited only while must-do tasks or habits remain open.",
  "ネイティブAndroidビルドでアプリを選択できます。": "Choose installed apps in a native Android build.", "アプリ一覧を読み込んでいます": "Loading apps", "選択できるアプリを取得できませんでした。": "Could not load available apps.",
  "Focus Flowは、あなたが選択したアプリを前面に開いたことだけを検知し、未完了の必須項目がある場合に集中ルールを適用します。画面上の文字・メッセージ・入力内容・スクリーンショットは読み取りません。Todo・メモ・アプリの利用状況を端末外へ送信しません。この機能は任意で、Androidの設定からいつでも無効にできます。": "Focus Flow only detects when a selected app comes to the foreground and applies your chosen rule when must-dos remain. It does not read screen text, messages, typed content, or screenshots, and it does not send tasks, notes, or app activity off this device. This optional feature can be turned off anytime in Android settings.",
  "内容を確認済みです。Androidの設定で有効化できます。": "You reviewed this notice. Enable the service in Android settings.", "内容を確認後に、Androidの設定を開いて有効化できます。": "Review this notice, then open Android settings to enable it.",
  "Androidの設定を開く": "Open Android settings", "内容を理解して設定を開く": "I understand — open settings", "確認": "Check",
  "有効です。選択したアプリの前面化を検出できます。": "Enabled. Focus Flow can detect selected apps in the foreground.", "有効化すると、選択したアプリを開いた際に集中ルールを適用できます。": "Enable it to apply your focus rule when you open selected apps.", "この機能は、ネイティブAndroidビルドで利用できます。": "This feature is available in a native Android build.",
  "端末の省電力設定で制限されると、アプリ制限が不安定になる場合があります。標準設定のままで問題がなければ変更は不要です。": "Battery settings can make app limits less reliable. Leave the default setting unchanged unless you see a problem.",
  "この診断はネイティブAndroidビルドで利用できます。": "This diagnostic is available in a native Android build.", "無効です。集中ルールは適用されません。": "Disabled. Focus rules will not apply.",
  "制限なしです。": "Unrestricted.", "最適化中です。制限が不安定なときだけアプリ情報で確認してください。": "Optimized. Check app settings only if limits become unreliable.",
  "制限ありです。端末のバッテリー設定で許可してください。": "Restricted. Allow background activity in your device battery settings.", "大きな制限は検出されませんでした。": "No major restriction was detected.",
  "誤って制限された場合は、制限画面の「10分だけ安全停止する」から一時的に解除できます。端末やOSの都合で常時の動作は保証できません。": "If an app is restricted incorrectly, choose Pause limits for 10 minutes on the limit screen. Continuous behavior cannot be guaranteed on every device or OS.",
  "今日の集中ルールは解除されています": "Today's focus rule is open", "集中制限中：タップして必須項目を確認": "Focus limit active: tap to review must-dos",
  "自動では端末の言語を使います。Automatic follows your device language.": "Automatic follows your device language.",
  "自分に合う、落ち着いた読みやすさに調整できます。": "Adjust the interface for calm, comfortable reading.",
  "日": "Sun", "月": "Mon", "火": "Tue", "水": "Wed", "木": "Thu", "金": "Fri", "土": "Sat",
};

export function translateStaticText(language: AppLanguage, value: string) {
  return language === "en" ? STATIC_ENGLISH[value] ?? value : value;
}

/**
 * Focus Flow String Resources (strings.xml 集約 & 型安全リソース管理)
 * Composable / View / React Native コンポーネントから `stringResource(R.string.xxx)` で呼び出し可能。
 */

export const R = {
  string: {
    app_name: "app_name",
    // 今日（Today）画面
    today_date_format: "today_date_format",
    today_progress_label: "today_progress_label",
    today_banner_locked: "today_banner_locked",
    today_banner_unlocked: "today_banner_unlocked",
    today_banner_off: "today_banner_off",
    today_banner_subtext: "today_banner_subtext",
    today_progress_heading: "today_progress_heading",
    today_tasks_heading: "today_tasks_heading",
    today_scheduled_tasks_heading: "today_scheduled_tasks_heading",
    today_completed_heading: "today_completed_heading",
    today_banner_locked_window: "today_banner_locked_window",
    // 遮断オーバーレイ画面
    gate_overlay_header: "gate_overlay_header",
    gate_overlay_status_all_day: "gate_overlay_status_all_day",
    gate_overlay_status_window: "gate_overlay_status_window",
    // 制限タイミング（Todo / 習慣 共通）
    timing_section_title: "timing_section_title",
    timing_all_day_title: "timing_all_day_title",
    timing_all_day_detail: "timing_all_day_detail",
    timing_scheduled_title: "timing_scheduled_title",
    timing_scheduled_detail: "timing_scheduled_detail",
    timing_add_window: "timing_add_window",
    // カラーテーマ（Todo / 習慣 共通）
    color_theme_title: "color_theme_title",
    color_theme_guide: "color_theme_guide",
    color_choose_label: "color_choose_label",
    // ウィジェット
    widget_title: "widget_title",
    widget_badge_all_day: "widget_badge_all_day",
    widget_status_all_day: "widget_status_all_day",
    widget_status_window: "widget_status_window",
    widget_status_unlocked: "widget_status_unlocked",
    widget_status_off: "widget_status_off",
    widget_bg_style_title: "widget_bg_style_title",
    widget_bg_style_solid: "widget_bg_style_solid",
    widget_bg_style_geometric: "widget_bg_style_geometric",
    widget_bg_style_aurora: "widget_bg_style_aurora",
    widget_bg_style_grid: "widget_bg_style_grid",
    bg_theme_title: "bg_theme_title",
    bg_theme_detail: "bg_theme_detail",
    pro_badge: "pro_badge",
    plus_feature_title: "plus_feature_title",
    plus_feature_bg_style_message: "plus_feature_bg_style_message",
    plus_feature_font_title: "plus_feature_font_title",
    plus_feature_font_message: "plus_feature_font_message",
    free_limit_todo_message: "free_limit_todo_message",
    free_limit_habit_message: "free_limit_habit_message",
    free_limit_app_message: "free_limit_app_message",
    plan_feature_unlimited_items: "plan_feature_unlimited_items",
    plan_feature_unlimited_apps: "plan_feature_unlimited_apps",
    plan_feature_custom_bg: "plan_feature_custom_bg",
    plan_feature_premium_fonts: "plan_feature_premium_fonts",
    plan_feature_theme_sets: "plan_feature_theme_sets",
    plan_feature_free_items: "plan_feature_free_items",
    plan_feature_free_apps: "plan_feature_free_apps",
    plan_feature_free_fonts: "plan_feature_free_fonts",
    plan_feature_free_bg: "plan_feature_free_bg",
    plan_feature_free_themes: "plan_feature_free_themes",
    // 習慣（Habit）画面
    habit_today_progress: "habit_today_progress",
    habit_streak: "habit_streak",
    habit_empty_title: "habit_empty_title",
    habit_empty_description: "habit_empty_description",
    // 設定（Settings）画面
    settings_schedule_section_title: "settings_schedule_section_title",
    settings_step_guide_title: "settings_step_guide_title",
    settings_step_guide_detail: "settings_step_guide_detail",
    settings_switch_limit_tasks: "settings_switch_limit_tasks",
    settings_switch_limit_tasks_detail: "settings_switch_limit_tasks_detail",
    settings_strict_mode_title: "settings_strict_mode_title",
    settings_strict_mode_description: "settings_strict_mode_description",
    settings_strict_mode_active_description: "settings_strict_mode_active_description",
    // 共通
    must_do: "must_do",
    action_complete: "action_complete",
    action_delete: "action_delete",
  },
} as const;

export type StringResourceId = (typeof R.string)[keyof typeof R.string];

type LocalizedString = {
  ja: string;
  en: string;
};

export const STRING_RESOURCES: Record<StringResourceId, LocalizedString> = {
  app_name: {
    ja: "Focus Flow",
    en: "Focus Flow",
  },
  // 今日画面
  today_date_format: {
    ja: "%1$d月%2$d日 (%3$s)",
    en: "%3$s, %1$s %2$d",
  },
  today_progress_label: {
    ja: "進捗",
    en: "Progress",
  },
  today_banner_locked: {
    ja: "アプリ制限中（残り %d 件）",
    en: "App limits active (%d remaining)",
  },
  today_banner_locked_window: {
    ja: "時間帯制限中（%1$s〜%2$s）",
    en: "Scheduled limit active (%1$s–%2$s)",
  },
  today_banner_unlocked: {
    ja: "すべての制限を解除中",
    en: "All app limits unlocked",
  },
  today_banner_off: {
    ja: "集中制限はオフです",
    en: "App limits are off",
  },
  today_banner_subtext: {
    ja: "今日の必須タスクを完了すると制限が解除されます",
    en: "Limits unlock when all must-dos for today are complete.",
  },
  today_progress_heading: {
    ja: "本日の進捗（残り %d 件 / 完了 %1$d/%2$d 件）",
    en: "Today’s Progress (%d remaining / %1$d/%2$d complete)",
  },
  today_tasks_heading: {
    ja: "今日のタスク",
    en: "Today’s tasks",
  },
  today_scheduled_tasks_heading: {
    ja: "指定時間帯のタスク",
    en: "Scheduled tasks",
  },
  today_completed_heading: {
    ja: "完了済み",
    en: "Completed",
  },
  // 遮断オーバーレイ画面
  gate_overlay_header: {
    ja: "集中タイムです",
    en: "Focus time",
  },
  gate_overlay_status_all_day: {
    ja: "今日のタスクを達成すると制限が解除されます",
    en: "Complete today's tasks to unlock.",
  },
  gate_overlay_status_window: {
    ja: "この時間帯（%1$s〜%2$s）の対象タスクを完了すると解除されます",
    en: "Complete the tasks for this time window (%1$s–%2$s) to unlock.",
  },
  // 制限タイミング（Todo / 習慣 共通）
  timing_section_title: {
    ja: "制限するタイミング",
    en: "When to limit",
  },
  timing_all_day_title: {
    ja: "終日",
    en: "All day",
  },
  timing_all_day_detail: {
    ja: "今日の達成までアプリを制限",
    en: "Limit apps until completed today",
  },
  timing_scheduled_title: {
    ja: "指定の時間帯",
    en: "Specific time window",
  },
  timing_scheduled_detail: {
    ja: "設定した時間帯（朝・夜など）の間だけブロック",
    en: "Block only during selected time windows (morning, night, etc.)",
  },
  timing_add_window: {
    ja: "+ 新しい時間帯を作成",
    en: "+ Create new time window",
  },
  // カラーテーマ（Todo / 習慣 共通）
  color_theme_title: {
    ja: "テーマカラー",
    en: "Color theme",
  },
  color_theme_guide: {
    ja: "カード左端の識別カラーとして表示されます",
    en: "Shown as the indicator bar on the left edge of the card",
  },
  color_choose_label: {
    ja: "色を選択",
    en: "Choose color",
  },
  // ウィジェット
  widget_title: {
    ja: "今日の目標",
    en: "TODAY'S GOALS",
  },
  widget_badge_all_day: {
    ja: "終日",
    en: "ALL-DAY",
  },
  widget_status_all_day: {
    ja: "残り %1$d 件",
    en: "%1$d remaining",
  },
  widget_status_window: {
    ja: "制限中（%1$s〜%2$s）",
    en: "Limited (%1$s–%2$s)",
  },
  widget_status_unlocked: {
    ja: "制限解除中",
    en: "Limits unlocked",
  },
  widget_status_off: {
    ja: "集中制限はオフです",
    en: "App limits off",
  },
  widget_bg_style_title: {
    ja: "背景スタイル",
    en: "Background style",
  },
  widget_bg_style_solid: {
    ja: "無地",
    en: "Solid",
  },
  widget_bg_style_geometric: {
    ja: "幾何学模様",
    en: "Geometric",
  },
  widget_bg_style_aurora: {
    ja: "オーロラ",
    en: "Aurora",
  },
  widget_bg_style_grid: {
    ja: "ミニマルグリッド",
    en: "Minimal Grid",
  },
  bg_theme_title: {
    ja: "背景テーマ",
    en: "Background theme",
  },
  bg_theme_detail: {
    ja: "アプリ全体とホーム画面ウィジェットに共通で反映されます",
    en: "Applies across the app and home-screen widgets",
  },
  pro_badge: {
    ja: "Pro",
    en: "Pro",
  },
  plus_feature_title: {
    ja: "Plus限定の機能です",
    en: "Plus feature",
  },
  plus_feature_bg_style_message: {
    ja: "カスタム背景テーマ（幾何学模様・オーロラ・ミニマルグリッド）はPlus限定です。Plusに登録してアプリとウィジェットをカスタマイズしますか？",
    en: "Custom background themes (Geometric, Aurora, Minimal Grid) are available with Plus. Upgrade to customize your app and widgets?",
  },
  plus_feature_font_title: {
    ja: "Plus限定のフォント",
    en: "Plus Typography",
  },
  plus_feature_font_message: {
    ja: "プレミアムフォント（リーディング・ノート・フォーカス）はPlus限定です。Plusに登録して文字をカスタマイズしますか？",
    en: "Premium typography (Reading, Notebook, Focus) is available with Plus. Upgrade to customize your fonts?",
  },
  free_limit_todo_message: {
    ja: "Todoは無料版では未完了2件までです。Plusに登録すると、Todo・習慣・メモが無制限になり、カスタム背景やフォントもすべてご利用いただけます。",
    en: "Free allows up to 2 active tasks. Plus unlocks unlimited tasks, habits, notes, custom backgrounds, and fonts.",
  },
  free_limit_habit_message: {
    ja: "習慣は無料版では2件までです。Plusに登録すると、Todo・習慣・メモが無制限になり、カスタム背景やフォントもすべてご利用いただけます。",
    en: "Free allows up to 2 habits. Plus unlocks unlimited tasks, habits, notes, custom backgrounds, and fonts.",
  },
  free_limit_app_message: {
    ja: "無料版では制限対象アプリを5件まで選べます。Plusに登録すると、アプリを無制限に制限でき、集中を深められます。",
    en: "Free allows up to 5 limited apps. Plus allows unlimited app limits to deepen your focus.",
  },
  plan_feature_unlimited_items: {
    ja: "Todo・習慣・メモ 無制限",
    en: "Unlimited tasks, habits & notes",
  },
  plan_feature_unlimited_apps: {
    ja: "制限アプリ 無制限",
    en: "Unlimited limited apps",
  },
  plan_feature_custom_bg: {
    ja: "カスタム背景（3種）",
    en: "3 custom backgrounds",
  },
  plan_feature_premium_fonts: {
    ja: "厳選フォント（3種）",
    en: "3 premium fonts",
  },
  plan_feature_theme_sets: {
    ja: "テーマセットの保存・復元",
    en: "Save & restore theme sets",
  },
  plan_feature_free_items: {
    ja: "Todo・習慣・メモ 各2件",
    en: "2 tasks, habits & notes",
  },
  plan_feature_free_apps: {
    ja: "制限アプリ 5件",
    en: "5 limited apps",
  },
  plan_feature_free_fonts: {
    ja: "標準フォントのみ",
    en: "Standard font only",
  },
  plan_feature_free_bg: {
    ja: "無地背景のみ",
    en: "Solid background only",
  },
  plan_feature_free_themes: {
    ja: "基本カラーテーマ",
    en: "Basic color themes",
  },
  // 習慣画面
  habit_today_progress: {
    ja: "今日 %1$d/%2$d 回",
    en: "Today %1$d/%2$d times",
  },
  habit_streak: {
    ja: "%d日連続",
    en: "%d-day streak",
  },
  habit_empty_title: {
    ja: "最初の習慣を作りましょう",
    en: "Create your first habit",
  },
  habit_empty_description: {
    ja: "続けたい行動を、回数・時間・記録方法に合わせて作成します。",
    en: "Create a recurring action with the right count, timing, and record method.",
  },
  // 設定画面
  settings_schedule_section_title: {
    ja: "時間帯制限の設定",
    en: "Time window limit settings",
  },
  settings_step_guide_title: {
    ja: "設定は3つの順番で進めます",
    en: "Set up in three steps",
  },
  settings_step_guide_detail: {
    ja: "1. 権限許可 → 2. アプリ選択 → 3. 時間帯設定。時間帯を選ばない場合はいつでも有効です。",
    en: "1. Permission → 2. Choose apps → 3. Time windows. Without a window, limits apply anytime.",
  },
  settings_switch_limit_tasks: {
    ja: "タスク完了までアプリを制限",
    en: "Limit apps until tasks are done",
  },
  settings_switch_limit_tasks_detail: {
    ja: "オンにする前に、Androidのアクセシビリティ許可を確認します。",
    en: "Android Accessibility permission is checked before enabling.",
  },
  settings_strict_mode_title: {
    ja: "厳格モード",
    en: "Strict mode",
  },
  settings_strict_mode_description: {
    ja: "制限中の設定変更やアプリ削除を防止し、うっかり解除を防ぎます。",
    en: "Prevents changing settings or deleting apps while limits are active.",
  },
  settings_strict_mode_active_description: {
    ja: "未完了の必須項目がある間は、ここから集中制限をオフにできません。遮断画面からアプリ情報も開きません。",
    en: "While must-dos remain, App limits can't be turned off here and the gate doesn't link to app info.",
  },
  must_do: {
    ja: "必須",
    en: "Must-do",
  },
  action_complete: {
    ja: "完了",
    en: "Complete",
  },
  action_delete: {
    ja: "削除",
    en: "Delete",
  },
};

/**
 * Android strings.xml と同様のフォーマット置換関数
 * %d, %s, %1$d, %2$d などのパラメータ展開に対応
 */
export function stringResource(
  id: StringResourceId,
  language: "ja" | "en" = "ja",
  ...args: (string | number)[]
): string {
  const resource = STRING_RESOURCES[id];
  if (!resource) return id;
  let text = language === "en" ? resource.en : resource.ja;

  // 「残り %d 件 / 完了 %1$d/%2$d 件」のように %d と %1$d/%2$d が共存するパターンの特別対応
  if (text.includes("%d") && (text.includes("%1$d") || text.includes("%1$s"))) {
    text = text.replace(/%[sd]/, String(args[0]));
    text = text.replace(/%1\$[sd]/g, String(args[1] ?? args[0]));
    text = text.replace(/%2\$[sd]/g, String(args[2] ?? args[1]));
    return text;
  }

  // %1$d, %2$s 等の位置指定プレースホルダー置換
  args.forEach((arg, index) => {
    const positionalPattern = new RegExp(`%${index + 1}\\$[sd]`, "g");
    text = text.replace(positionalPattern, String(arg));
  });

  // 通常の %d, %s を先頭から順次置換
  args.forEach((arg) => {
    text = text.replace(/%[sd]/, String(arg));
  });

  return text;
}

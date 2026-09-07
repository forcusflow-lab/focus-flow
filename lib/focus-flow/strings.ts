/**
 * Focus Flow String Resources (strings.xml 集約 & 型安全リソース管理)
 * Composable / View / React Native コンポーネントから `stringResource(R.string.xxx)` で呼び出し可能。
 */

export const R = {
  string: {
    app_name: "app_name",
    // 今日（Today）画面
    today_banner_locked: "today_banner_locked",
    today_banner_unlocked: "today_banner_unlocked",
    today_banner_off: "today_banner_off",
    today_banner_subtext: "today_banner_subtext",
    today_progress_heading: "today_progress_heading",
    today_tasks_heading: "today_tasks_heading",
    today_completed_heading: "today_completed_heading",
    // 習慣（Habit）画面
    habit_today_progress: "habit_today_progress",
    habit_streak: "habit_streak",
    habit_empty_title: "habit_empty_title",
    habit_empty_description: "habit_empty_description",
    // 設定（Settings）画面
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
  today_banner_locked: {
    ja: "制限中（残り %d 件）",
    en: "App limits active (%d remaining)",
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
  today_completed_heading: {
    ja: "完了済み",
    en: "Completed",
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

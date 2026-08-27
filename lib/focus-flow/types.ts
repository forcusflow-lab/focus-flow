export type Priority = "high" | "medium" | "low";
export type ProgressUnit = "check" | "count" | "minutes";
export type RepeatRule = "none" | "daily" | "weekly";
export type RequiredWindowMode = "always" | "scheduled";
export type WidgetThemeKind = "unified" | "overview" | "progress" | "next" | "habit" | "routine";
export type WidgetBackgroundTheme = "default" | "forest" | "ocean" | "violet" | "amber" | "blush" | "ink";
export type WidgetAccentTheme = "auto" | "mint" | "sky" | "violet" | "coral" | "gold" | "ink";
export type WidgetThemeSelection = { background: WidgetBackgroundTheme; accent: WidgetAccentTheme };
export type AppThemeId = "mist" | "slate" | "evergreen" | "ocean" | "orchid" | "sunrise";
export type AppearancePreference = "system" | "light" | "dark";
export type WidgetTextSize = "compact" | "standard" | "large";
export type WidgetTransparency = "solid" | "soft" | "clear";
export type WidgetCompletedDisplay = "hide" | "dim";
export type TodayCompletedDisplay = "hide" | "dim";
export type AppFontId = "system" | "reading" | "notebook" | "focus";
export type SavedThemeSet = { id: string; name: string; appTheme: AppThemeId; appearance: AppearancePreference; fontFamily?: AppFontId; widgetThemes: Partial<Record<WidgetThemeKind, WidgetThemeSelection>>; widgetTextSizes: Partial<Record<WidgetThemeKind, WidgetTextSize>>; widgetOpacity?: number; widgetBackgroundOpacity?: number; widgetCardOpacity?: number; widgetCompletedDisplay?: WidgetCompletedDisplay; todayCompletedDisplay?: TodayCompletedDisplay };

export type TodoSubtask = {
  id: string;
  title: string;
  completed: boolean;
};

export type Todo = {
  id: string;
  title: string;
  priority: Priority;
  dueDate?: string;
  isRequired: boolean;
  /** 必須項目を常時扱うか、選択した集中時間帯だけ扱うか。 */
  requiredWindowMode?: RequiredWindowMode;
  /** requiredWindowMode が scheduled のときに使う GateSchedule のID。 */
  requiredScheduleIds?: string[];
  completed: boolean;
  completedAt?: string;
  progressUnit?: ProgressUnit;
  targetValue?: number;
  progressValue?: number;
  /** 開始後、設定した分数が経過するまで達成扱いにしない時間管理用の開始時刻。 */
  timerStartedAt?: string;
  /** 消費型の早期完了商品が使われた時刻。 */
  earlyCompletionAt?: string;
  repeatRule?: RepeatRule;
  subtasks?: TodoSubtask[];
  createdAt: string;
};

export type Habit = {
  id: string;
  title: string;
  color: string;
  goalPerWeek: number;
  isRequired: boolean;
  /** 必須項目を常時扱うか、選択した集中時間帯だけ扱うか。 */
  requiredWindowMode?: RequiredWindowMode;
  /** requiredWindowMode が scheduled のときに使う GateSchedule のID。 */
  requiredScheduleIds?: string[];
  completedDates: string[];
  progressUnit?: ProgressUnit;
  targetValue?: number;
  dailyProgress?: Record<string, number>;
  /** 日ごとの時間管理開始時刻。キーは YYYY-MM-DD。 */
  timerStartedAtByDate?: Record<string, string>;
  /** 一時停止した日ごとの累積計測秒。再開時はこの値から計測を続ける。 */
  timerElapsedSecondsByDate?: Record<string, number>;
  /** 消費型の早期完了商品が使われた日付。 */
  earlyCompletionDates?: string[];
  createdAt: string;
};

export type Memo = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type FocusSession = {
  id: string;
  startedAt: string;
  durationMinutes: number;
  completed: boolean;
};

export type GateConfig = {
  enabled: boolean;
  /** 必須項目が残る間、Focus Flow内からの通常の制限オフ操作を保護する任意モード。 */
  strictMode?: boolean;
  blockedPackages: string[];
  requiredTodoIds: string[];
  requiredHabitIds: string[];
  autoRequireDueToday: boolean;
  accessibilityDisclosureAcceptedAt?: string;
  schedules: GateSchedule[];
};

export type GateSchedule = {
  id: string;
  label: string;
  enabled: boolean;
  days: number[];
  startTime: string;
  endTime: string;
  requiredTodoIds?: string[];
  requiredHabitIds?: string[];
  blockedPackages?: string[];
};

export type DisplaySettings = {
  fontScale: "compact" | "standard" | "large";
  theme: "mist" | "slate";
  appTheme?: AppThemeId;
  appearance?: AppearancePreference;
  fontFamily?: AppFontId;
  cardOpacity: "solid" | "soft" | "glass";
  language?: "auto" | "ja" | "en";
  deviceSetupCompletedAt?: string;
  dailyReminderEnabled?: boolean;
  dailyReminderTime?: string;
  widgetThemes?: Partial<Record<WidgetThemeKind, WidgetThemeSelection>>;
  widgetTextSizes?: Partial<Record<WidgetThemeKind, WidgetTextSize>>;
  /** v18以前のWidget背景不透明度。v19以降はwidgetBackgroundOpacityへ移行する。 */
  widgetOpacity?: number;
  /** ホーム画面Widgetの背景・見出し面の不透明度。0は背景を消し、100は完全に表示する。 */
  widgetBackgroundOpacity?: number;
  /** ホーム画面WidgetのTodo／Habit行の面の不透明度。0は行面を消し、100は完全に表示する。 */
  widgetCardOpacity?: number;
  widgetTransparency?: WidgetTransparency;
  widgetCompletedDisplay?: WidgetCompletedDisplay;
  /** Today画面で当日対象として完了済み項目を残すかをWidgetとは別に選ぶ。 */
  todayCompletedDisplay?: TodayCompletedDisplay;
  savedThemeSets?: SavedThemeSet[];
  plusEntitlement?: boolean;
};

export const DEFAULT_GATE_CONFIG: GateConfig = { enabled: false, strictMode: false, blockedPackages: [], requiredTodoIds: [], requiredHabitIds: [], autoRequireDueToday: true, accessibilityDisclosureAcceptedAt: undefined, schedules: [] };

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  fontScale: "standard",
  theme: "mist",
  appTheme: "mist",
  appearance: "system",
  fontFamily: "system",
  cardOpacity: "solid",
  language: "auto",
  dailyReminderEnabled: false,
  dailyReminderTime: "19:00",
  widgetTextSizes: {},
  widgetOpacity: 86,
  widgetBackgroundOpacity: 86,
  widgetCardOpacity: 100,
  widgetTransparency: "soft",
  widgetCompletedDisplay: "dim",
  todayCompletedDisplay: "hide",
  savedThemeSets: [],
  plusEntitlement: false,
};

export type FocusFlowData = {
  todos: Todo[];
  habits: Habit[];
  memos: Memo[];
  focusSessions: FocusSession[];
  gateConfig: GateConfig;
  displaySettings: DisplaySettings;
};

export const EMPTY_FOCUS_FLOW_DATA: FocusFlowData = {
  todos: [],
  habits: [],
  memos: [],
  focusSessions: [],
  gateConfig: DEFAULT_GATE_CONFIG,
  displaySettings: DEFAULT_DISPLAY_SETTINGS,
};

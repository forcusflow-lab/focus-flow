export type Priority = "high" | "medium" | "low";
export type ProgressUnit = "check" | "count" | "minutes";
export type RepeatRule = "none" | "daily" | "weekly";

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
  completed: boolean;
  completedAt?: string;
  progressUnit?: ProgressUnit;
  targetValue?: number;
  progressValue?: number;
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
  completedDates: string[];
  progressUnit?: ProgressUnit;
  targetValue?: number;
  dailyProgress?: Record<string, number>;
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
  cardOpacity: "solid" | "soft" | "glass";
  language?: "auto" | "ja" | "en";
  deviceSetupCompletedAt?: string;
};

export const DEFAULT_GATE_CONFIG: GateConfig = { enabled: false, blockedPackages: [], requiredTodoIds: [], requiredHabitIds: [], autoRequireDueToday: true, accessibilityDisclosureAcceptedAt: undefined, schedules: [] };

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  fontScale: "standard",
  theme: "mist",
  cardOpacity: "solid",
  language: "auto",
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

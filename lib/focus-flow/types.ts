export type Priority = "high" | "medium" | "low";

export type Todo = {
  id: string;
  title: string;
  priority: Priority;
  dueDate?: string;
  isRequired: boolean;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
};

export type Habit = {
  id: string;
  title: string;
  color: string;
  goalPerWeek: number;
  isRequired: boolean;
  completedDates: string[];
  createdAt: string;
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
};

export const DEFAULT_GATE_CONFIG: GateConfig = { enabled: false, blockedPackages: [], requiredTodoIds: [], requiredHabitIds: [], autoRequireDueToday: true, schedules: [] };

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  fontScale: "standard",
  theme: "mist",
  cardOpacity: "solid",
};

export type FocusFlowData = {
  todos: Todo[];
  habits: Habit[];
  focusSessions: FocusSession[];
  gateConfig: GateConfig;
  displaySettings: DisplaySettings;
};

export const EMPTY_FOCUS_FLOW_DATA: FocusFlowData = {
  todos: [],
  habits: [],
  focusSessions: [],
  gateConfig: DEFAULT_GATE_CONFIG,
  displaySettings: DEFAULT_DISPLAY_SETTINGS,
};

export type Priority = "high" | "medium" | "low";

export type Todo = {
  id: string;
  title: string;
  priority: Priority;
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
};

export type Habit = {
  id: string;
  title: string;
  color: string;
  goalPerWeek: number;
  completedDates: string[];
  createdAt: string;
};

export type FocusSession = {
  id: string;
  startedAt: string;
  durationMinutes: number;
  completed: boolean;
};

export type FocusFlowData = {
  todos: Todo[];
  habits: Habit[];
  focusSessions: FocusSession[];
};

export const EMPTY_FOCUS_FLOW_DATA: FocusFlowData = {
  todos: [],
  habits: [],
  focusSessions: [],
};

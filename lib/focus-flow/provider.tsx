import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";

import { consumeWidgetCompletions, syncAndroidGate } from "./android-gate";
import { getPlusStatus as readPlusStatus, purchasePlus as startPlusPurchase, restorePlus as restorePlusPurchase, type PlusStatus } from "./billing";
import { cancelDailyReminder } from "./reminders";
import { createId, dayKey, getTodoSubtasks, isTodoAchieved, isTodoRequiredForGate, nextRecurringDueDate } from "./utils";
import { DEFAULT_DISPLAY_SETTINGS, DEFAULT_GATE_CONFIG, DisplaySettings, EMPTY_FOCUS_FLOW_DATA, FocusFlowData, GateConfig, Habit, Memo, Priority, ProgressUnit, RepeatRule, Todo, TodoSubtask } from "./types";
import { isPremiumAppTheme } from "./app-themes";

const STORAGE_KEY = "@focus-flow/data-v1";

export type TodoInput = { title: string; priority: Priority; dueDate?: string; isRequired: boolean; progressUnit?: ProgressUnit; targetValue?: number; repeatRule?: RepeatRule; subtasks?: TodoSubtask[] };
export type HabitInput = { title: string; color: string; goalPerWeek: number; isRequired: boolean; progressUnit?: ProgressUnit; targetValue?: number };

type FocusFlowContextValue = FocusFlowData & {
  isReady: boolean;
  addTodo: (input: TodoInput) => void;
  updateTodo: (id: string, input: TodoInput) => void;
  toggleTodo: (id: string) => void;
  adjustTodoProgress: (id: string, delta: number) => void;
  toggleSubtask: (todoId: string, subtaskId: string) => void;
  deleteTodo: (id: string) => void;
  addHabit: (input: HabitInput) => void;
  updateHabit: (id: string, input: HabitInput) => void;
  toggleHabit: (id: string, date?: string) => void;
  adjustHabitProgress: (id: string, delta: number, date?: string) => void;
  deleteHabit: (id: string) => void;
  addMemo: (input: { title?: string; body: string }) => void;
  updateMemo: (id: string, input: { title?: string; body: string }) => void;
  deleteMemo: (id: string) => void;
  addFocusSession: (durationMinutes: number) => void;
  setGateConfig: (input: Partial<GateConfig>) => void;
  setDisplaySettings: (input: Partial<DisplaySettings>) => void;
  clearAllData: () => void;
  plusStatus: PlusStatus;
  refreshPlusStatus: () => Promise<void>;
  purchasePlus: () => Promise<void>;
  restorePlus: () => Promise<void>;
};

const FocusFlowContext = createContext<FocusFlowContextValue | null>(null);

function normalizedTodo(todo: Todo, legacyIds: Set<string>): Todo {
  return {
    ...todo,
    isRequired: Boolean(todo.isRequired || legacyIds.has(todo.id)),
    progressUnit: todo.progressUnit ?? "check",
    targetValue: Math.max(Number(todo.targetValue) || 1, 1),
    progressValue: Math.max(Number(todo.progressValue) || 0, 0),
    repeatRule: todo.repeatRule ?? "none",
    subtasks: Array.isArray(todo.subtasks) ? todo.subtasks.map((subtask) => ({ ...subtask, completed: Boolean(subtask.completed) })) : [],
  };
}

function normalizedHabit(habit: Habit, legacyIds: Set<string>): Habit {
  return {
    ...habit,
    isRequired: Boolean(habit.isRequired || legacyIds.has(habit.id)),
    progressUnit: habit.progressUnit ?? "check",
    targetValue: Math.max(Number(habit.targetValue) || 1, 1),
    dailyProgress: habit.dailyProgress && typeof habit.dailyProgress === "object" ? habit.dailyProgress : {},
  };
}

function normalizeData(value: unknown): FocusFlowData {
  if (!value || typeof value !== "object") return EMPTY_FOCUS_FLOW_DATA;
  const candidate = value as Partial<FocusFlowData>;
  const gateConfig = { ...DEFAULT_GATE_CONFIG, ...(candidate.gateConfig ?? {}) };
  const legacyTodoIds = new Set([...(gateConfig.requiredTodoIds ?? []), ...gateConfig.schedules.flatMap((schedule) => schedule.requiredTodoIds ?? [])]);
  const legacyHabitIds = new Set([...(gateConfig.requiredHabitIds ?? []), ...gateConfig.schedules.flatMap((schedule) => schedule.requiredHabitIds ?? [])]);
  return {
    todos: Array.isArray(candidate.todos) ? candidate.todos.map((todo) => normalizedTodo(todo, legacyTodoIds)) : [],
    habits: Array.isArray(candidate.habits) ? candidate.habits.map((habit) => normalizedHabit(habit, legacyHabitIds)) : [],
    memos: Array.isArray(candidate.memos) ? candidate.memos : [],
    focusSessions: Array.isArray(candidate.focusSessions) ? candidate.focusSessions : [],
    gateConfig: { ...gateConfig, requiredTodoIds: [], requiredHabitIds: [], schedules: gateConfig.schedules.map((schedule) => ({ ...schedule, requiredTodoIds: [], requiredHabitIds: [] })) },
    displaySettings: { ...DEFAULT_DISPLAY_SETTINGS, ...(candidate.displaySettings ?? {}), appTheme: candidate.displaySettings?.appTheme ?? candidate.displaySettings?.theme ?? "mist" },
  };
}

function progressComplete(todo: Todo) {
  const subtasks = getTodoSubtasks(todo);
  const progressMet = todo.progressUnit === "check" || (todo.progressValue ?? 0) >= (todo.targetValue ?? 1);
  return progressMet && (subtasks.length === 0 || subtasks.every((subtask) => subtask.completed));
}

function resetRecurringTodo(todo: Todo) {
  return {
    ...todo,
    completed: false,
    completedAt: undefined,
    dueDate: nextRecurringDueDate(todo.dueDate, todo.repeatRule),
    progressValue: 0,
    subtasks: getTodoSubtasks(todo).map((subtask) => ({ ...subtask, completed: false })),
  };
}

function maybeAdvanceRecurring(todo: Todo) {
  return todo.repeatRule && todo.repeatRule !== "none" && isTodoAchieved(todo) ? resetRecurringTodo(todo) : todo;
}

export function FocusFlowProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FocusFlowData>(EMPTY_FOCUS_FLOW_DATA);
  const [isReady, setIsReady] = useState(false);
  const [plusStatus, setPlusStatus] = useState<PlusStatus>({ status: "unavailable", active: false });

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY).then((serialized) => {
      if (active && serialized) setData(normalizeData(JSON.parse(serialized)));
    }).catch(() => {
      if (active) setData(EMPTY_FOCUS_FLOW_DATA);
    }).finally(() => {
      if (active) setIsReady(true);
    });
    return () => { active = false; };
  }, []);

  const commit = useCallback((updater: (current: FocusFlowData) => FocusFlowData) => {
    setData((current) => {
      const next = updater(current);
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const addTodo = useCallback((input: TodoInput) => {
    const title = input.title.trim();
    if (!title) return;
    const progressUnit = input.progressUnit ?? "check"; const targetValue = Math.max(input.targetValue ?? 1, 1); const repeatRule = input.repeatRule ?? "none"; const subtasks = input.subtasks ?? [];
    const todo: Todo = { id: createId("todo"), title, priority: input.priority, dueDate: input.dueDate ?? (repeatRule === "none" ? undefined : dayKey()), isRequired: input.isRequired, completed: false, progressUnit, targetValue, progressValue: 0, repeatRule, subtasks, createdAt: new Date().toISOString() };
    commit((current) => ({ ...current, todos: [todo, ...current.todos] }));
  }, [commit]);

  const updateTodo = useCallback((id: string, input: TodoInput) => {
    const title = input.title.trim();
    if (!title) return;
    commit((current) => ({ ...current, todos: current.todos.map((todo) => {
      if (todo.id !== id) return todo;
      const progressUnit = input.progressUnit ?? "check"; const targetValue = Math.max(input.targetValue ?? 1, 1); const repeatRule = input.repeatRule ?? "none"; const subtasks = input.subtasks ?? [];
      const updated: Todo = { ...todo, title, priority: input.priority, dueDate: input.dueDate ?? (repeatRule === "none" ? undefined : todo.dueDate ?? dayKey()), isRequired: input.isRequired, progressUnit, targetValue, progressValue: progressUnit === "check" ? 0 : Math.min(todo.progressValue ?? 0, targetValue), repeatRule, subtasks };
      return { ...updated, completed: progressComplete(updated) && todo.completed };
    }) }));
  }, [commit]);

  const toggleTodo = useCallback((id: string) => {
    commit((current) => ({ ...current, todos: current.todos.map((todo) => {
      if (todo.id !== id) return todo;
      if (isTodoAchieved(todo)) return { ...todo, completed: false, completedAt: undefined, progressValue: 0, subtasks: getTodoSubtasks(todo).map((subtask) => ({ ...subtask, completed: false })) };
      const completed: Todo = { ...todo, completed: true, completedAt: new Date().toISOString(), progressValue: todo.progressUnit === "check" ? todo.progressValue : todo.targetValue, subtasks: getTodoSubtasks(todo).map((subtask) => ({ ...subtask, completed: true })) };
      return maybeAdvanceRecurring(completed);
    }) }));
  }, [commit]);

  const adjustTodoProgress = useCallback((id: string, delta: number) => {
    commit((current) => ({ ...current, todos: current.todos.map((todo) => {
      if (todo.id !== id || todo.progressUnit === "check") return todo;
      const progressValue = Math.min(Math.max((todo.progressValue ?? 0) + delta, 0), todo.targetValue ?? 1);
      const provisional = { ...todo, progressValue };
      const complete = progressComplete(provisional);
      return maybeAdvanceRecurring({ ...provisional, completed: complete, completedAt: complete ? new Date().toISOString() : undefined });
    }) }));
  }, [commit]);

  const toggleSubtask = useCallback((todoId: string, subtaskId: string) => {
    commit((current) => ({ ...current, todos: current.todos.map((todo) => {
      if (todo.id !== todoId) return todo;
      const subtasks = getTodoSubtasks(todo).map((subtask) => subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask);
      const provisional = { ...todo, subtasks };
      const complete = progressComplete(provisional);
      return maybeAdvanceRecurring({ ...provisional, completed: complete, completedAt: complete ? new Date().toISOString() : undefined });
    }) }));
  }, [commit]);

  const deleteTodo = useCallback((id: string) => commit((current) => ({ ...current, todos: current.todos.filter((todo) => todo.id !== id) })), [commit]);

  const addHabit = useCallback((input: HabitInput) => {
    const title = input.title.trim();
    if (!title) return;
    const habit: Habit = { id: createId("habit"), title, color: input.color, goalPerWeek: Math.min(Math.max(input.goalPerWeek, 1), 7), isRequired: input.isRequired, completedDates: [], progressUnit: input.progressUnit ?? "check", targetValue: Math.max(input.targetValue ?? 1, 1), dailyProgress: {}, createdAt: new Date().toISOString() };
    commit((current) => ({ ...current, habits: [habit, ...current.habits] }));
  }, [commit]);

  const updateHabit = useCallback((id: string, input: HabitInput) => {
    const title = input.title.trim();
    if (!title) return;
    commit((current) => ({ ...current, habits: current.habits.map((habit) => habit.id === id ? { ...habit, title, color: input.color, goalPerWeek: Math.min(Math.max(input.goalPerWeek, 1), 7), isRequired: input.isRequired, progressUnit: input.progressUnit ?? "check", targetValue: Math.max(input.targetValue ?? 1, 1) } : habit) }));
  }, [commit]);

  const toggleHabit = useCallback((id: string, date = dayKey()) => {
    commit((current) => ({ ...current, habits: current.habits.map((habit) => {
      if (habit.id !== id) return habit;
      const completedDates = habit.completedDates.includes(date) ? habit.completedDates.filter((item) => item !== date) : [...habit.completedDates, date].sort();
      return { ...habit, completedDates, dailyProgress: { ...(habit.dailyProgress ?? {}), [date]: completedDates.includes(date) ? habit.targetValue ?? 1 : 0 } };
    }) }));
  }, [commit]);

  const adjustHabitProgress = useCallback((id: string, delta: number, date = dayKey()) => {
    commit((current) => ({ ...current, habits: current.habits.map((habit) => {
      if (habit.id !== id || habit.progressUnit === "check") return habit;
      const target = habit.targetValue ?? 1;
      const value = Math.min(Math.max((habit.dailyProgress?.[date] ?? 0) + delta, 0), target);
      const completedDates = value >= target ? Array.from(new Set([...habit.completedDates, date])).sort() : habit.completedDates.filter((item) => item !== date);
      return { ...habit, dailyProgress: { ...(habit.dailyProgress ?? {}), [date]: value }, completedDates };
    }) }));
  }, [commit]);

  const deleteHabit = useCallback((id: string) => commit((current) => ({ ...current, habits: current.habits.filter((habit) => habit.id !== id) })), [commit]);

  const addMemo = useCallback(({ title, body }: { title?: string; body: string }) => {
    const trimmedBody = body.trim(); const trimmedTitle = title?.trim() ?? "";
    if (!trimmedTitle && !trimmedBody) return;
    const now = new Date().toISOString();
    const memo: Memo = { id: createId("memo"), title: trimmedTitle || trimmedBody.split("\n")[0].slice(0, 38), body: trimmedBody, createdAt: now, updatedAt: now };
    commit((current) => ({ ...current, memos: [memo, ...current.memos] }));
  }, [commit]);

  const updateMemo = useCallback((id: string, { title, body }: { title?: string; body: string }) => {
    const trimmedBody = body.trim(); const trimmedTitle = title?.trim() ?? "";
    if (!trimmedTitle && !trimmedBody) return;
    commit((current) => ({ ...current, memos: current.memos.map((memo) => memo.id === id ? { ...memo, title: trimmedTitle || trimmedBody.split("\n")[0].slice(0, 38), body: trimmedBody, updatedAt: new Date().toISOString() } : memo) }));
  }, [commit]);

  const deleteMemo = useCallback((id: string) => commit((current) => ({ ...current, memos: current.memos.filter((memo) => memo.id !== id) })), [commit]);

  const addFocusSession = useCallback((durationMinutes: number) => {
    if (durationMinutes <= 0) return;
    commit((current) => ({ ...current, focusSessions: [{ id: createId("focus"), startedAt: new Date().toISOString(), durationMinutes, completed: true }, ...current.focusSessions] }));
  }, [commit]);

  const setGateConfig = useCallback((input: Partial<GateConfig>) => commit((current) => ({ ...current, gateConfig: { ...current.gateConfig, ...input } })), [commit]);
  const setDisplaySettings = useCallback((input: Partial<DisplaySettings>) => commit((current) => {
    const requestedTheme = input.appTheme ?? current.displaySettings.appTheme ?? current.displaySettings.theme;
    const canUseTheme = !isPremiumAppTheme(requestedTheme) || Boolean(current.displaySettings.plusEntitlement);
    const nextInput = canUseTheme ? input : { ...input, appTheme: current.displaySettings.appTheme ?? current.displaySettings.theme };
    return { ...current, displaySettings: { ...current.displaySettings, ...nextInput } };
  }), [commit]);
  const clearAllData = useCallback(() => {
    setData({ todos: [], habits: [], memos: [], focusSessions: [], gateConfig: { ...DEFAULT_GATE_CONFIG, blockedPackages: [], requiredTodoIds: [], requiredHabitIds: [], schedules: [] }, displaySettings: { ...DEFAULT_DISPLAY_SETTINGS } });
    void AsyncStorage.removeItem(STORAGE_KEY);
    void cancelDailyReminder();
  }, []);

  const applyPlusStatus = useCallback((status: PlusStatus) => {
    setPlusStatus(status);
    commit((current) => current.displaySettings.plusEntitlement === status.active ? current : { ...current, displaySettings: { ...current.displaySettings, plusEntitlement: status.active } });
  }, [commit]);
  const refreshPlusStatus = useCallback(async () => { applyPlusStatus(await readPlusStatus()); }, [applyPlusStatus]);
  const purchasePlus = useCallback(async () => { setPlusStatus((current) => ({ ...current, status: "loading" })); applyPlusStatus(await startPlusPurchase()); }, [applyPlusStatus]);
  const restorePlus = useCallback(async () => { setPlusStatus((current) => ({ ...current, status: "loading" })); applyPlusStatus(await restorePlusPurchase()); }, [applyPlusStatus]);

  const applyWidgetCompletions = useCallback(async () => {
    const actions = await consumeWidgetCompletions();
    if (!actions.length) return;
    commit((current) => {
      const today = dayKey();
      const todoIds = new Set(actions.filter((action) => action.kind === "todo").map((action) => action.id));
      const habitIds = new Set(actions.filter((action) => action.kind === "habit").map((action) => action.id));
      const todos = current.todos.map((todo) => {
        if (!todoIds.has(todo.id) || isTodoAchieved(todo) || !isTodoRequiredForGate(todo, current.gateConfig.autoRequireDueToday)) return todo;
        const completed: Todo = { ...todo, completed: true, completedAt: new Date().toISOString(), progressValue: todo.progressUnit === "check" ? todo.progressValue : todo.targetValue, subtasks: getTodoSubtasks(todo).map((subtask) => ({ ...subtask, completed: true })) };
        return maybeAdvanceRecurring(completed);
      });
      const habits = current.habits.map((habit) => {
        if (!habitIds.has(habit.id) || !habit.isRequired) return habit;
        const completedDates = Array.from(new Set([...habit.completedDates, today])).sort();
        return { ...habit, completedDates, dailyProgress: { ...(habit.dailyProgress ?? {}), [today]: habit.targetValue ?? 1 } };
      });
      return { ...current, todos, habits };
    });
  }, [commit]);

  useEffect(() => {
    if (!isReady) return;
    void applyWidgetCompletions();
    void refreshPlusStatus();
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") { void applyWidgetCompletions(); void refreshPlusStatus(); } });
    return () => subscription.remove();
  }, [applyWidgetCompletions, isReady, refreshPlusStatus]);

  useEffect(() => { if (isReady) void syncAndroidGate(data); }, [data, isReady]);

  const value = useMemo(() => ({ ...data, isReady, addTodo, updateTodo, toggleTodo, adjustTodoProgress, toggleSubtask, deleteTodo, addHabit, updateHabit, toggleHabit, adjustHabitProgress, deleteHabit, addMemo, updateMemo, deleteMemo, addFocusSession, setGateConfig, setDisplaySettings, clearAllData, plusStatus, refreshPlusStatus, purchasePlus, restorePlus }), [data, isReady, addTodo, updateTodo, toggleTodo, adjustTodoProgress, toggleSubtask, deleteTodo, addHabit, updateHabit, toggleHabit, adjustHabitProgress, deleteHabit, addMemo, updateMemo, deleteMemo, addFocusSession, setGateConfig, setDisplaySettings, clearAllData, plusStatus, refreshPlusStatus, purchasePlus, restorePlus]);

  return <FocusFlowContext.Provider value={value}>{children}</FocusFlowContext.Provider>;
}

export function useFocusFlow() {
  const context = useContext(FocusFlowContext);
  if (!context) throw new Error("useFocusFlow must be used within FocusFlowProvider");
  return context;
}

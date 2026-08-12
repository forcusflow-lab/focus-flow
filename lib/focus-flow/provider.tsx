import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { createId, dayKey } from "./utils";
import { syncAndroidGate } from "./android-gate";
import { DEFAULT_DISPLAY_SETTINGS, DEFAULT_GATE_CONFIG, DisplaySettings, EMPTY_FOCUS_FLOW_DATA, FocusFlowData, GateConfig, Habit, Priority, Todo } from "./types";

const STORAGE_KEY = "@focus-flow/data-v1";

type FocusFlowContextValue = FocusFlowData & {
  isReady: boolean;
  addTodo: (input: { title: string; priority: Priority; dueDate?: string; isRequired: boolean }) => void;
  updateTodo: (id: string, input: { title: string; priority: Priority; dueDate?: string; isRequired: boolean }) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  addHabit: (input: { title: string; color: string; goalPerWeek: number; isRequired: boolean }) => void;
  updateHabit: (id: string, input: { title: string; color: string; goalPerWeek: number; isRequired: boolean }) => void;
  toggleHabit: (id: string, date?: string) => void;
  deleteHabit: (id: string) => void;
  addFocusSession: (durationMinutes: number) => void;
  setGateConfig: (input: Partial<GateConfig>) => void;
  setDisplaySettings: (input: Partial<DisplaySettings>) => void;
};

const FocusFlowContext = createContext<FocusFlowContextValue | null>(null);

function normalizeData(value: unknown): FocusFlowData {
  if (!value || typeof value !== "object") return EMPTY_FOCUS_FLOW_DATA;
  const candidate = value as Partial<FocusFlowData>;
  const gateConfig = { ...DEFAULT_GATE_CONFIG, ...(candidate.gateConfig ?? {}) };
  const legacyTodoIds = new Set([...(gateConfig.requiredTodoIds ?? []), ...gateConfig.schedules.flatMap((schedule) => schedule.requiredTodoIds ?? [])]);
  const legacyHabitIds = new Set([...(gateConfig.requiredHabitIds ?? []), ...gateConfig.schedules.flatMap((schedule) => schedule.requiredHabitIds ?? [])]);
  return {
    todos: Array.isArray(candidate.todos) ? candidate.todos.map((todo) => ({ ...todo, isRequired: Boolean(todo.isRequired || legacyTodoIds.has(todo.id)) })) : [],
    habits: Array.isArray(candidate.habits) ? candidate.habits.map((habit) => ({ ...habit, isRequired: Boolean(habit.isRequired || legacyHabitIds.has(habit.id)) })) : [],
    focusSessions: Array.isArray(candidate.focusSessions) ? candidate.focusSessions : [],
    gateConfig: { ...gateConfig, requiredTodoIds: [], requiredHabitIds: [], schedules: gateConfig.schedules.map((schedule) => ({ ...schedule, requiredTodoIds: [], requiredHabitIds: [] })) },
    displaySettings: { ...DEFAULT_DISPLAY_SETTINGS, ...(candidate.displaySettings ?? {}) },
  };
}

export function FocusFlowProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FocusFlowData>(EMPTY_FOCUS_FLOW_DATA);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((serialized) => {
        if (active && serialized) setData(normalizeData(JSON.parse(serialized)));
      })
      .catch(() => {
        if (active) setData(EMPTY_FOCUS_FLOW_DATA);
      })
      .finally(() => {
        if (active) setIsReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const commit = useCallback((updater: (current: FocusFlowData) => FocusFlowData) => {
    setData((current) => {
      const next = updater(current);
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const addTodo = useCallback(
    ({ title, priority, dueDate, isRequired }: { title: string; priority: Priority; dueDate?: string; isRequired: boolean }) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      const todo: Todo = { id: createId("todo"), title: trimmed, priority, dueDate, isRequired, completed: false, createdAt: new Date().toISOString() };
      commit((current) => ({ ...current, todos: [todo, ...current.todos] }));
    },
    [commit],
  );

  const updateTodo = useCallback(
    (id: string, { title, priority, dueDate, isRequired }: { title: string; priority: Priority; dueDate?: string; isRequired: boolean }) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      commit((current) => ({
        ...current,
        todos: current.todos.map((todo) => (todo.id === id ? { ...todo, title: trimmed, priority, dueDate, isRequired } : todo)),
      }));
    },
    [commit],
  );

  const toggleTodo = useCallback(
    (id: string) => {
      commit((current) => ({
        ...current,
        todos: current.todos.map((todo) =>
          todo.id === id
            ? { ...todo, completed: !todo.completed, completedAt: !todo.completed ? new Date().toISOString() : undefined }
            : todo,
        ),
      }));
    },
    [commit],
  );

  const deleteTodo = useCallback((id: string) => commit((current) => ({ ...current, todos: current.todos.filter((todo) => todo.id !== id) })), [commit]);

  const addHabit = useCallback(
    ({ title, color, goalPerWeek, isRequired }: { title: string; color: string; goalPerWeek: number; isRequired: boolean }) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      const habit: Habit = {
        id: createId("habit"),
        title: trimmed,
        color,
        goalPerWeek: Math.min(Math.max(goalPerWeek, 1), 7),
        isRequired,
        completedDates: [],
        createdAt: new Date().toISOString(),
      };
      commit((current) => ({ ...current, habits: [habit, ...current.habits] }));
    },
    [commit],
  );

  const updateHabit = useCallback(
    (id: string, { title, color, goalPerWeek, isRequired }: { title: string; color: string; goalPerWeek: number; isRequired: boolean }) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      commit((current) => ({
        ...current,
        habits: current.habits.map((habit) =>
          habit.id === id ? { ...habit, title: trimmed, color, goalPerWeek: Math.min(Math.max(goalPerWeek, 1), 7), isRequired } : habit,
        ),
      }));
    },
    [commit],
  );

  const toggleHabit = useCallback(
    (id: string, date = dayKey()) => {
      commit((current) => ({
        ...current,
        habits: current.habits.map((habit) => {
          if (habit.id !== id) return habit;
          const completedDates = habit.completedDates.includes(date)
            ? habit.completedDates.filter((item) => item !== date)
            : [...habit.completedDates, date].sort();
          return { ...habit, completedDates };
        }),
      }));
    },
    [commit],
  );

  const deleteHabit = useCallback((id: string) => commit((current) => ({ ...current, habits: current.habits.filter((habit) => habit.id !== id) })), [commit]);

  const addFocusSession = useCallback(
    (durationMinutes: number) => {
      if (durationMinutes <= 0) return;
      commit((current) => ({
        ...current,
        focusSessions: [
          { id: createId("focus"), startedAt: new Date().toISOString(), durationMinutes, completed: true },
          ...current.focusSessions,
        ],
      }));
    },
    [commit],
  );

  const setGateConfig = useCallback(
    (input: Partial<GateConfig>) => commit((current) => ({ ...current, gateConfig: { ...current.gateConfig, ...input } })),
    [commit],
  );

  const setDisplaySettings = useCallback(
    (input: Partial<DisplaySettings>) => commit((current) => ({ ...current, displaySettings: { ...current.displaySettings, ...input } })),
    [commit],
  );

  useEffect(() => {
    if (isReady) void syncAndroidGate(data);
  }, [data, isReady]);

  const value = useMemo(
    () => ({ ...data, isReady, addTodo, updateTodo, toggleTodo, deleteTodo, addHabit, updateHabit, toggleHabit, deleteHabit, addFocusSession, setGateConfig, setDisplaySettings }),
    [data, isReady, addTodo, updateTodo, toggleTodo, deleteTodo, addHabit, updateHabit, toggleHabit, deleteHabit, addFocusSession, setGateConfig, setDisplaySettings],
  );

  return <FocusFlowContext.Provider value={value}>{children}</FocusFlowContext.Provider>;
}

export function useFocusFlow() {
  const context = useContext(FocusFlowContext);
  if (!context) throw new Error("useFocusFlow must be used within FocusFlowProvider");
  return context;
}

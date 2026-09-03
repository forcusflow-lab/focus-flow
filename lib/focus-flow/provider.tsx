import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState, InteractionManager, Platform } from "react-native";
import Constants from "expo-constants";

import { consumeWidgetActions, syncAndroidGate, type WidgetAction } from "./android-gate";
import { EARLY_COMPLETION_PRODUCT_ID, PLUS_PRODUCT_ID, type EarlyCompletionStatus, type PlusStatus } from "./billing";
import { finishPlatformPurchase, openSubscriptionManagement, usePlatformIAP, type IapProduct, type IapSubscription } from "./iap-bridge";
import { canSelectBlockedApp as canSelectBlockedAppForPlan, capBlockedApps, countUncompletedTodos, isFreeItemLimitReached } from "./limits";
import { cancelDailyReminder } from "./reminders";
import { createId, dayKey, getGateSummary, getHabitTimerProgress, getTodoSubtasks, isHabitCompleteOn, isHabitTimeReady, isTimedTodo, isTodoAchieved, isTodoTimeReady, nextRecurringDueDate } from "./utils";
import { DEFAULT_DISPLAY_SETTINGS, DEFAULT_GATE_CONFIG, DisplaySettings, EMPTY_FOCUS_FLOW_DATA, FocusFlowData, GateConfig, Habit, Memo, Priority, ProgressUnit, RepeatRule, RequiredWindowMode, Todo, TodoSubtask } from "./types";

const STORAGE_KEY = "@focus-flow/data-v1";
const PERSONAL_UNLIMITED_BUILD = Constants.expoConfig?.extra?.personalUnlimitedBuild === true;
const PERSONAL_PLUS_STATUS: PlusStatus = { status: "active", active: true, productId: PLUS_PRODUCT_ID };

export type TodoInput = { title: string; memo?: string; priority: Priority; dueDate?: string; isRequired: boolean; requiredWindowMode?: RequiredWindowMode; requiredScheduleIds?: string[]; subtasks?: TodoSubtask[] };
export type HabitInput = { title: string; color: string; goalPerWeek: number; isRequired: boolean; requiredWindowMode?: RequiredWindowMode; requiredScheduleIds?: string[]; progressUnit?: ProgressUnit; targetValue?: number };
export type MutationResult = { ok: boolean; reason?: "FREE_LIMIT_REACHED" | "TIME_NOT_READY" | "TIMER_STARTED" | "TIMER_NOT_STARTED" | "TIMER_ALREADY_RUNNING" | "NOT_TIME_MANAGED" | "STORE_UNAVAILABLE" };
export type EarlyCompletionTarget = { kind: "todo" | "habit"; id: string; date?: string };

type FocusFlowContextValue = FocusFlowData & {
  isReady: boolean;
  addTodo: (input: TodoInput) => MutationResult;
  updateTodo: (id: string, input: TodoInput) => MutationResult;
  toggleTodo: (id: string) => MutationResult;
  adjustTodoProgress: (id: string, delta: number) => MutationResult;
  toggleSubtask: (todoId: string, subtaskId: string) => MutationResult;
  deleteTodo: (id: string) => void;
  addHabit: (input: HabitInput) => MutationResult;
  updateHabit: (id: string, input: HabitInput) => MutationResult;
  toggleHabit: (id: string, date?: string) => MutationResult;
  startHabitTimer: (id: string, date?: string) => MutationResult;
  pauseHabitTimer: (id: string, date?: string) => MutationResult;
  adjustHabitProgress: (id: string, delta: number, date?: string) => MutationResult;
  deleteHabit: (id: string) => void;
  addMemo: (input: { title?: string; body: string }) => MutationResult;
  updateMemo: (id: string, input: { title?: string; body: string }) => MutationResult;
  deleteMemo: (id: string) => void;
  addFocusSession: (durationMinutes: number) => void;
  setGateConfig: (input: Partial<GateConfig>) => void;
  canSelectBlockedApp: (packageName: string) => boolean;
  setDisplaySettings: (input: Partial<DisplaySettings>) => void;
  clearAllData: () => void;
  plusStatus: PlusStatus;
  earlyCompletionStatus: EarlyCompletionStatus;
  earlyCompletionPrice?: string;
  refreshPlusStatus: () => Promise<void>;
  purchasePlus: () => Promise<void>;
  restorePlus: () => Promise<void>;
  managePlus: () => Promise<void>;
  purchaseEarlyCompletion: (target: EarlyCompletionTarget) => Promise<MutationResult>;
};

const FocusFlowContext = createContext<FocusFlowContextValue | null>(null);

function normalizedRequiredWindow(isRequired: boolean, mode: unknown, scheduleIds: unknown, availableIds?: Set<string>) {
  const ids = Array.isArray(scheduleIds) ? Array.from(new Set(scheduleIds.filter((value): value is string => typeof value === "string" && Boolean(value)).filter((id) => !availableIds || availableIds.has(id)))) : [];
  if (!isRequired) return { requiredWindowMode: undefined, requiredScheduleIds: [] };
  return mode === "scheduled" && ids.length ? { requiredWindowMode: "scheduled" as const, requiredScheduleIds: ids } : { requiredWindowMode: "always" as const, requiredScheduleIds: [] };
}

function normalizedTodo(todo: Todo, legacyIds: Set<string>, availableScheduleIds?: Set<string>): Todo {
  const isRequired = Boolean(todo.isRequired || legacyIds.has(todo.id));
  return { ...todo, isRequired, ...normalizedRequiredWindow(isRequired, todo.requiredWindowMode, todo.requiredScheduleIds, availableScheduleIds), progressUnit: "check", targetValue: 1, progressValue: todo.completed ? 1 : 0, repeatRule: "none", subtasks: getTodoSubtasks(todo).map((subtask) => ({ id: subtask.id, title: subtask.title.trim(), completed: Boolean(subtask.completed) })).filter((subtask) => subtask.title), memo: typeof todo.memo === "string" ? todo.memo : undefined, timerStartedAt: undefined, earlyCompletionAt: undefined };
}

function normalizedHabit(habit: Habit, legacyIds: Set<string>, availableScheduleIds?: Set<string>): Habit {
  const isRequired = Boolean(habit.isRequired || legacyIds.has(habit.id));
  return { ...habit, isRequired, ...normalizedRequiredWindow(isRequired, habit.requiredWindowMode, habit.requiredScheduleIds, availableScheduleIds), progressUnit: habit.progressUnit ?? "check", targetValue: Math.max(Number(habit.targetValue) || 1, 1), dailyProgress: habit.dailyProgress && typeof habit.dailyProgress === "object" ? habit.dailyProgress : {}, timerStartedAtByDate: habit.timerStartedAtByDate && typeof habit.timerStartedAtByDate === "object" ? habit.timerStartedAtByDate : {}, timerElapsedSecondsByDate: habit.timerElapsedSecondsByDate && typeof habit.timerElapsedSecondsByDate === "object" ? habit.timerElapsedSecondsByDate : {}, earlyCompletionDates: Array.isArray(habit.earlyCompletionDates) ? habit.earlyCompletionDates : [] };
}

function normalizedWidgetOpacity(value: unknown, legacy: unknown): number {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return Math.max(0, Math.min(100, Math.round(numeric)));
  return legacy === "clear" ? 68 : legacy === "solid" ? 100 : 86;
}

function normalizeData(value: unknown): FocusFlowData {
  if (!value || typeof value !== "object") return EMPTY_FOCUS_FLOW_DATA;
  const candidate = value as Partial<FocusFlowData>;
  const gateConfig = { ...DEFAULT_GATE_CONFIG, ...(candidate.gateConfig ?? {}) };
  const legacyTodoIds = new Set([...(gateConfig.requiredTodoIds ?? []), ...gateConfig.schedules.flatMap((schedule) => schedule.requiredTodoIds ?? [])]);
  const legacyHabitIds = new Set([...(gateConfig.requiredHabitIds ?? []), ...gateConfig.schedules.flatMap((schedule) => schedule.requiredHabitIds ?? [])]);
  const savedDisplaySettings: Partial<DisplaySettings> = candidate.displaySettings ?? {};
  const schedules = gateConfig.schedules.map((schedule) => ({ ...schedule, requiredTodoIds: [], requiredHabitIds: [] }));
  const availableScheduleIds = new Set(schedules.map((schedule) => schedule.id));
  const legacyWidgetOpacity = normalizedWidgetOpacity(savedDisplaySettings.widgetOpacity, savedDisplaySettings.widgetTransparency);
  const widgetBackgroundOpacity = typeof savedDisplaySettings.widgetBackgroundOpacity === "number" ? normalizedWidgetOpacity(savedDisplaySettings.widgetBackgroundOpacity, savedDisplaySettings.widgetTransparency) : legacyWidgetOpacity;
  const widgetCardOpacity = typeof savedDisplaySettings.widgetCardOpacity === "number" ? normalizedWidgetOpacity(savedDisplaySettings.widgetCardOpacity, "solid") : 100;
  return { todos: Array.isArray(candidate.todos) ? candidate.todos.map((todo) => normalizedTodo(todo, legacyTodoIds, availableScheduleIds)) : [], habits: Array.isArray(candidate.habits) ? candidate.habits.map((habit) => normalizedHabit(habit, legacyHabitIds, availableScheduleIds)) : [], memos: Array.isArray(candidate.memos) ? candidate.memos : [], focusSessions: Array.isArray(candidate.focusSessions) ? candidate.focusSessions : [], gateConfig: { ...gateConfig, requiredTodoIds: [], requiredHabitIds: [], schedules }, displaySettings: { ...DEFAULT_DISPLAY_SETTINGS, ...savedDisplaySettings, appTheme: savedDisplaySettings.appTheme ?? savedDisplaySettings.theme ?? "mist", widgetOpacity: legacyWidgetOpacity, widgetBackgroundOpacity, widgetCardOpacity } };
}

function progressComplete(todo: Todo) { return Boolean(todo.completed); }

function resetRecurringTodo(todo: Todo): Todo {
  return { ...todo, completed: false, completedAt: undefined, dueDate: nextRecurringDueDate(todo.dueDate, todo.repeatRule), progressValue: 0, timerStartedAt: undefined, earlyCompletionAt: undefined, subtasks: getTodoSubtasks(todo).map((subtask) => ({ ...subtask, completed: false })) };
}

function maybeAdvanceRecurring(todo: Todo) { return todo.repeatRule && todo.repeatRule !== "none" && isTodoAchieved(todo) ? resetRecurringTodo(todo) : todo; }


export function FocusFlowProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FocusFlowData>(EMPTY_FOCUS_FLOW_DATA);
  const [isReady, setIsReady] = useState(false);
  const [plusStatus, setPlusStatus] = useState<PlusStatus>(PERSONAL_UNLIMITED_BUILD ? PERSONAL_PLUS_STATUS : { status: "unavailable", active: false });
  const [earlyCompletionStatus, setEarlyCompletionStatus] = useState<EarlyCompletionStatus>({ status: "unavailable", productId: EARLY_COMPLETION_PRODUCT_ID });
  const pendingEarlyCompletion = useRef<EarlyCompletionTarget | undefined>(undefined);
  const persistQueue = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(STORAGE_KEY)
      .then((serialized) => {
        if (!active || !serialized) return;
        try {
          setData(normalizeData(JSON.parse(serialized)));
        } catch {
          // 読込失敗時に空データを保存して既存の端末データを失わない。
        }
      })
      .catch(() => {
        // 一時的なストレージ障害では現在のメモリ状態を維持する。
      })
      .finally(() => { if (active) setIsReady(true); });
    return () => { active = false; };
  }, []);

  const persistData = useCallback((next: FocusFlowData) => {
    persistQueue.current = persistQueue.current
      .catch(() => undefined)
      .then(() => new Promise<void>((resolve) => { InteractionManager.runAfterInteractions(() => { void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).finally(resolve); }); }))
      .catch(() => undefined);
  }, []);
  const commit = useCallback((updater: (current: FocusFlowData) => FocusFlowData) => {
    setData((current) => {
      const next = updater(current);
      if (next !== current) persistData(next);
      return next;
    });
  }, [persistData]);
  const applyPlusStatus = useCallback((status: PlusStatus) => { setPlusStatus(status); commit((current) => current.displaySettings.plusEntitlement === status.active ? current : { ...current, displaySettings: { ...current.displaySettings, plusEntitlement: status.active } }); }, [commit]);

  const completeEarlyCompletion = useCallback(async (purchase: unknown, target: EarlyCompletionTarget) => {
    try {
      await finishPlatformPurchase(purchase, true);
      const now = new Date().toISOString(); const date = target.date ?? dayKey();
      commit((current) => {
        if (target.kind === "todo") return { ...current, todos: current.todos.map((todo) => todo.id === target.id && isTimedTodo(todo) && !isTodoTimeReady(todo) ? { ...todo, earlyCompletionAt: now, completed: true, completedAt: now, progressValue: todo.targetValue } : todo) };
        return { ...current, habits: current.habits.map((habit) => habit.id === target.id && (habit.progressUnit ?? "check") === "minutes" && !isHabitTimeReady(habit, date) ? { ...habit, earlyCompletionDates: Array.from(new Set([...(habit.earlyCompletionDates ?? []), date])).sort(), completedDates: Array.from(new Set([...habit.completedDates, date])).sort(), dailyProgress: { ...(habit.dailyProgress ?? {}), [date]: habit.targetValue ?? 1 } } : habit) };
      });
      setEarlyCompletionStatus({ status: "inactive", productId: EARLY_COMPLETION_PRODUCT_ID });
    } catch { setEarlyCompletionStatus({ status: "error", productId: EARLY_COMPLETION_PRODUCT_ID, reason: "TRANSACTION_FINISH_FAILED" }); }
  }, [commit]);

  const completePurchase = useCallback(async (purchase: unknown) => {
    const productId = (purchase as { productId?: string }).productId;
    if (productId === EARLY_COMPLETION_PRODUCT_ID && pendingEarlyCompletion.current) { const target = pendingEarlyCompletion.current; pendingEarlyCompletion.current = undefined; await completeEarlyCompletion(purchase, target); return; }
    if (productId !== PLUS_PRODUCT_ID) return;
    try { await finishPlatformPurchase(purchase); applyPlusStatus({ status: "active", active: true, productId: PLUS_PRODUCT_ID }); } catch { applyPlusStatus({ status: "error", active: false, productId: PLUS_PRODUCT_ID, reason: "TRANSACTION_FINISH_FAILED" }); }
  }, [applyPlusStatus, completeEarlyCompletion]);

  const iap = usePlatformIAP({ onPurchaseSuccess: (purchase) => { void completePurchase(purchase); }, onPurchaseError: () => { if (pendingEarlyCompletion.current) { pendingEarlyCompletion.current = undefined; setEarlyCompletionStatus({ status: "error", productId: EARLY_COMPLETION_PRODUCT_ID, reason: "PURCHASE_FAILED" }); } else applyPlusStatus({ status: "error", active: false, productId: PLUS_PRODUCT_ID, reason: "PURCHASE_FAILED" }); }, onError: () => { if (pendingEarlyCompletion.current) setEarlyCompletionStatus({ status: "error", productId: EARLY_COMPLETION_PRODUCT_ID, reason: "STORE_UNAVAILABLE" }); else applyPlusStatus({ status: "error", active: false, productId: PLUS_PRODUCT_ID, reason: "STORE_UNAVAILABLE" }); } });
  const { activeSubscriptions, connected, fetchProducts, getActiveSubscriptions, reconnect, requestPurchase, restorePurchases, subscriptions, products } = iap;
  const plusProduct = useMemo(() => subscriptions.find((product) => product.id === PLUS_PRODUCT_ID) as IapSubscription | undefined, [subscriptions]);
  const earlyCompletionProduct = useMemo(() => products.find((product) => product.id === EARLY_COMPLETION_PRODUCT_ID) as IapProduct | undefined, [products]);
  const isPlus = PERSONAL_UNLIMITED_BUILD || Boolean(data.displaySettings.plusEntitlement && plusStatus.active);

  const addTodo = useCallback((input: TodoInput): MutationResult => {
    const title = input.title.trim(); if (!title) return { ok: false };
    if (isFreeItemLimitReached(countUncompletedTodos(data.todos), isPlus)) return { ok: false, reason: "FREE_LIMIT_REACHED" };
    const todo: Todo = { id: createId("todo"), title, memo: input.memo?.trim() || undefined, priority: input.priority, dueDate: input.dueDate, isRequired: input.isRequired, ...normalizedRequiredWindow(input.isRequired, input.requiredWindowMode, input.requiredScheduleIds, new Set(data.gateConfig.schedules.map((schedule) => schedule.id))), completed: false, progressUnit: "check", targetValue: 1, progressValue: 0, repeatRule: "none", subtasks: input.subtasks ?? [], createdAt: new Date().toISOString() };
    commit((current) => ({ ...current, todos: [todo, ...current.todos] })); return { ok: true };
  }, [commit, data.todos, isPlus]);

  const updateTodo = useCallback((id: string, input: TodoInput): MutationResult => { const title = input.title.trim(); if (!title) return { ok: false }; commit((current) => ({ ...current, todos: current.todos.map((todo) => todo.id !== id ? todo : { ...todo, title, memo: input.memo?.trim() || undefined, priority: input.priority, dueDate: input.dueDate, isRequired: input.isRequired, ...normalizedRequiredWindow(input.isRequired, input.requiredWindowMode, input.requiredScheduleIds, new Set(current.gateConfig.schedules.map((schedule) => schedule.id))), progressUnit: "check", targetValue: 1, progressValue: todo.completed ? 1 : 0, repeatRule: "none", subtasks: input.subtasks ?? getTodoSubtasks(todo), timerStartedAt: undefined, earlyCompletionAt: undefined }) })); return { ok: true }; }, [commit]);

  const toggleTodo = useCallback((id: string): MutationResult => { let result: MutationResult = { ok: false }; commit((current) => ({ ...current, todos: current.todos.map((todo) => { if (todo.id !== id) return todo; const completed = !todo.completed; result = { ok: true }; return { ...todo, completed, completedAt: completed ? new Date().toISOString() : undefined, progressUnit: "check", targetValue: 1, progressValue: completed ? 1 : 0, repeatRule: "none", subtasks: getTodoSubtasks(todo), timerStartedAt: undefined, earlyCompletionAt: undefined }; }) })); return result; }, [commit]);

  const adjustTodoProgress = useCallback((_id: string, _delta: number): MutationResult => ({ ok: false }), []);

  const toggleSubtask = useCallback((todoId: string, subtaskId: string): MutationResult => { let result: MutationResult = { ok: false }; commit((current) => ({ ...current, todos: current.todos.map((todo) => { if (todo.id !== todoId) return todo; const subtasks = getTodoSubtasks(todo).map((subtask) => subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask); result = { ok: true }; return { ...todo, subtasks }; }) })); return result; }, [commit]);
  const deleteTodo = useCallback((id: string) => commit((current) => ({ ...current, todos: current.todos.filter((todo) => todo.id !== id) })), [commit]);

  const addHabit = useCallback((input: HabitInput): MutationResult => { const title = input.title.trim(); if (!title) return { ok: false }; if (isFreeItemLimitReached(data.habits.length, isPlus)) return { ok: false, reason: "FREE_LIMIT_REACHED" }; const habit: Habit = { id: createId("habit"), title, color: input.color, goalPerWeek: Math.min(Math.max(input.goalPerWeek, 1), 7), isRequired: input.isRequired, ...normalizedRequiredWindow(input.isRequired, input.requiredWindowMode, input.requiredScheduleIds, new Set(data.gateConfig.schedules.map((schedule) => schedule.id))), completedDates: [], progressUnit: input.progressUnit ?? "check", targetValue: Math.max(input.targetValue ?? 1, 1), dailyProgress: {}, timerStartedAtByDate: {}, timerElapsedSecondsByDate: {}, earlyCompletionDates: [], createdAt: new Date().toISOString() }; commit((current) => ({ ...current, habits: [habit, ...current.habits] })); return { ok: true }; }, [commit, data.gateConfig.schedules, data.habits.length, isPlus]);
  const updateHabit = useCallback((id: string, input: HabitInput): MutationResult => { const title = input.title.trim(); if (!title) return { ok: false }; commit((current) => ({ ...current, habits: current.habits.map((habit) => habit.id === id ? { ...habit, title, color: input.color, goalPerWeek: Math.min(Math.max(input.goalPerWeek, 1), 7), isRequired: input.isRequired, ...normalizedRequiredWindow(input.isRequired, input.requiredWindowMode, input.requiredScheduleIds, new Set(current.gateConfig.schedules.map((schedule) => schedule.id))), progressUnit: input.progressUnit ?? "check", targetValue: Math.max(input.targetValue ?? 1, 1), timerStartedAtByDate: input.progressUnit === "minutes" ? habit.timerStartedAtByDate : {}, timerElapsedSecondsByDate: input.progressUnit === "minutes" ? habit.timerElapsedSecondsByDate : {}, earlyCompletionDates: input.progressUnit === "minutes" ? habit.earlyCompletionDates : [] } : habit) })); return { ok: true }; }, [commit]);
  const toggleHabit = useCallback((id: string, date = dayKey()): MutationResult => { let result: MutationResult = { ok: false }; commit((current) => ({ ...current, habits: current.habits.map((habit) => { if (habit.id !== id) return habit; if ((habit.progressUnit ?? "check") === "minutes") { if (habit.completedDates.includes(date)) { result = { ok: true }; return { ...habit, completedDates: habit.completedDates.filter((item) => item !== date), dailyProgress: { ...(habit.dailyProgress ?? {}), [date]: 0 }, timerStartedAtByDate: Object.fromEntries(Object.entries(habit.timerStartedAtByDate ?? {}).filter(([key]) => key !== date)), timerElapsedSecondsByDate: Object.fromEntries(Object.entries(habit.timerElapsedSecondsByDate ?? {}).filter(([key]) => key !== date)), earlyCompletionDates: (habit.earlyCompletionDates ?? []).filter((item) => item !== date) }; } result = { ok: true }; return { ...habit, completedDates: Array.from(new Set([...habit.completedDates, date])).sort(), dailyProgress: { ...(habit.dailyProgress ?? {}), [date]: habit.dailyProgress?.[date] ?? 0 } }; } const completedDates = habit.completedDates.includes(date) ? habit.completedDates.filter((item) => item !== date) : [...habit.completedDates, date].sort(); result = { ok: true }; return { ...habit, completedDates, dailyProgress: { ...(habit.dailyProgress ?? {}), [date]: completedDates.includes(date) ? habit.targetValue ?? 1 : 0 } }; }) })); return result; }, [commit]);
  const startHabitTimer = useCallback((id: string, date = dayKey()): MutationResult => { let result: MutationResult = { ok: false }; commit((current) => ({ ...current, habits: current.habits.map((habit) => { if (habit.id !== id) return habit; if ((habit.progressUnit ?? "check") !== "minutes") { result = { ok: false, reason: "NOT_TIME_MANAGED" }; return habit; } if (isHabitCompleteOn(habit, date)) { result = { ok: false, reason: "TIME_NOT_READY" }; return habit; } if (habit.timerStartedAtByDate?.[date]) { result = { ok: false, reason: "TIMER_ALREADY_RUNNING" }; return habit; } result = { ok: true }; return { ...habit, timerStartedAtByDate: { ...(habit.timerStartedAtByDate ?? {}), [date]: new Date().toISOString() } }; }) })); return result; }, [commit]);
  const pauseHabitTimer = useCallback((id: string, date = dayKey()): MutationResult => { let result: MutationResult = { ok: false }; commit((current) => ({ ...current, habits: current.habits.map((habit) => { if (habit.id !== id) return habit; if ((habit.progressUnit ?? "check") !== "minutes" || !habit.timerStartedAtByDate?.[date]) { result = { ok: false, reason: "TIMER_NOT_STARTED" }; return habit; } const elapsedSeconds = getHabitTimerProgress(habit, date, new Date()).elapsedSeconds; result = { ok: true }; return { ...habit, timerStartedAtByDate: Object.fromEntries(Object.entries(habit.timerStartedAtByDate ?? {}).filter(([key]) => key !== date)), timerElapsedSecondsByDate: { ...(habit.timerElapsedSecondsByDate ?? {}), [date]: elapsedSeconds } }; }) })); return result; }, [commit]);
  const adjustHabitProgress = useCallback((id: string, delta: number, date = dayKey()): MutationResult => { let result: MutationResult = { ok: false }; commit((current) => ({ ...current, habits: current.habits.map((habit) => { if (habit.id !== id || habit.progressUnit === "check") return habit; if (habit.progressUnit === "minutes") { result = { ok: false, reason: habit.timerStartedAtByDate?.[date] ? "TIME_NOT_READY" : "TIMER_NOT_STARTED" }; return habit; } const target = habit.targetValue ?? 1; const value = Math.min(Math.max((habit.dailyProgress?.[date] ?? 0) + delta, 0), target); const completedDates = value >= target ? Array.from(new Set([...habit.completedDates, date])).sort() : habit.completedDates.filter((item) => item !== date); result = { ok: true }; return { ...habit, dailyProgress: { ...(habit.dailyProgress ?? {}), [date]: value }, completedDates }; }) })); return result; }, [commit]);
  const deleteHabit = useCallback((id: string) => commit((current) => ({ ...current, habits: current.habits.filter((habit) => habit.id !== id) })), [commit]);

  const addMemo = useCallback(({ title, body }: { title?: string; body: string }): MutationResult => { const trimmedBody = body.trim(); const trimmedTitle = title?.trim() ?? ""; if (!trimmedTitle && !trimmedBody) return { ok: false }; if (isFreeItemLimitReached(data.memos.length, isPlus)) return { ok: false, reason: "FREE_LIMIT_REACHED" }; const now = new Date().toISOString(); const memo: Memo = { id: createId("memo"), title: trimmedTitle || trimmedBody.split("\n")[0].slice(0, 38), body: trimmedBody, createdAt: now, updatedAt: now }; commit((current) => ({ ...current, memos: [memo, ...current.memos] })); return { ok: true }; }, [commit, data.memos.length, isPlus]);
  const updateMemo = useCallback((id: string, { title, body }: { title?: string; body: string }): MutationResult => { const trimmedBody = body.trim(); const trimmedTitle = title?.trim() ?? ""; if (!trimmedTitle && !trimmedBody) return { ok: false }; commit((current) => ({ ...current, memos: current.memos.map((memo) => memo.id === id ? { ...memo, title: trimmedTitle || trimmedBody.split("\n")[0].slice(0, 38), body: trimmedBody, updatedAt: new Date().toISOString() } : memo) })); return { ok: true }; }, [commit]);
  const deleteMemo = useCallback((id: string) => commit((current) => ({ ...current, memos: current.memos.filter((memo) => memo.id !== id) })), [commit]);
  const addFocusSession = useCallback((durationMinutes: number) => { if (durationMinutes <= 0) return; commit((current) => ({ ...current, focusSessions: [{ id: createId("focus"), startedAt: new Date().toISOString(), durationMinutes, completed: true }, ...current.focusSessions] })); }, [commit]);

  const setGateConfig = useCallback((input: Partial<GateConfig>) => commit((current) => {
    const protectedByStrictMode = current.gateConfig.strictMode && current.gateConfig.enabled && getGateSummary(current).pendingCount > 0;
    const candidate = { ...current.gateConfig, ...input, enabled: protectedByStrictMode && input.enabled === false ? true : input.enabled ?? current.gateConfig.enabled };
    const gateConfig = capBlockedApps(candidate, PERSONAL_UNLIMITED_BUILD || Boolean(current.displaySettings.plusEntitlement && plusStatus.active));
    const availableScheduleIds = new Set(gateConfig.schedules.map((schedule) => schedule.id));
    return { ...current, todos: current.todos.map((todo) => ({ ...todo, ...normalizedRequiredWindow(todo.isRequired, todo.requiredWindowMode, todo.requiredScheduleIds, availableScheduleIds) })), habits: current.habits.map((habit) => ({ ...habit, ...normalizedRequiredWindow(habit.isRequired, habit.requiredWindowMode, habit.requiredScheduleIds, availableScheduleIds) })), gateConfig };
  }), [commit, plusStatus.active]);
  const canSelectBlockedApp = useCallback((packageName: string) => canSelectBlockedAppForPlan(data.gateConfig, packageName, isPlus), [data.gateConfig, isPlus]);
  const setDisplaySettings = useCallback((input: Partial<DisplaySettings>) => commit((current) => ({ ...current, displaySettings: { ...current.displaySettings, ...input } })), [commit]);
  const clearAllData = useCallback(() => { setData({ todos: [], habits: [], memos: [], focusSessions: [], gateConfig: { ...DEFAULT_GATE_CONFIG, blockedPackages: [], requiredTodoIds: [], requiredHabitIds: [], schedules: [] }, displaySettings: { ...DEFAULT_DISPLAY_SETTINGS } }); void AsyncStorage.removeItem(STORAGE_KEY); void cancelDailyReminder(); }, []);

  const refreshPlusStatus = useCallback(async () => { if (PERSONAL_UNLIMITED_BUILD) { applyPlusStatus(PERSONAL_PLUS_STATUS); setEarlyCompletionStatus({ status: "unavailable", productId: EARLY_COMPLETION_PRODUCT_ID, reason: "STORE_PRODUCT_UNAVAILABLE" }); return; } if (Platform.OS === "web") { applyPlusStatus({ status: "unavailable", active: false, productId: PLUS_PRODUCT_ID, reason: "NATIVE_BUILD_REQUIRED" }); setEarlyCompletionStatus({ status: "unavailable", productId: EARLY_COMPLETION_PRODUCT_ID, reason: "NATIVE_BUILD_REQUIRED" }); return; } if (!connected) { applyPlusStatus({ status: "loading", active: false, productId: PLUS_PRODUCT_ID }); await reconnect(); return; } await Promise.all([fetchProducts({ skus: [PLUS_PRODUCT_ID], type: "subs" }), fetchProducts({ skus: [EARLY_COMPLETION_PRODUCT_ID], type: "in-app" }), getActiveSubscriptions([PLUS_PRODUCT_ID])]); }, [applyPlusStatus, connected, fetchProducts, getActiveSubscriptions, reconnect]);
  const purchasePlus = useCallback(async () => { if (PERSONAL_UNLIMITED_BUILD) { applyPlusStatus(PERSONAL_PLUS_STATUS); return; } if (Platform.OS === "web" || !connected || !plusProduct) { applyPlusStatus({ status: "unavailable", active: false, productId: PLUS_PRODUCT_ID, reason: "STORE_PRODUCT_UNAVAILABLE" }); return; } const offerToken = plusProduct.subscriptionOffers?.find((offer) => offer.offerTokenAndroid)?.offerTokenAndroid; if (Platform.OS === "android" && !offerToken) { applyPlusStatus({ status: "unavailable", active: false, productId: PLUS_PRODUCT_ID, reason: "ANDROID_OFFER_UNAVAILABLE" }); return; } setPlusStatus((current) => ({ ...current, status: "loading" })); await requestPurchase({ type: "subs", request: { apple: { sku: PLUS_PRODUCT_ID }, google: { skus: [PLUS_PRODUCT_ID], subscriptionOffers: offerToken ? [{ sku: PLUS_PRODUCT_ID, offerToken }] : [] } } }); }, [applyPlusStatus, connected, plusProduct, requestPurchase]);
  const restorePlus = useCallback(async () => { if (PERSONAL_UNLIMITED_BUILD) { applyPlusStatus(PERSONAL_PLUS_STATUS); return; } if (Platform.OS === "web" || !connected) { applyPlusStatus({ status: "unavailable", active: false, productId: PLUS_PRODUCT_ID, reason: "NATIVE_BUILD_REQUIRED" }); return; } setPlusStatus((current) => ({ ...current, status: "loading" })); await restorePurchases(); await getActiveSubscriptions([PLUS_PRODUCT_ID]); }, [applyPlusStatus, connected, getActiveSubscriptions, restorePurchases]);
  const managePlus = useCallback(async () => { if (Platform.OS !== "web") await openSubscriptionManagement(); }, []);
  const purchaseEarlyCompletion = useCallback(async (target: EarlyCompletionTarget): Promise<MutationResult> => { if (Platform.OS === "web" || !connected || !earlyCompletionProduct) { setEarlyCompletionStatus({ status: "unavailable", productId: EARLY_COMPLETION_PRODUCT_ID, price: earlyCompletionProduct?.displayPrice, reason: "STORE_PRODUCT_UNAVAILABLE" }); return { ok: false, reason: "STORE_UNAVAILABLE" }; } pendingEarlyCompletion.current = target; setEarlyCompletionStatus({ status: "pending", productId: EARLY_COMPLETION_PRODUCT_ID, price: earlyCompletionProduct.displayPrice }); await requestPurchase({ type: "in-app", request: { apple: { sku: EARLY_COMPLETION_PRODUCT_ID }, google: { skus: [EARLY_COMPLETION_PRODUCT_ID] } } }); return { ok: true }; }, [connected, earlyCompletionProduct, requestPurchase]);

  useEffect(() => { if (PERSONAL_UNLIMITED_BUILD || Platform.OS === "web" || !connected) return; void fetchProducts({ skus: [PLUS_PRODUCT_ID], type: "subs" }); void fetchProducts({ skus: [EARLY_COMPLETION_PRODUCT_ID], type: "in-app" }); void getActiveSubscriptions([PLUS_PRODUCT_ID]); }, [connected, fetchProducts, getActiveSubscriptions]);
  useEffect(() => { if (PERSONAL_UNLIMITED_BUILD) { applyPlusStatus(PERSONAL_PLUS_STATUS); setEarlyCompletionStatus({ status: "unavailable", productId: EARLY_COMPLETION_PRODUCT_ID, reason: "STORE_PRODUCT_UNAVAILABLE" }); return; } if (Platform.OS === "web" || !connected) return; const active = activeSubscriptions.some((subscription) => subscription.productId === PLUS_PRODUCT_ID && subscription.isActive); applyPlusStatus({ status: active ? "active" : "eligible", active, productId: PLUS_PRODUCT_ID, price: plusProduct?.displayPrice }); setEarlyCompletionStatus({ status: earlyCompletionProduct ? "inactive" : "unavailable", productId: EARLY_COMPLETION_PRODUCT_ID, price: earlyCompletionProduct?.displayPrice, reason: earlyCompletionProduct ? undefined : "STORE_PRODUCT_UNAVAILABLE" }); }, [activeSubscriptions, applyPlusStatus, connected, earlyCompletionProduct, plusProduct?.displayPrice]);

  const applyElapsedTimers = useCallback(() => { commit((current) => { const today = dayKey(); const now = new Date(); let changed = false; const habits = current.habits.map((habit) => { if ((habit.progressUnit ?? "check") !== "minutes" || isHabitCompleteOn(habit, today) || !isHabitTimeReady(habit, today, now)) return habit; changed = true; return { ...habit, completedDates: Array.from(new Set([...habit.completedDates, today])).sort(), dailyProgress: { ...(habit.dailyProgress ?? {}), [today]: habit.targetValue ?? 1 } }; }); return changed ? { ...current, habits } : current; }); }, [commit]);
  const hasRunningTimedHabit = useMemo(() => { const today = dayKey(); return data.habits.some((habit) => (habit.progressUnit ?? "check") === "minutes" && !isHabitCompleteOn(habit, today) && Boolean(habit.timerStartedAtByDate?.[today])); }, [data.habits]);
  useEffect(() => { if (!isReady) return; applyElapsedTimers(); if (!hasRunningTimedHabit) return; const timer = setInterval(applyElapsedTimers, 1_000); return () => clearInterval(timer); }, [applyElapsedTimers, hasRunningTimedHabit, isReady]);

  const applyWidgetActions = useCallback(async () => {
    const actions = await consumeWidgetActions();
    if (!actions.length) return;
    commit((current) => {
      const today = dayKey();
      const byTarget = actions.reduce((map, action) => {
        const key = `${action.kind}:${action.id}`;
        map.set(key, [...(map.get(key) ?? []), action]);
        return map;
      }, new Map<string, WidgetAction[]>());
      const todos: Todo[] = current.todos.map((todo): Todo => {
        const operation = byTarget.get(`todo:${todo.id}`)?.at(-1)?.operation;
        if (operation === "restore" && todo.completed) return { ...todo, completed: false, completedAt: undefined, progressUnit: "check", targetValue: 1, progressValue: 0, subtasks: getTodoSubtasks(todo), timerStartedAt: undefined, earlyCompletionAt: undefined };
        if (operation === "complete" && !todo.completed) return { ...todo, completed: true, completedAt: new Date().toISOString(), progressUnit: "check", targetValue: 1, progressValue: 1, subtasks: getTodoSubtasks(todo), timerStartedAt: undefined, earlyCompletionAt: undefined };
        return todo;
      });
      const habits = current.habits.map((habit) => {
          const actionsForHabit = byTarget.get(`habit:${habit.id}`);
          if (!actionsForHabit?.length) return habit;
          return actionsForHabit.reduce((currentHabit, action) => {
            const operation = action.operation;
          const unit = currentHabit.progressUnit ?? "check";
          const completed = currentHabit.completedDates.includes(today);
          if (operation === "restore" && completed) return { ...currentHabit, completedDates: currentHabit.completedDates.filter((item) => item !== today), dailyProgress: { ...(currentHabit.dailyProgress ?? {}), [today]: 0 }, timerStartedAtByDate: Object.fromEntries(Object.entries(currentHabit.timerStartedAtByDate ?? {}).filter(([date]) => date !== today)), timerElapsedSecondsByDate: Object.fromEntries(Object.entries(currentHabit.timerElapsedSecondsByDate ?? {}).filter(([date]) => date !== today)), earlyCompletionDates: (currentHabit.earlyCompletionDates ?? []).filter((date) => date !== today) };
          if (unit === "minutes") {
            if (operation === "timer_start" && !completed && !currentHabit.timerStartedAtByDate?.[today]) return { ...currentHabit, timerStartedAtByDate: { ...(currentHabit.timerStartedAtByDate ?? {}), [today]: action.startedAt && Number.isFinite(new Date(action.startedAt).getTime()) ? action.startedAt : new Date().toISOString() } };
            if (operation === "timer_pause" && !completed && currentHabit.timerStartedAtByDate?.[today]) {
              const elapsedSeconds = Number.isFinite(action.elapsedSeconds) ? Math.max(0, Math.floor(action.elapsedSeconds as number)) : getHabitTimerProgress(currentHabit, today, new Date()).elapsedSeconds;
              return { ...currentHabit, timerStartedAtByDate: Object.fromEntries(Object.entries(currentHabit.timerStartedAtByDate ?? {}).filter(([date]) => date !== today)), timerElapsedSecondsByDate: { ...(currentHabit.timerElapsedSecondsByDate ?? {}), [today]: elapsedSeconds } };
            }
            if (operation === "complete" && !completed) return { ...currentHabit, completedDates: Array.from(new Set([...currentHabit.completedDates, today])).sort(), dailyProgress: { ...(currentHabit.dailyProgress ?? {}), [today]: currentHabit.dailyProgress?.[today] ?? 0 } };
            return currentHabit;
          }
          if (unit === "count") {
            const delta = operation === "increment" ? 1 : operation === "decrement" ? -1 : 0;
            if (delta) {
              const target = currentHabit.targetValue ?? 1;
              const value = Math.min(Math.max((currentHabit.dailyProgress?.[today] ?? 0) + delta, 0), target);
              return { ...currentHabit, dailyProgress: { ...(currentHabit.dailyProgress ?? {}), [today]: value }, completedDates: value >= target ? Array.from(new Set([...currentHabit.completedDates, today])).sort() : currentHabit.completedDates.filter((date) => date !== today) };
            }
          }
          if (operation === "complete" && !completed) return { ...currentHabit, completedDates: Array.from(new Set([...currentHabit.completedDates, today])).sort(), dailyProgress: { ...(currentHabit.dailyProgress ?? {}), [today]: currentHabit.targetValue ?? 1 } };
          return currentHabit;
        }, habit);
      });
      return { ...current, todos, habits };
    });
  }, [commit]);
  useEffect(() => { if (!isReady) return; void applyWidgetActions(); void refreshPlusStatus(); const subscription = AppState.addEventListener("change", (state) => { if (state === "active") { void applyWidgetActions(); applyElapsedTimers(); void refreshPlusStatus(); } }); return () => subscription.remove(); }, [applyElapsedTimers, applyWidgetActions, isReady, refreshPlusStatus]);
  useEffect(() => { if (isReady) void syncAndroidGate(data); }, [data, isReady]);

  const value = useMemo(() => ({ ...data, isReady, addTodo, updateTodo, toggleTodo, adjustTodoProgress, toggleSubtask, deleteTodo, addHabit, updateHabit, toggleHabit, startHabitTimer, pauseHabitTimer, adjustHabitProgress, deleteHabit, addMemo, updateMemo, deleteMemo, addFocusSession, setGateConfig, canSelectBlockedApp, setDisplaySettings, clearAllData, plusStatus, earlyCompletionStatus, earlyCompletionPrice: earlyCompletionProduct?.displayPrice, refreshPlusStatus, purchasePlus, restorePlus, managePlus, purchaseEarlyCompletion }), [data, isReady, addTodo, updateTodo, toggleTodo, adjustTodoProgress, toggleSubtask, deleteTodo, addHabit, updateHabit, toggleHabit, startHabitTimer, pauseHabitTimer, adjustHabitProgress, deleteHabit, addMemo, updateMemo, deleteMemo, addFocusSession, setGateConfig, canSelectBlockedApp, setDisplaySettings, clearAllData, plusStatus, earlyCompletionStatus, earlyCompletionProduct?.displayPrice, refreshPlusStatus, purchasePlus, restorePlus, managePlus, purchaseEarlyCompletion]);
  return <FocusFlowContext.Provider value={value}>{children}</FocusFlowContext.Provider>;
}

export function useFocusFlow() { const context = useContext(FocusFlowContext); if (!context) throw new Error("useFocusFlow must be used within FocusFlowProvider"); return context; }

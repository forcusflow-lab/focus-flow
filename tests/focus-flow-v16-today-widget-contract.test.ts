import { describe, expect, it } from "vitest";

import type { Todo } from "../lib/focus-flow/types";
import { isTodoEffectiveRequired, isTodoRequiredForGate } from "../lib/focus-flow/utils";

const todo = (overrides: Partial<Todo>): Todo => ({ id: "todo-1", title: "確認", priority: "low", isRequired: false, completed: false, progressUnit: "check", targetValue: 1, progressValue: 0, repeatRule: "none", subtasks: [], createdAt: "2026-08-01T00:00:00.000Z", ...overrides });
const today = new Date(2026, 7, 27, 12, 0, 0);

describe("v16 Today／Widget対象契約（案2: 必須Todo判定）", () => {
  it("解除対象は重要度が必須かつ期限当日以前または期限なし当日作成のTodoに限定される", () => {
    // isRequired: false の通常Todoは、期限切れ・当日であっても有効必須やブロッカーにならない
    expect(isTodoEffectiveRequired(todo({ isRequired: false, dueDate: "2026-08-26" }), today)).toBe(false);
    expect(isTodoEffectiveRequired(todo({ isRequired: false, dueDate: "2026-08-27" }), today)).toBe(false);
    expect(isTodoEffectiveRequired(todo({ isRequired: false, dueDate: undefined }), today)).toBe(false);

    // isRequired: true のTodo
    expect(isTodoEffectiveRequired(todo({ isRequired: true, dueDate: "2026-08-26" }), today)).toBe(true);
    expect(isTodoEffectiveRequired(todo({ isRequired: true, dueDate: "2026-08-27" }), today)).toBe(true);
    expect(isTodoEffectiveRequired(todo({ isRequired: true, dueDate: "2026-08-28" }), today)).toBe(false);
    expect(isTodoEffectiveRequired(todo({ isRequired: true, dueDate: undefined, createdAt: "2026-08-27T01:00:00.000Z" }), today)).toBe(true);
    expect(isTodoEffectiveRequired(todo({ isRequired: true, dueDate: undefined, createdAt: "2026-08-26T01:00:00.000Z" }), today)).toBe(false);
  });

  it("期限超過でも通常Todoはゲート解除条件に入らず、必須Todoのみが条件に入る", () => {
    const normalOverdue = todo({ isRequired: false, dueDate: "2026-08-26" });
    expect(isTodoRequiredForGate(normalOverdue, true, today)).toBe(false);

    const requiredOverdue = todo({ isRequired: true, dueDate: "2026-08-26" });
    expect(isTodoRequiredForGate(requiredOverdue, true, today)).toBe(true);
    expect(isTodoRequiredForGate(requiredOverdue, true, today, { id: "routine", label: "朝", enabled: true, days: [4], startTime: "08:00", endTime: "09:00" })).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import type { Todo } from "../lib/focus-flow/types";
import { isTodoEffectiveRequired, isTodoRequiredForGate } from "../lib/focus-flow/utils";

const todo = (overrides: Partial<Todo>): Todo => ({ id: "todo-1", title: "確認", priority: "low", isRequired: false, completed: false, progressUnit: "check", targetValue: 1, progressValue: 0, repeatRule: "none", subtasks: [], createdAt: "2026-08-01T00:00:00.000Z", ...overrides });
const today = new Date(2026, 7, 27, 12, 0, 0);

describe("v16 Today／Widget対象契約", () => {
  it("期限当日以前の未完了Todoは手動必須でなくてもTodayとWidgetで有効必須になる", () => {
    expect(isTodoEffectiveRequired(todo({ dueDate: "2026-08-26" }), today)).toBe(true);
    expect(isTodoEffectiveRequired(todo({ dueDate: "2026-08-27" }), today)).toBe(true);
    expect(isTodoEffectiveRequired(todo({ dueDate: "2026-08-28" }), today)).toBe(false);
    expect(isTodoEffectiveRequired(todo({ dueDate: undefined }), today)).toBe(false);
    expect(isTodoEffectiveRequired(todo({ isRequired: true, dueDate: undefined }), today)).toBe(true);
  });

  it("期限超過Todoは自動必須が有効なとき常時の集中解除条件にも入る", () => {
    const overdue = todo({ dueDate: "2026-08-26" });
    expect(isTodoRequiredForGate(overdue, true, today)).toBe(true);
    expect(isTodoRequiredForGate(overdue, true, today, { id: "routine", label: "朝", enabled: true, days: [4], startTime: "08:00", endTime: "09:00" })).toBe(false);
  });
});

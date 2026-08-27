import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("Focus Flowホーム画面の情報階層", () => {
  it("必須または期限当日以前のTodoと必須Habitを、共通カードで重複なくTodayへ表示する", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app", "(tabs)", "index.tsx"), "utf8");

    expect(source).toContain("isTodoEffectiveRequired");
    expect(source).toContain("todayCompletedDisplay");
    expect(source).toContain("今日の対象");
    expect(source).toContain("必須と期限が今日以前の項目です");
    expect(source).toContain("<TodoItemCard");
    expect(source).toContain("<HabitItemCard");
    expect(source).not.toContain("regularTodos");
    expect(source).not.toContain("waitingTodos");
    expect(source).not.toContain("waitingHabits");
    expect(source).not.toContain("今取り組む1件");
    expect(source).toContain('onOpen={() => setOpenedTodo(item.todo)}');
    expect(source).toContain('onOpen={() => setOpenedHabit(item.habit)}');
    expect(source).toContain('<TaskForm visible={Boolean(openedTodo)}');
    expect(source).toContain('<HabitForm visible={Boolean(openedHabit)}');
    expect(source).not.toContain('params: { open: item.todo.id }');
    expect(source).not.toContain('params: { open: item.habit.id }');
    expect(source).toContain("completed-heading");
  });
});

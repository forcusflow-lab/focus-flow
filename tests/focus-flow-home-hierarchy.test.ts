import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("Focus Flowホーム画面の情報階層", () => {
  it("必須・通常のTodoと習慣を重複なく連続リストで表示する", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app", "(tabs)", "index.tsx"), "utf8");

    expect(source).toContain("必須項目");
    expect(source).toContain("今日のリスト");
    expect(source).toContain("requiredItemCard");
    expect(source).toContain("Pill label={english ? \"Must-do\" : \"必須\"}");
    expect(source).not.toContain("regularBadge");
    expect(source).toContain("requiredTodos");
    expect(source).toContain("regularTodos");
    expect(source).toContain("requiredHabits");
    expect(source).toContain("regularHabits");
    expect(source).not.toContain("今取り組む1件");
    expect(source).toContain('onOpen={() => setOpenedTodo(item.todo)}');
    expect(source).toContain('onOpen={() => setOpenedHabit(item.habit)}');
    expect(source).toContain('<TaskForm visible={Boolean(openedTodo)}');
    expect(source).toContain('<HabitForm visible={Boolean(openedHabit)}');
    expect(source).not.toContain('params: { open: item.todo.id }');
    expect(source).not.toContain('params: { open: item.habit.id }');
    expect(source).toContain("borderRadius: 6");
  });
});

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
describe("Focus Flowホーム画面の情報階層", () => { it("必須または期限当日以前のTodoと必須Habitを、共通カードで重複なくTodayへ表示する", () => { const source = fs.readFileSync(path.join(process.cwd(), "app", "(tabs)", "index.tsx"), "utf8"); ["isTodoEffectiveRequired", "今日の対象", "<TodoItemCard", "<HabitItemCard", 'onOpen={() => setOpenedTodo(item.todo)}', 'onOpen={() => setOpenedHabit(item.habit)}', '<TaskForm visible={Boolean(openedTodo)}', '<HabitForm visible={Boolean(openedHabit)}', "setShowCompleted((value) => !value)"].forEach((text) => expect(source).toContain(text)); expect(source).not.toContain("regularTodos"); expect(source).not.toContain("今取り組む1件"); }); });

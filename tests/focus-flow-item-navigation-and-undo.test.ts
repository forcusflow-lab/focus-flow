import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("Focus Flowの項目遷移と完了取り消し", () => {
  it("Todoと習慣はウィジェットのopenパラメータで対象フォームを開き、完了直後に取り消せる", () => {
    const todos = fs.readFileSync(path.join(process.cwd(), "app", "(tabs)", "todos.tsx"), "utf8");
    const habits = fs.readFileSync(path.join(process.cwd(), "app", "(tabs)", "habits.tsx"), "utf8");

    [todos, habits].forEach((source) => {
      expect(source).toContain("useLocalSearchParams");
      expect(source).toContain("params.open");
      expect(source).not.toContain("setUndo");
      expect(source).not.toContain("setTimeout");
      expect(source).toContain("router.replace(\"/(tabs)\" as never)");
    });
  });

  it("Todoと習慣のチェックは44dpの専用領域で処理し、詳細を開く操作と競合しない", () => {
    const cards = fs.readFileSync(path.join(process.cwd(), "components", "focus-flow", "item-cards.tsx"), "utf8");
    const today = fs.readFileSync(path.join(process.cwd(), "app", "(tabs)", "index.tsx"), "utf8");

    expect(cards).toContain("checkTouchTarget: { width: 44, height: 44");
    expect(cards).toContain("event.stopPropagation(); onToggle();");
    expect(cards).toContain("onPressIn={(event) => event.stopPropagation()}");
    expect(today).toContain("<TodoItemCard");
    expect(today).toContain("<HabitItemCard");
  });
});

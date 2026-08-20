import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("Focus Flowホーム画面の情報階層", () => {
  it("いま取り組む1件を残りのTodo・習慣一覧と明確に分離する", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app", "(tabs)", "index.tsx"), "utf8");

    expect(source).toContain("今取り組む1件");
    expect(source).toContain("残りの必須Todo");
    expect(source).toContain("残りの必須習慣");
    expect(source).toContain("remainingTodos");
    expect(source).toContain("remainingHabits");
    expect(source).toContain("todo.id !== nextTodo?.id");
    expect(source).toContain("habit.id !== nextHabit?.id");
  });
});

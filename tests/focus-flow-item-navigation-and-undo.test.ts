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
      expect(source).toContain("setUndo");
      expect(source).toContain("setTimeout");
      expect(source).toContain("router.replace(\"/\")");
    });
  });
});

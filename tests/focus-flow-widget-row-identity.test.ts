import { describe, expect, it } from "vitest";
import { uniqueWidgetItems, widgetRowActionKey } from "../lib/focus-flow/widget-items";

describe("Widget行同一性契約", () => {
  it("同じkind:idは1行に正規化し、別kindの同名IDは別項目として保持する", () => {
    const rows = uniqueWidgetItems([
      { id: "same", kind: "todo", title: "最初のTodo" },
      { id: "same", kind: "todo", title: "重複Todo" },
      { id: "same", kind: "habit", title: "同じIDの習慣" },
      { id: "next", kind: "todo", title: "次のTodo" },
    ]);

    expect(rows).toEqual([
      { id: "same", kind: "todo", title: "最初のTodo" },
      { id: "same", kind: "habit", title: "同じIDの習慣" },
      { id: "next", kind: "todo", title: "次のTodo" },
    ]);
  });

  it("行ごとの操作キーはWidget・行・操作・種類・IDを全て含み、上段と下段が衝突しない", () => {
    const upper = widgetRowActionKey({ widgetId: 42, row: 0, operation: "complete", kind: "todo", itemId: "task-a" });
    const lower = widgetRowActionKey({ widgetId: 42, row: 1, operation: "complete", kind: "todo", itemId: "task-a" });
    const restore = widgetRowActionKey({ widgetId: 42, row: 0, operation: "restore", kind: "todo", itemId: "task-a" });

    expect(upper).not.toBe(lower);
    expect(upper).not.toBe(restore);
    expect(upper).toContain("42:0:complete:todo:task-a");
  });
});

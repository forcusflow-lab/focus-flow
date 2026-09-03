import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Todo subtasks, memo carryover, and add actions", () => {
  it("persists Todo memo and subtasks through create, normalize, edit, and completion", () => {
    const types = read("lib", "focus-flow", "types.ts");
    const provider = read("lib", "focus-flow", "provider.tsx");
    const form = read("components", "focus-flow", "task-form.tsx");
    expect(types).toContain("memo?: string;");
    expect(types).toContain("subtasks?: TodoSubtask[];");
    expect(provider).toContain("memo: input.memo?.trim() || undefined");
    expect(provider).toContain("subtasks: input.subtasks ?? []");
    expect(provider).toContain("subtasks: input.subtasks ?? getTodoSubtasks(todo)");
    expect(provider).toContain("const toggleSubtask = useCallback((todoId: string, subtaskId: string)");
    expect(form).toContain("value={memo}");
    expect(form).toContain("setSubtasks");
    expect(form).toContain("createId(\"subtask\")");
  });

  it("carries a memo body when converting a note into a Todo", () => {
    const notes = read("app", "(tabs)", "notes.tsx");
    expect(notes).toContain("memo: memo.body.trim() || undefined");
    expect(notes).toContain('addTodo({ title: displayTitle(memo), memo:');
  });

  it("keeps screen add actions icon-only and theme-colored", () => {
    const ui = read("components", "focus-flow", "ui.tsx");
    const todos = read("app", "(tabs)", "todos.tsx");
    const notes = read("app", "(tabs)", "notes.tsx");
    expect(ui).toContain("styles.iconButton");
    expect(ui).toContain("variant === \"filled\" ? palette.primary");
    expect(todos).toContain('IconButton icon="add"');
    expect(notes).toContain('IconButton icon="add"');
  });

  it("サブタスクを持つTodoだけに区切り線・進捗・独立した展開操作を表示する", () => {
    const cards = read("components", "focus-flow", "item-cards.tsx");
    expect(cards).toContain("const [subtasksOpen, setSubtasksOpen] = useState(false)");
    expect(cards).toContain("styles.subtaskDivider");
    expect(cards).toContain("styles.subtaskSummary");
    expect(cards).toContain("styles.subtaskExpandButton");
    expect(cards).toContain("subtasksOpen && onToggleSubtask");
  });
});

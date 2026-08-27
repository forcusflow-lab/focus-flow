import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
const source = (...segments: string[]) => fs.readFileSync(path.join(path.resolve(__dirname, ".."), ...segments), "utf8");
describe("時間帯必須・起動・Today UX", () => {
  it("Todoと習慣は必須の実行時間帯を共通データモデルとして保存する", () => { const types = source("lib", "focus-flow", "types.ts"); const provider = source("lib", "focus-flow", "provider.tsx"); const utils = source("lib", "focus-flow", "utils.ts"); expect(types).toContain('export type RequiredWindowMode = "always" | "scheduled"'); expect(provider).toContain("normalizedRequiredWindow"); expect(utils).toContain("isItemRequiredDuringActiveGate"); });
  it("期限当日以前Todoはフォームで自動必須に選択され、TodayとWidgetへ同じ有効必須状態を渡す", () => { const form = source("components", "focus-flow", "task-form.tsx"); const today = source("app", "(tabs)", "index.tsx"); const gate = source("lib", "focus-flow", "android-gate.ts"); expect(form).toContain("dueAutoRequired"); expect(form).toContain("effectiveRequired"); expect(today).toContain("isTodoEffectiveRequired"); expect(gate).toContain("isTodoEffectiveRequired(todo)"); });
  it("Todayではチェックが画面遷移を起こさず、本文は直接編集シートを開く", () => { const today = source("app", "(tabs)", "index.tsx"); ["const [openedTodo, setOpenedTodo]", "const [openedHabit, setOpenedHabit]", 'onOpen={() => setOpenedTodo(item.todo)}', 'onOpen={() => setOpenedHabit(item.habit)}'].forEach((text) => expect(today).toContain(text)); expect(today).not.toContain('router.push({ pathname: "/(tabs)/todos"'); });
});

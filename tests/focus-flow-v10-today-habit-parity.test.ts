import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
const source = (...segments: string[]) => readFileSync(resolve(__dirname, "..", ...segments), "utf8");
describe("Today・習慣タブのカード仕様統一", () => { it("Todayの習慣カードは習慣タブと同じ共有カードに週次・進捗・必須・完了状態を持つ", () => { const today = source("app", "(tabs)", "index.tsx"); const habits = source("app", "(tabs)", "habits.tsx"); const cards = source("components", "focus-flow", "item-cards.tsx"); [today, habits].forEach((screen) => expect(screen).toContain("<HabitItemCard")); ["weeklyHabitProgress", "HabitProgressControl", 'Pill label={t("必須", "Must-do")}', "isHabitCompleteOn", "onProgress", "onStartTimer"].forEach((text) => expect(cards).toContain(text)); expect(today).toContain("adjustHabitProgress"); expect(habits).toContain("startHabitTimer"); }); });

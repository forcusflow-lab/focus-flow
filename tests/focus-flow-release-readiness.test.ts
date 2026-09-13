import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Release Readiness: Review Prompts, Data Export & Monetization UX", () => {
  describe("Review Prompt Logic & 1-Star Interception Guard", () => {
    it("has safe default review configuration in review-prompt.ts", () => {
      const reviewSrc = source("lib", "focus-flow", "review-prompt.ts");
      expect(reviewSrc).toContain("MIN_MILESTONES_BEFORE_PROMPT = 2");
      expect(reviewSrc).toContain("PROMPT_COOLDOWN_DAYS = 30");
      expect(reviewSrc).toContain('ANDROID_PACKAGE_NAME = "com.app.focusflow"');
      expect(reviewSrc).toContain('SUPPORT_EMAIL = "forcus.flow@gmail.com"');
      expect(reviewSrc).toContain("market://details?id=");
      expect(reviewSrc).toContain("https://play.google.com/store/apps/details?id=");
    });

    it("verifies review gating logic (milestone threshold, rated suppression, cooldown)", () => {
      const reviewSrc = source("lib", "focus-flow", "review-prompt.ts");
      // rated suppression
      expect(reviewSrc).toContain('if (state.status === "rated") return false');
      // milestone count threshold
      expect(reviewSrc).toContain("if (state.milestoneCount < MIN_MILESTONES_BEFORE_PROMPT) return false");
      // 30-day cooldown calculation
      expect(reviewSrc).toContain("diffDays < PROMPT_COOLDOWN_DAYS");
    });
  });

  describe("Data Backup & Export Serialization", () => {
    it("serializes all user data fields into a structured JSON backup", () => {
      const exportSrc = source("lib", "focus-flow", "export-data.ts");
      expect(exportSrc).toContain('app: "Focus Flow"');
      expect(exportSrc).toContain('version: "1.0.0"');
      expect(exportSrc).toContain("todoCount: data.todos.length");
      expect(exportSrc).toContain("habitCount: data.habits.length");
      expect(exportSrc).toContain("memoCount: data.memos.length");
      expect(exportSrc).toContain("scheduleCount: data.gateConfig.schedules.length");
      expect(exportSrc).toContain("Share.share");
    });
  });

  describe("Monetization & UX Protection Integration", () => {
    it("ReviewModal implements the 2-stage satisfaction filter", () => {
      const modalSrc = source("components", "focus-flow", "review-modal.tsx");
      expect(modalSrc).toContain("openStoreReview");
      expect(modalSrc).toContain("mailto:");
      expect(modalSrc).toContain("SUPPORT_EMAIL");
      expect(modalSrc).toContain('setStage("positive")');
      expect(modalSrc).toContain('setStage("feedback")');
    });

    it("PaywallModal displays trust badges: 7-day free trial, cancel anytime, 100% ad-free", () => {
      const paywallSrc = source("components", "focus-flow", "paywall-modal.tsx");
      expect(paywallSrc).toContain("7日間無料体験");
      expect(paywallSrc).toContain("いつでも解約OK");
      expect(paywallSrc).toContain("広告なし・安全");
    });

    it("Support screen provides direct mail app launch channel", () => {
      const supportSrc = source("app", "support.tsx");
      expect(supportSrc).toContain("mailto:forcus.flow@gmail.com");
      expect(supportSrc).toContain("メールアプリで送信");
    });

    it("Settings tab includes backup export, feedback mailer, and legal policy links", () => {
      const settingsSrc = source("app", "(tabs)", "settings.tsx");
      expect(settingsSrc).toContain("exportAndShareData");
      expect(settingsSrc).toContain("データのバックアップと共有");
      expect(settingsSrc).toContain("ご意見・不具合報告");
      expect(settingsSrc).toContain("利用規約");
      expect(settingsSrc).toContain("プライバシーポリシー");
    });

    it("Root layout mounts both PaywallModal and ReviewModal", () => {
      const layoutSrc = source("app", "_layout.tsx");
      expect(layoutSrc).toContain("<ReviewModal");
      expect(layoutSrc).toContain("<PaywallModal");
    });

    it("Free limits trigger openPaywall() while preserving settings navigation across tabs", () => {
      const todosSrc = source("app", "(tabs)", "todos.tsx");
      const habitsSrc = source("app", "(tabs)", "habits.tsx");
      const notesSrc = source("app", "(tabs)", "notes.tsx");

      expect(todosSrc).toContain("openPaywall()");
      expect(todosSrc).toContain('pathname: "/(tabs)/settings", params: { panel: "plus" }');
      expect(habitsSrc).toContain("openPaywall()");
      expect(habitsSrc).toContain('pathname: "/(tabs)/settings", params: { panel: "plus" }');
      expect(notesSrc).toContain("openPaywall()");
      expect(notesSrc).toContain('pathname: "/(tabs)/settings", params: { panel: "plus" }');
    });

    it("TodayScreen and TodosScreen wire milestone review triggers on task/habit completion", () => {
      const todaySrc = source("app", "(tabs)", "index.tsx");
      const todosSrc = source("app", "(tabs)", "todos.tsx");

      expect(todaySrc).toContain("triggerMilestoneReview");
      expect(todosSrc).toContain("triggerMilestoneReview");
    });
  });
});

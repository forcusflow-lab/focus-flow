import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { R, stringResource } from "../lib/focus-flow/strings";

const read = (...segments: string[]) => fs.readFileSync(path.join(process.cwd(), ...segments), "utf8");

describe("Focus Flow v27: 制限タイミングの概念統一・タイマートーン調和・TimePicker連携", () => {
  describe("1. タイマー操作ボタンのトーン調和とデザイン統一", () => {
    it("アプリ本体のタイマーボタンは通常時に淡いコンテナ色、実行時にPrimary反転色を適用する", () => {
      const source = read("components", "focus-flow", "habit-progress-control.tsx");
      expect(source).toContain("backgroundColor: palette.primary");
      expect(source).toContain("!timer.running && {");
      expect(source).toContain("backgroundColor: palette.elevated");
      expect(source).toContain("color: palette.primary");
      expect(source).toContain('color: "#FFFFFF"');
      expect(source).toContain("borderRadius: 999");
      expect(source).toContain("minHeight: 38");
      expect(source).toContain("height: 36");
    });

    it("ウィジェットのタイマーボタンは通常時に淡いコンテナ背景+Primary文字、実行時にPrimary反転を適用する", () => {
      const provider = read("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
      expect(provider).toContain("ids.timerBackground");
      expect(provider).toContain("colorWithOpacity(elevated, rowOpacity)");
      expect(provider).toContain("views.setTextColor(ids.timer, Color.WHITE)");
      expect(provider).toContain("views.setTextColor(ids.timer, primary)");
      expect(provider).toContain("focus_flow_widget_pill_container");
    });
  });

  describe("2. 入力フォームのタイミング概念統一とインライン時間帯作成", () => {
    it("RequiredWindowSelectorは「制限するタイミング」「終日」「指定の時間帯」「+ 新しい時間帯を作成」を提供する", () => {
      const selector = read("components", "focus-flow", "required-window-selector.tsx");
      expect(selector).toContain("制限するタイミング");
      expect(selector).toContain("終日");
      expect(selector).toContain("今日の達成までアプリを制限");
      expect(selector).toContain("指定の時間帯");
      expect(selector).toContain("設定した時間帯（朝・夜など）の間だけブロック");
      expect(selector).toContain("+ 新しい時間帯を作成");
      expect(selector).toContain("modalOpen");
      expect(selector).toContain("onCreateSchedule");
    });

    it("Todo作成フォームと習慣作成フォームがonCreateScheduleとRequiredWindowSelectorを接続している", () => {
      const taskForm = read("components", "focus-flow", "task-form.tsx");
      const habitForm = read("components", "focus-flow", "habit-form.tsx");
      expect(taskForm).toContain("onCreateSchedule");
      expect(taskForm).toContain("setGateConfig({ schedules: [...gateConfig.schedules, schedule] })");
      expect(habitForm).toContain("onCreateSchedule");
      expect(habitForm).toContain("setGateConfig({ schedules: [...gateConfig.schedules, schedule] })");
    });
  });

  describe("3. 画面横断・遮断オーバーレイ・ウィジェットの概念・文言統一", () => {
    it("今日の予定画面で時間帯制限中のバナーと指定時間帯の見出しを提供する", () => {
      const today = read("app", "(tabs)", "index.tsx");
      expect(today).toContain("activeScheduledRule");
      expect(today).toContain("today_banner_locked_window");
      expect(today).toContain("today_banner_unlocked");
      expect(today).toContain("today-open");
      expect(today).toContain("today-scheduled");
      expect(today).toContain("今日のタスク");
      expect(today).toContain("指定時間帯のタスク");
    });

    it("遮断オーバーレイ (FocusGateService & FocusGateActivity) が「集中タイムです」、対象時間帯表示、残り項目一覧を持つ", () => {
      const service = read("plugins", "native", "android", "kotlin", "FocusGateService.kt");
      const activity = read("plugins", "native", "android", "kotlin", "FocusGateActivity.kt");
      
      [service, activity].forEach((code) => {
        expect(code).toContain("集中タイムです");
        expect(code).toContain("Focus time");
        expect(code).toContain("今日のタスクを達成すると制限が解除されます");
        expect(code).toContain("Complete today's tasks to unlock.");
        expect(code).toContain("この時間帯（");
        expect(code).toContain("Complete the tasks for this time window");
        expect(code).toContain("remainingTasks");
      });
    });

    it("ウィジェットヘッダーは「残り %d 件」「制限中（%s〜%s）」「制限解除中」を表示し、バッジに必須/時間帯を表示する", () => {
      const provider = read("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
      expect(provider).toContain("制限解除中");
      expect(provider).toContain("Limits unlocked");
      expect(provider).toContain("制限中（$startTime〜$endTime）");
      expect(provider).toContain("Limited ($startTime–$endTime)");
      expect(provider).toContain("残り ${pending} 件");
      expect(provider).toContain("$pending remaining");
      expect(provider).toContain('if (english) "MUST" else "必須"');
    });
  });

  describe("4. 設定画面のTimePicker連携と15分刻みステッパー", () => {
    it("FocusGateModuleがAndroidネイティブTimePickerDialogを呼び出すopenTimePickerを実装している", () => {
      const module = read("plugins", "native", "android", "kotlin", "FocusGateModule.kt");
      expect(module).toContain("@ReactMethod fun openTimePicker");
      expect(module).toContain("android.app.TimePickerDialog");
      expect(module).toContain('putString("action", "set")');
    });

    it("android-gate.tsがopenTimePickerを公開している", () => {
      const bridge = read("lib", "focus-flow", "android-gate.ts");
      expect(bridge).toContain("export async function openTimePicker");
    });

    it("settings.tsxのTimeStepperが15分単位で増減し、タップでopenTimePickerを開く", () => {
      const settings = read("app", "(tabs)", "settings.tsx");
      expect(settings).toContain("stepTime(value, -15)");
      expect(settings).toContain("stepTime(value, 15)");
      expect(settings).toContain("openTimePicker");
      expect(settings).toContain("handlePressTime");
    });
  });

  describe("5. 文字列リソースの集約と整合性", () => {
    it("strings.xmlとstrings.tsにすべての新規リソースキーが日英で集約定義されている", () => {
      const stringsXml = read("plugins", "native", "android", "res", "values", "strings.xml");
      
      const xmlKeys = [
        "today_banner_locked_window",
        "today_scheduled_tasks_heading",
        "gate_overlay_header",
        "gate_overlay_status_all_day",
        "gate_overlay_status_window",
        "timing_section_title",
        "timing_all_day_title",
        "timing_all_day_detail",
        "timing_scheduled_title",
        "timing_scheduled_detail",
        "timing_add_window",
        "widget_badge_all_day",
        "widget_status_all_day",
        "widget_status_window",
        "widget_status_unlocked",
      ];
      xmlKeys.forEach((key) => {
        expect(stringsXml).toContain(`<string name="${key}">`);
      });

      // stringResource 展開テスト
      expect(stringResource(R.string.today_banner_locked_window, "ja", "09:00", "18:00")).toBe("時間帯制限中（09:00〜18:00）");
      expect(stringResource(R.string.today_banner_locked_window, "en", "09:00", "18:00")).toBe("Scheduled limit active (09:00–18:00)");
      expect(stringResource(R.string.today_scheduled_tasks_heading, "ja")).toBe("指定時間帯のタスク");
      expect(stringResource(R.string.today_scheduled_tasks_heading, "en")).toBe("Scheduled tasks");
      expect(stringResource(R.string.gate_overlay_header, "ja")).toBe("集中タイムです");
      expect(stringResource(R.string.gate_overlay_header, "en")).toBe("Focus time");
      expect(stringResource(R.string.timing_section_title, "ja")).toBe("制限するタイミング");
      expect(stringResource(R.string.timing_all_day_title, "ja")).toBe("終日");
      expect(stringResource(R.string.timing_scheduled_title, "ja")).toBe("指定の時間帯");
      expect(stringResource(R.string.widget_status_unlocked, "ja")).toBe("制限解除中");
    });
  });
});

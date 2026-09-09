import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { R, stringResource } from "../lib/focus-flow/strings";

const source = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Focus Flow v30 Pattern A Widget & 全画面UXライティング・概念統一", () => {
  const pluginLayout = source("plugins", "native", "android", "res", "layout", "focus_flow_widget_initial.xml");
  const nativeLayout = source("android", "app", "src", "main", "res", "layout", "focus_flow_widget_initial.xml");
  const pluginProvider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
  const nativeProvider = source("android", "app", "src", "main", "java", "com", "app", "focusflow", "focusflow", "FocusFlowWidgetProvider.kt");
  const todayScreen = source("app", "(tabs)", "index.tsx");
  const settingsScreen = source("app", "(tabs)", "settings.tsx");
  const timingSelector = source("components", "focus-flow", "required-window-selector.tsx");
  const taskForm = source("components", "focus-flow", "task-form.tsx");
  const habitForm = source("components", "focus-flow", "habit-form.tsx");
  const gateService = source("plugins", "native", "android", "kotlin", "FocusGateService.kt");
  const gateActivity = source("plugins", "native", "android", "kotlin", "FocusGateActivity.kt");
  const pluginStrings = source("plugins", "native", "android", "res", "values", "strings.xml");
  const nativeStrings = source("android", "app", "src", "main", "res", "values", "strings.xml");

  describe("1. ホーム画面ウィジェット: パターンA（右端固定バッジ & 2行目右側コントロール）", () => {
    it("全行でバッジが1行目右上(top|end)、コントロールが右側上下中央(center_vertical|end)に配置されている", () => {
      for (const layout of [pluginLayout, nativeLayout]) {
        for (const row of ["one", "two", "three", "four", "five"]) {
          // Row 1 right: Badge
          expect(layout).toContain(`focus_flow_widget_static_row_${row}_badge_container" android:layout_width="wrap_content" android:layout_height="18dp" android:layout_gravity="top|end"`);
          // Row right: Controls (centered vertically)
          expect(layout).toContain(`focus_flow_widget_static_row_${row}_controls" android:layout_width="82dp" android:layout_height="22dp" android:layout_gravity="center_vertical|end"`);
          // Content marginEnd reserved for right column
          expect(layout).toContain(`focus_flow_widget_static_row_${row}_content" android:layout_width="match_parent" android:layout_height="match_parent" android:layout_marginStart="50dp" android:layout_marginEnd="88dp"`);
          // Title uses full width without colliding with badge
          expect(layout).toContain(`focus_flow_widget_static_row_${row}_title" android:layout_width="match_parent"`);
        }
      }
    });

    it("タイマーボタンがピル型コンテナと中央揃え・均等パディングを適用している", () => {
      for (const layout of [pluginLayout, nativeLayout]) {
        for (const row of ["one", "two", "three", "four", "five"]) {
          expect(layout).toContain(`focus_flow_widget_static_row_${row}_timer" android:layout_width="match_parent" android:layout_height="match_parent" android:gravity="center" android:textAlignment="center" android:includeFontPadding="false" android:maxLines="1" android:textSize="10sp" android:textStyle="bold" android:paddingStart="4dp" android:paddingEnd="4dp"`);
        }
      }
    });

    it("Widgetヘッダーが「今日の目標」および「集中制限はオフです」を表示する", () => {
      for (const provider of [pluginProvider, nativeProvider]) {
        expect(provider).toContain('if (english) "TODAY\'S GOALS" else "今日の目標"');
        expect(provider).toContain('if (english) "App limits off" else "集中制限はオフです"');
        expect(provider).toContain('if (english) "Open Focus Flow to add today’s goals" else "今日の目標はありません"');
      }
    });
  });

  describe("2. 今日画面: ダッシュボードカード & UXライティング", () => {
    it("ダッシュボードの状態表示と見出しが統一文言を採用している", () => {
      expect(todayScreen).toContain("today_banner_off");
      expect(todayScreen).toContain("today_banner_locked_window");
      expect(todayScreen).toContain("today_banner_locked");
      expect(todayScreen).toContain("today_banner_unlocked");
      expect(todayScreen).toContain("today_progress_label");
      expect(todayScreen).toContain('title: t("今日のタスク", "Today’s tasks")');
    });

    it("stringResourceのtoday_banner_lockedが残り件数を展開する", () => {
      expect(stringResource(R.string.today_banner_locked, "ja", 3)).toBe("アプリ制限中（残り 3 件）");
      expect(stringResource(R.string.today_banner_locked, "en", 3)).toBe("App limits active (3 remaining)");
    });
  });

  describe("3. Todo / 習慣 作成画面: 制限するタイミング・終日・指定の時間帯", () => {
    it("共通のRequiredWindowSelectorが「制限するタイミング」「終日」「指定の時間帯」を提供する", () => {
      expect(timingSelector).toContain('t("制限するタイミング", "When to limit")');
      expect(timingSelector).toContain('t("終日", "All day")');
      expect(timingSelector).toContain('t("今日の達成までアプリを制限", "Limit apps until completed today")');
      expect(timingSelector).toContain('t("指定の時間帯", "Specific time window")');
      expect(timingSelector).toContain('t("設定した時間帯（朝・夜など）の間だけブロック", "Block only during selected time windows (morning, night, etc.)")');
      expect(timingSelector).toContain('t("+ 新しい時間帯を作成", "+ Create new time window")');
    });

    it("TodoFormとHabitFormの両方がRequiredWindowSelectorを接続している", () => {
      expect(taskForm).toContain("<RequiredWindowSelector");
      expect(habitForm).toContain("<RequiredWindowSelector");
    });
  });

  describe("4. 設定画面: 時間帯制限の設定 & TimePicker連携", () => {
    it("設定画面が「時間帯制限の設定」見出しとTimeStepper・openTimePicker連携を持つ", () => {
      expect(settingsScreen).toContain('title={t("3. 時間帯制限の設定", "3. Time window limit settings")}');
      expect(settingsScreen).toContain("openTimePicker");
      expect(settingsScreen).toContain("stepTime(value, -15)");
      expect(settingsScreen).toContain("stepTime(value, 15)");
    });
  });

  describe("5. 遮断オーバーレイ: 集中タイムです & 解除条件", () => {
    it("FocusGateServiceとFocusGateActivityが統一ヘッダーと解除条件メッセージを表示する", () => {
      for (const overlay of [gateService, gateActivity]) {
        expect(overlay).toContain('if (english) "Focus time" else "集中タイムです"');
        expect(overlay).toContain("今日のタスクを達成すると制限が解除されます");
        expect(overlay).toContain("の対象タスクを完了すると解除されます");
      }
    });
  });

  describe("6. リソース集約 (strings.xml & strings.ts)", () => {
    it("strings.xmlとstrings.tsにすべての統一文言が集約されている", () => {
      for (const xml of [pluginStrings, nativeStrings]) {
        expect(xml).toContain('<string name="widget_title">今日の目標</string>');
        expect(xml).toContain('<string name="widget_status_off">集中制限はオフです</string>');
        expect(xml).toContain('<string name="settings_schedule_section_title">時間帯制限の設定</string>');
        expect(xml).toContain('<string name="gate_overlay_header">集中タイムです</string>');
        expect(xml).toContain('<string name="timing_all_day_title">終日</string>');
        expect(xml).toContain('<string name="timing_scheduled_title">指定の時間帯</string>');
      }

      expect(stringResource(R.string.widget_title, "ja")).toBe("今日の目標");
      expect(stringResource(R.string.widget_status_off, "ja")).toBe("集中制限はオフです");
      expect(stringResource(R.string.settings_schedule_section_title, "ja")).toBe("時間帯制限の設定");
    });
  });
});

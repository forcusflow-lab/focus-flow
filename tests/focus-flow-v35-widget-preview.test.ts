import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Focus Flow v35 ウィジェット透過率ミニプレビュー", () => {
  it("WidgetMiniPreviewコンポーネントが壁紙風背景・ヘッダー・モック行を持つ", () => {
    const settings = source("app", "(tabs)", "settings.tsx");
    expect(settings).toContain("function WidgetMiniPreview");
    expect(settings).toContain("widgetPreviewWallpaper");
    expect(settings).toContain("widgetPreviewHeader");
    expect(settings).toContain("widgetPreviewRow");
    expect(settings).toContain("widgetPreviewGradA");
    expect(settings).toContain("widgetPreviewGradB");
    expect(settings).toContain("今日の目標");
    expect(settings).toContain("朝のストレッチ");
    expect(settings).toContain("読書");
  });

  it("OpacitySliderにonDragコールバックがあり、ドラッグ中にプレビューへ値を伝達する", () => {
    const settings = source("app", "(tabs)", "settings.tsx");
    expect(settings).toContain("onDrag?:");
    expect(settings).toContain("onDragRef.current?.(");
    expect(settings).toContain("onDrag={setDragBgOpacity}");
    expect(settings).toContain("onDrag={setDragCardOpacity}");
  });

  it("WidgetsPanelにローカルドラッグ状態があり、プレビューにリアルタイム値を渡す", () => {
    const settings = source("app", "(tabs)", "settings.tsx");
    expect(settings).toContain("dragBgOpacity");
    expect(settings).toContain("dragCardOpacity");
    expect(settings).toContain("previewBg");
    expect(settings).toContain("previewCard");
    expect(settings).toContain("backgroundOpacity={previewBg}");
    expect(settings).toContain("cardOpacity={previewCard}");
  });

  it("withAlphaとblendHexのヘルパー関数が透過表現に使われる", () => {
    const settings = source("app", "(tabs)", "settings.tsx");
    expect(settings).toContain("function withAlpha(hex: string, alpha: number): string");
    expect(settings).toContain("function blendHex(base: string, blend: string, ratio: number): string");
    expect(settings).toContain("rgba(");
  });

  it("冗長なヒントテキストが削除されている", () => {
    const settings = source("app", "(tabs)", "settings.tsx");
    expect(settings).not.toContain("タップ・スライドとも1%単位で反映されます");
    expect(settings).not.toContain("Tap or slide to apply in 1% steps");
  });

  it("永続化はフィンガーリフト時のみで、ドラッグ中はローカル更新のみ", () => {
    const settings = source("app", "(tabs)", "settings.tsx");
    expect(settings).toContain("onPanResponderRelease");
    expect(settings).toContain("onChange(finalVal)");
    expect(settings).toContain("setDragValue(undefined)");
  });
});

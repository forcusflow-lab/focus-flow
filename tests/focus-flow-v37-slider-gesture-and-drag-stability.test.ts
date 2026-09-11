import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Focus Flow v37 透過率スライダーState管理 & ドラッグ競合解消", () => {
  it("ドラッグ中フラグ (isDragging) のローカルStateとRefが定義されている", () => {
    const settings = source("app", "(tabs)", "settings.tsx");
    expect(settings).toContain("const [isDragging, setIsDragging] = useState(false);");
    expect(settings).toContain("const isDraggingRef = useRef(false);");
  });

  it("外部Stateとの同期ガード (if (!isDragging)) が適用され、ドラッグ中の上書き引き戻しを遮断する", () => {
    const settings = source("app", "(tabs)", "settings.tsx");
    expect(settings).toContain("if (!isDragging) {");
    expect(settings).toContain("setSliderValue(normalized);");
    expect(settings).toContain("setCommittedValue(undefined);");
  });

  it("PanResponderがonPanResponderTerminationRequestをfalseにし、スクロールによる中断を防止する", () => {
    const settings = source("app", "(tabs)", "settings.tsx");
    expect(settings).toContain("onPanResponderTerminationRequest: () => false,");
    expect(settings).toContain("}), [thumbRadius]);");
  });

  it("ドラッグ中 (onPanResponderMove) はローカルStateの更新のみを行い、保存処理 (onChange) を呼ばない", () => {
    const settings = source("app", "(tabs)", "settings.tsx");
    expect(settings).toContain("onPanResponderMove: (_event, gestureState) => {");
    expect(settings).toContain("isDraggingRef.current = true;");
    expect(settings).toContain("setSliderValue(next);");
    expect(settings).toContain("setDragValue(next);");
  });

  it("保存処理 (onChange) は指を離した時 (onPanResponderRelease) に限定されている", () => {
    const settings = source("app", "(tabs)", "settings.tsx");
    expect(settings).toContain("onPanResponderRelease: () => {");
    expect(settings).toContain("isDraggingRef.current = false;");
    expect(settings).toContain("setIsDragging(false);");
    expect(settings).toContain("onChange(finalVal)");
  });

  it("ミニプレビューおよび背景スタイル (幾何学模様 / 無地) が維持されている", () => {
    const settings = source("app", "(tabs)", "settings.tsx");
    expect(settings).toContain("WidgetMiniPreview");
    expect(settings).toContain("widgetPreviewGeometricBase");
    expect(settings).toContain('key: "geometric", label: t("幾何学模様", "Geometric")');
    expect(settings).toContain('key: "solid", label: t("無地", "Solid")');
  });
});

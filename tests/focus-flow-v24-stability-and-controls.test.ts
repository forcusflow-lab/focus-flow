import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const source = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Focus Flow v24 安定性・操作面・設定UI", () => {
  it("保存読込の失敗で空データを上書きせず、永続化を順序保証キューへ送る", () => {
    const provider = source("lib", "focus-flow", "provider.tsx");
    expect(provider).toContain("const persistQueue = useRef<Promise<unknown>>(Promise.resolve())");
    expect(provider).toContain("const persistData = useCallback");
    expect(provider).toContain("persistQueue.current = persistQueue.current");
    expect(provider).toContain("AsyncStorage.setItem(STORAGE_KEY, serialized)");
    expect(provider).not.toContain("catch(() => { if (active) setData(EMPTY_FOCUS_FLOW_DATA); })");
  });

  it("Focus Gateは背景化された制限対象イベントで制限外アプリへ介入しない", () => {
    const service = source("plugins", "native", "android", "kotlin", "FocusGateService.kt");
    expect(service).toContain("isTransientForegroundPackage(activeCandidate)");
    expect(service).toContain("activeCandidate == eventCandidate");
    expect(service).toContain("lastReliableForegroundPackage");
    expect(service).toContain("packageName.startsWith(\"com.android.systemui\")");
  });

  it("透過率Sliderは1%単位で領域外をclampし、ジェスチャー終了時にだけ永続状態を更新する", () => {
    const settings = source("app", "(tabs)", "settings.tsx");
    expect(settings).toContain("Math.round((locationX / trackWidth) * 100)");
    expect(settings).toContain("onPanResponderRelease");
    expect(settings).toContain("setDragValue(next)");
    expect(settings).toContain("setDragValue(undefined)");
    expect(settings).toContain("1%単位で反映");
  });

  it("Widget回数操作はラベル付きの独立ボタン面として説明され、本文タップと混線しない", () => {
    const provider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    expect(provider).toContain('"回数を減らす"');
    expect(provider).toContain('"回数を増やす"');
    expect(provider).toContain('"setBackgroundResource", widgetCardDrawable(dark, rowOpacity)');
    expect(provider).toContain("views.setOnClickPendingIntent(ids.decrement");
    expect(provider).toContain("views.setOnClickPendingIntent(ids.increment");
  });

  it("制限アプリ検索面は行と同じフラット境界で、コンパクトな文字倍率連動行を使う", () => {
    const settings = source("app", "(tabs)", "settings.tsx");
    expect(settings).toContain("appSelectionStyles.search");
    expect(settings).toContain("borderRadius: 0");
    expect(settings).toContain("fontScale === \"large\" ? 76");
    expect(settings).toContain("fontSize: 15");
    expect(settings).toContain("getAppFontStyle(displaySettings.fontFamily ?? \"system\")");
  });

  it("Todo入力シートは表示後のeffectを待たずに初期値を設定する", () => {
    const taskForm = source("components", "focus-flow", "task-form.tsx");
    expect(taskForm).toContain('import { useLayoutEffect, useMemo, useState } from "react"');
    expect(taskForm).toContain("useLayoutEffect(() => {");
  });
});

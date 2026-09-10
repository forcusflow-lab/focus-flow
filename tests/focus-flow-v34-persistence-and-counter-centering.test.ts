import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Focus Flow v34 端末再起動時データ永続化保証 & ウィジェットカウンター上下センタリング", () => {
  const pluginLayout = source("plugins", "native", "android", "res", "layout", "focus_flow_widget_initial.xml");
  const nativeLayout = source("android", "app", "src", "main", "res", "layout", "focus_flow_widget_initial.xml");
  const pluginProvider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
  const nativeProvider = source("android", "app", "src", "main", "java", "com", "app", "focusflow", "focusflow", "FocusFlowWidgetProvider.kt");
  const pluginModule = source("plugins", "native", "android", "kotlin", "FocusGateModule.kt");
  const nativeModule = source("android", "app", "src", "main", "java", "com", "app", "focusflow", "focusflow", "FocusGateModule.kt");
  const providerTsx = source("lib", "focus-flow", "provider.tsx");
  const androidGateTs = source("lib", "focus-flow", "android-gate.ts");

  describe("1. 端末再起動時のデータ全消失バグの根本修正（Provider層）", () => {
    it("isReadyRef による起動時の初期化レースコンディション防止が適用されている", () => {
      expect(providerTsx).toContain("const isReadyRef = useRef(false);");
      expect(providerTsx).toContain("if (next !== current && isReadyRef.current) persistData(next);");
      expect(providerTsx).toContain("if (!isReadyRef.current) return;");
    });

    it("AsyncStorage 空/破損時にネイティブ SharedPreferences (AppDataBackup) から自動復元する", () => {
      expect(providerTsx).toContain("const backup = await getAppDataBackup();");
      expect(providerTsx).toContain("void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(backupParsed))");
    });

    it("persistData 時にネイティブバックアップ (saveAppDataBackup) を即時実行し、AsyncStorage と二重永続化を行う", () => {
      expect(providerTsx).toContain("void saveAppDataBackup(serialized).catch(() => undefined);");
      expect(providerTsx).toContain("AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))");
      expect(providerTsx).toContain("InteractionManager.runAfterInteractions");
    });
  });

  describe("2. ネイティブ層のトランザクション即時ディスク書き込み（commit徹底）", () => {
    it("FocusGateModule に saveAppDataBackup / getAppDataBackup が実装され commit() が呼ばれている", () => {
      for (const mod of [pluginModule, nativeModule]) {
        expect(mod).toContain("fun saveAppDataBackup(serialized: String, promise: Promise)");
        expect(mod).toContain("preferences.edit().putString(APP_DATA_BACKUP, serialized).commit()");
        expect(mod).toContain("fun getAppDataBackup(promise: Promise)");
        expect(mod).toContain(".putString(GATE_STATE, serialized)");
        expect(mod).toContain(".commit()");
        expect(mod).toContain("preferences.edit().remove(WIDGET_ACTIONS).commit()");
      }
    });

    it("FocusFlowWidgetProvider で SharedPreferences 書き込みに apply() ではなく commit() が徹底されている", () => {
      for (const provider of [pluginProvider, nativeProvider]) {
        // onDeleted
        expect(provider).toContain("editor.commit()");
        // toggleCompletedVisibility / adjustHabitFromWidget
        expect(provider).toContain(").commit()");
        // apply() が残っていないことを検証
        expect(provider).not.toMatch(/\.apply\(\)/);
      }
    });
  });

  describe("3. 回数カウンター（[-] 2/5 [+]）の上下センタリング", () => {
    it("全行のカウンターコンテナ LinearLayout に layout_gravity=\"center\" と gravity=\"center\" が指定されている", () => {
      for (const layout of [pluginLayout, nativeLayout]) {
        for (const row of ["one", "two", "three", "four", "five"]) {
          expect(layout).toContain(`focus_flow_widget_static_row_${row}_controls`);
          expect(layout).toContain('<LinearLayout android:layout_width="match_parent" android:layout_height="match_parent" android:layout_gravity="center" android:gravity="center" android:orientation="horizontal">');
        }
      }
    });

    it("全行のカウンター減算・数値・加算 TextView に includeFontPadding=\"false\" と textAlignment=\"center\" が指定されている", () => {
      for (const layout of [pluginLayout, nativeLayout]) {
        for (const row of ["one", "two", "three", "four", "five"]) {
          expect(layout).toContain(`android:id="@+id/focus_flow_widget_static_row_${row}_decrement" android:layout_width="26dp" android:layout_height="match_parent" android:gravity="center" android:textAlignment="center" android:includeFontPadding="false"`);
          expect(layout).toContain(`android:id="@+id/focus_flow_widget_static_row_${row}_progress" android:layout_width="30dp" android:layout_height="match_parent" android:gravity="center" android:textAlignment="center" android:includeFontPadding="false"`);
          expect(layout).toContain(`android:id="@+id/focus_flow_widget_static_row_${row}_increment" android:layout_width="26dp" android:layout_height="match_parent" android:gravity="center" android:textAlignment="center" android:includeFontPadding="false"`);
        }
      }
    });
  });

  describe("4. プラグインとAndroidネイティブ実装の完全同期", () => {
    const normalize = (content: string) => content.replace(/\r\n/g, "\n").trim();

    it("focus_flow_widget_initial.xml が plugins と android/app で完全一致する", () => {
      expect(normalize(pluginLayout)).toEqual(normalize(nativeLayout));
    });

    it("FocusGateModule.kt が plugins と android/app で完全一致する", () => {
      expect(normalize(pluginModule)).toEqual(normalize(nativeModule));
    });

    it("FocusFlowWidgetProvider.kt が plugins と android/app で完全一致する", () => {
      expect(normalize(pluginProvider)).toEqual(normalize(nativeProvider));
    });

    it("android-gate.ts が saveAppDataBackup と getAppDataBackup を正しくエクスポートしている", () => {
      expect(androidGateTs).toContain("export async function saveAppDataBackup(serialized: string): Promise<boolean>");
      expect(androidGateTs).toContain("export async function getAppDataBackup(): Promise<string | null>");
    });
  });
});

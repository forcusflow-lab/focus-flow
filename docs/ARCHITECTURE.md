# Focus Flow アーキテクチャ設計書 (ARCHITECTURE.md)

**バージョン:** 1.1.0 (インタラクション・UX刷新対応版)  
**更新日:** 2026年9月8日  
**技術スタック:** React Native (Expo SDK 54 / Expo Router v4), TypeScript, Android Native (Kotlin), Jetpack RemoteViews

---

## 1. 全体アーキテクチャ概要

Focus Flow は、クロスプラットフォームUI開発の生産性（React Native / Expo）と、Android OSの深層機能（アクセシビリティサービスによるアプリ遮断、ホーム画面インタラクティブWidget）をシームレスに融合したハイブリッドアーキテクチャを採用しています。

### 1.1. レイヤー構成 (Clean Architecture & UDF)

```mermaid
graph TD
    subgraph UI Presentation Layer
        Screens["Screens (app/(tabs)/*)"]
        Components["UI Components (components/focus-flow/*)"]
    end

    subgraph State & Orchestration Layer
        Provider["FocusFlowProvider (Context & Reducer)"]
        BridgeHook["Native Bridge Hooks (lib/focus-flow/android-gate.ts)"]
    end

    subgraph Domain & Logic Layer
        DomainTypes["Domain Types (lib/focus-flow/types.ts)"]
        PureUtils["Pure Utilities & Rules (lib/focus-flow/utils.ts)"]
        Strings["String Resources (lib/focus-flow/strings.ts)"]
    end

    subgraph Data & Native IPC Layer
        Storage["AsyncStorage (App State)"]
        SharedPrefs["Android SharedPreferences (focus_gate_prefs / widget_prefs)"]
        NativeModule["FocusGateModule (Kotlin)"]
        AccessService["FocusGateService (AccessibilityService)"]
        AppWidget["FocusFlowWidgetProvider (AppWidget RemoteViews)"]
        StringsXml["Android Resources (res/values/strings.xml)"]
    end

    Screens --> Components
    Components --> Provider
    Components --> Strings
    Provider --> PureUtils
    Provider --> DomainTypes
    Provider --> Storage
    Provider --> BridgeHook
    BridgeHook --> NativeModule
    NativeModule --> SharedPrefs
    SharedPrefs --> AccessService
    SharedPrefs --> AppWidget
    StringsXml -.-> Strings
```

1. **Presentation Layer (`app/`, `components/focus-flow/`)**:
   * Expo Router によるファイルベースルーティング。
   * プレゼント・コンテナ分離パターンによる疎結合なUIコンポーネント群。
   * `TodoItemCard` をマスターコンポーネントとする統一デザインシステム。
   * アコーディオン展開制御、180度Chevron回転アニメーション、48x48dp判定領域による誤タップ防止。
2. **State & Orchestration Layer (`lib/focus-flow/provider.tsx`, `android-gate.ts`)**:
   * 単一方向データフロー（Unidirectional Data Flow: UDF）による状態管理。
   * React Context + Reducer による状態の集約。
   * TypeScriptレイヤーからNativeレイヤーへの同期オーケストレーション。
3. **Domain & Pure Logic Layer (`lib/focus-flow/types.ts`, `lib/focus-flow/utils.ts`, `lib/focus-flow/strings.ts`)**:
   * 外部ライブラリ非依存の純粋な型定義とビジネスロジック。
   * 達成条件判定、ストリーク計算、サブタスク連動、時間帯検証などの純粋関数群。
   * `R.string` および `stringResource(R.string.xxx)` による型安全な文字列リソース。
   * 高いテスト容易性（Vitestによる100%自動回帰テスト担保）。
4. **Data & Native IPC Layer (`plugins/native/android/`)**:
   * React Native 側の `AsyncStorage`（メインデータ永続化）。
   * ネイティブ側の `SharedPreferences`（高速アクセス用同期キャッシュ）。
   * Android `AccessibilityService` および `AppWidgetProvider`。

---

## 2. ネイティブ統合とIPC (プロセス間通信)

アプリのJavaScriptスレッド、OSアクセシビリティサービス、およびホーム画面ウィジェットは、異なるプロセス・スレッドで並行動作します。これらは Android `SharedPreferences` および `BroadcastIntent` を介して安全にデータ同期を行います。

### 2.1. データ同期フロー

```mermaid
sequenceDiagram
    autonumber
    participant User as ユーザー / UI
    participant JS as React Native (FocusFlowProvider)
    participant Module as FocusGateModule (NativeBridge)
    participant Prefs as SharedPreferences
    participant Gate as FocusGateService (Accessibility)
    participant Widget as FocusFlowWidgetProvider (RemoteViews)

    User->>JS: タスク完了 / 設定変更
    JS->>JS: 状態更新 & AsyncStorage保存
    JS->>Module: syncSettings() / syncTasks()
    Module->>Prefs: JSON / 構造化設定書き込み
    Module->>Gate: Intent ("com.app.focusflow.SYNC_GATE")
    Module->>Widget: sendBroadcast (ACTION_APPWIDGET_UPDATE)
    Gate->>Prefs: 最新ルール・制限状態を再読込
    Widget->>Prefs: 最新タスク・透過設定を読込
    Widget->>Widget: RemoteViews 再描画
```

---

## 3. 集中制限サービス (`FocusGateService`)

Android の `AccessibilityService` を使用し、指定された制限対象アプリがフォアグラウンドになった際に遮断オーバーレイを描画します。

### 3.1. 遮断判定シーケンス

```mermaid
sequenceDiagram
    autonumber
    participant TargetApp as 誘惑アプリ (Target App)
    participant OS as Android OS
    participant Service as FocusGateService
    participant Prefs as SharedPreferences
    participant Overlay as WindowManager (OVERLAY)

    TargetApp->>OS: アプリ前面化
    OS->>Service: onAccessibilityEvent(TYPE_WINDOW_STATE_CHANGED)
    critical 例外安全ガード (Throwable Catch)
        Service->>Service: ノード取得 (rootInActiveWindow)
        Service->>Service: 即時 recycle() 解放 (メモリリーク防止)
        Service->>Prefs: 制限ルール・未完了必須タスク確認
        alt 集中制限が有効 かつ 必須タスクが未完了
            Service->>Overlay: TYPE_ACCESSIBILITY_OVERLAY 描画
            Overlay-->>TargetApp: 画面・タッチ操作を全面遮断
        else 制限対象外 または 必須タスク完了済み
            Service->>Overlay: オーバーレイ破棄 (dismiss)
        end
    end
```

### 3.2. 耐障害性 & セキュリティ設計 (Production Resilience)

1. **例外安全の完全防御 (Crash Prevention)**:
   * `onAccessibilityEvent`、`onServiceConnected`、`onDestroy` を含む全コールバックを包括的な `try-catch (e: Throwable)` で保護。予期しないOSイベントやNull参照でもサービスプロセスをクラッシュさせません。
2. **AccessibilityNodeInfo メモリリーク防止**:
   * `rootInActiveWindow` や `event.source` などのノード参照を取得した場合、判定処理直後に `node.recycle()` を明示的に実行。Android バインダープールの枯渇によるサービス強制終了を防ぎます。
3. **ライフサイクル復帰 (Lifecycle Resilience)**:
   * `onInterrupt()` 発生時の安全な状態リセット。
   * 端末再起動（`BOOT_COMPLETED`）およびアプリ更新（`MY_PACKAGE_REPLACED`）時に `FocusGateBootReceiver` が自動起動し、同期状態を復元。
4. **省電力キル対策 (Battery Optimization Exemption)**:
   * `android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` を導入。
   * ユーザー向け設定画面から「電池の最適化除外」ダイアログをトリガーし、バックグラウンドでの安定稼働を確保。
5. **Google Play Prominent Disclosure (重要開示) 準拠**:
   * アクセシビリティ権限を有効化する前に、ユーザーに対して「利用目的（指定アプリの前面化検知のみ）」「収集しない情報（個人情報・入力・画面内容）」を明示したダイアログを表示。

---

## 4. ホーム画面ウィジェット (`FocusFlowWidgetProvider`)

ホーム画面からアプリを起動せずにTodoや習慣を直接確認・操作できるインタラクティブウィジェットです。

### 4.1. アーキテクチャとレンダリング仕様

1. **レスポンシブ・行数バケット (Responsive Bucketing)**:
   * ウィジェットの縦幅・横幅（`appWidgetOptions`）をリアルタイムに検知。
   * 1行（コンパクト）〜最大5行（大画面）のレイアウトを動的に選択してRemoteViewsにバインド。
2. **2層独立透過レンダリング (Dual-Layer Opacity)**:
   * **背景レイヤー (`widgetBgAlpha`):** ウィジェット外枠・ヘッダー背景。
   * **アイテム行レイヤー (`itemBgAlpha`):** 個々のタスク・習慣カード背景。
   * カラーコード（Hex ARGB）動的生成により、背景透過とコンテンツ視認性の両立を実現。
3. **リモートアクション (Interactive PendingIntents)**:
   * **Todo完了トグル:** チェックボックス押下で `ACTION_WIDGET_TOGGLE_TODO` を発行し、SharedPreferencesを直接更新後、即座にRemoteViewsを再描画。
   * **習慣カウント (+/-):** 習慣のインクリメント/デクリメントを `ACTION_WIDGET_HABIT_PLUS` / `MINUS` で処理。本文タップと独立した専用タッチターゲットを確保。
   * **習慣タイマー:** 開始/停止をウィジェット上で制御。
   * **Deep Link:** カード本文タップ時、`manusfocusflow:///todos?open=<id>` などの標準化されたURLスキームで該当タスクの詳細画面へ直接遷移。

---

## 5. Expo Config Plugin (`plugins/with-focus-flow-android.js`)

Focus Flow のネイティブコードは Expo Prebuild によって管理されています。

* **テンプレート管理:** `plugins/native/android/` に純粋なKotlinソース、XMLレイアウト、ドローアブル、文字列リソース（`strings.xml`）を配置。
* **ビルド時インジェクション:** Prebuild 実行時、`with-focus-flow-android.js` が以下を自動構成:
  * `AndroidManifest.xml` への Service / Receiver / Widget / Activity 登録。
  * 必要なパーミッション（`SYSTEM_ALERT_WINDOW`, `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`, `RECEIVE_BOOT_COMPLETED` 等）の宣言。
  * `build.gradle` への依存関係追加。
  * ネイティブソースファイルおよび XML リソースの `android/app/src/main/` 配下への自動コピー。

---

## 6. UXライティング & 文字列リソース集約設計 (strings.xml 集約)

市販プロダクション水準のUI品質を担保するため、UI上のベタ書き文字列を全廃し、二重集約（Android Native XML + TypeScript Module）方式を採用しています。

1. **Android ネイティブリソース (`plugins/native/android/res/values/strings.xml`)**:
   * Android OS標準の `<string name="...">` 形式ですべての文言を集約。
   * ウィジェットやアクセシビリティサービス、通知等のネイティブ層が直接参照可能。
2. **TypeScript 型安全リソース (`lib/focus-flow/strings.ts`)**:
   * `R.string = { [key]: "string_id" } as const` によるリソースキー定義。
   * `stringResource(R.string.xxx, language, ...args)` ヘルパー関数を提供。
   * `%d`, `%s`, `%1$d`, `%2$d` 等の位置指定プレースホルダーおよび多言語（日/英）動的展開をサポート。

---

## 7. 触覚フィードバック (Haptic Feedback) 設計

指先への確実な操作感と達成感を提供するため、以下の操作に `expo-haptics` を統合した `safeHaptic` を導入しています。

1. **Todo完了 / サブタスクチェック**:
   * 親Todo完了時: `safeHaptic("success")`（達成フィードバック）
   * サブタスクチェック時: `safeHaptic("light")`（軽快なトグルフィードバック）
2. **習慣操作**:
   * 目標回数カウント (`+` / `-`): `safeHaptic("light")`
   * 習慣完了時: `safeHaptic("success")`
   * タイマー開始 / 一時停止: `safeHaptic("light")`
3. **Web / プラットフォームガード**:
   * Web環境では例外を起こさず静かにバイパスする安全ガード設計。

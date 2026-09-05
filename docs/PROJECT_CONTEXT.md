# Focus Flow Project Context

## プロジェクト概要

**Focus Flow** は、Todo・習慣（Habit）・メモ・集中制限（Focus Gate）・Androidウィジェットを一体で扱う、日本語優先のモバイル生産性アプリです。
端末内（ローカル）に状態を保存し、Androidネイティブ機能（アクセシビリティサービスによるアプリ遮断、ホーム画面Widget、Deep Link）と連携して「やるべきことの達成」と「スマホの使いすぎ防止」を支援します。

- **無料版**: タスク2件、習慣2件、メモ2件、制限アプリ5件まで利用可能。基本機能・外観設定は無料。
- **Focus Flow Plus**: 上限を解除し、テーマ設定等を自由に管理できる拡張機能。
- **本人用APK**: `FOCUS_FLOW_PERSONAL_UNLIMITED=1` で生成される個人利用向け制限なしパッケージ（`com.app.focusflow.personal`）。

---

## 技術スタック

実際のコード（`package.json`、`app.config.ts` 等）に基づく構成：

- **コア**: React Native `0.81.5`, React `19.1.0`
- **フレームワーク**: Expo SDK 54 (`~54.0.36`), Expo Router v6 (`~6.0.24`)
- **言語**: TypeScript `~5.9.3`
- **パッケージマネージャー**: pnpm 9 (`pnpm@9.12.0` / `9.15.9`)
- **スタイリング**: NativeWind v4 (`^4.2.1`), Tailwind CSS v3 (`^3.4.17`), React Native StyleSheet
- **状態管理 & ストレージ**: `@react-native-async-storage/async-storage` (`^2.2.0`), React Context (`FocusFlowProvider`)
- **バックエンド / API**: Express (`^4.22.1`), tRPC v11 (`11.8.0`), Drizzle ORM (`^0.44.7`)（主にWebプレビュー/同期用）
- **ネイティブ連携 (Android)**: Kotlin / Expo Config Plugin (`plugins/with-focus-flow-android.js`)
  - App Widget: `FocusFlowWidgetProvider.kt` (RemoteViews)
  - 集中制限: `FocusGateService.kt` (AccessibilityService)
- **テスト**: Vitest `^2.1.9`
- **リンター**: ESLint `^9.39.2`, `eslint-config-expo`

---

## プロジェクト構造

```
focus-flow/
├── app/                          # Expo Router 画面ルーティング
│   ├── (tabs)/                   # ボトムタブ画面
│   │   ├── _layout.tsx           # タブナビゲーション設定
│   │   ├── index.tsx             # 今日（Today）画面・進捗ウィジェット
│   │   ├── todos.tsx             # Todo一覧画面
│   │   ├── habits.tsx            # 習慣一覧画面
│   │   ├── notes.tsx             # メモ一覧画面
│   │   └── settings.tsx          # 設定画面（集中制限・テーマ・Widget設定）
│   ├── _layout.tsx               # アプリルートレイアウト（プロバイダー注入）
│   ├── terms.tsx, privacy.tsx    # 利用規約・プライバシーポリシー
│   └── legal.tsx, support.tsx    # 法的表記・サポート画面
├── components/focus-flow/        # アプリ専用UIコンポーネント
│   ├── item-cards.tsx            # TodoItemCard, HabitItemCard（UIマスター基準）
│   ├── task-form.tsx             # Todo作成・編集モーダル
│   ├── habit-form.tsx            # 習慣作成・編集モーダル
│   ├── habit-progress-control.tsx# 習慣の回数・タイマー操作UI
│   ├── required-window-selector.tsx # 必須項目の実行時間帯セレクター
│   ├── ui.tsx                    # 共通デザインシステム（COLORS, Pill, ScreenHeading, IconButton等）
│   └── scaled-text.tsx           # 文字サイズ倍率連動Textコンポーネント
├── lib/focus-flow/               # コアドメインロジック・型・データ永続化
│   ├── types.ts                  # 全データ型定義（Todo, Habit, GateConfig, DisplaySettings等）
│   ├── provider.tsx              # FocusFlowProvider（状態管理・AsyncStorage永続化）
│   ├── utils.ts                  # 共通計算関数（期限・連続日数・必須判定・集中制限判定）
│   ├── android-gate.ts           # Androidネイティブ（Widget・Gate）とのデータ同期ブリッジ
│   ├── app-themes.ts             # テーマパレット・カラースキーム定義
│   └── i18n.ts                   # 多言語対応（日本語・英語）
├── plugins/                      # Expo Config Plugin & ネイティブコード
│   ├── with-focus-flow-android.js# Androidネイティブビルド用Configプラグイン
│   └── native/android/           # Androidネイティブソース（Kotlin/XML）
│       ├── kotlin/               # FocusFlowWidgetProvider.kt, FocusGateService.kt
│       └── res/                  # WidgetレイアウトXML、ドローアブル、メタデータ
├── docs/                         # AI開発用ドキュメント・仕様書
├── release/                      # v12仕様書・設計書・テスト計画
├── tests/                        # Vitest 自動テストスイート（38ファイル）
├── app.config.ts                 # Expo アプリ設定（Bundle ID、Scheme、Plugins）
└── package.json                  # 依存関係・npmスクリプト
```

---

## 主要機能

1. **Todo管理**:
   - タイトル、期限、優先度、メモ、必須設定（常時 / 時間帯指定）
   - サブタスク機能（階層ツリー表示、独立チェック操作、進捗バッジ）
   - 完了状態の切り替え、完了項目の折りたたみ表示
2. **習慣（Habit）管理**:
   - 週間目標日数（3日/5日/7日）、カラー設定、連続日数（ストリーク）追跡
   - 達成基準タイプ: 「完了チェック」「回数目標（例: 1日10回）」「時間目標（タイマー計測）」
   - 曜日ごとの達成履歴の展開表示・直接入力
3. **今日（Today）の対象 & 進捗ウィジェット**:
   - 当日必須項目（手動必須、期限当日以前のTodo、必須習慣）を集約表示
   - 上部カードでの必須進捗バーとTodo・習慣の内訳表示
4. **集中制限（Focus Gate - Android）**:
   - AccessibilityService（`FocusGateService`）を用いた制限対象アプリの起動ブロック
   - 今日の必須項目が未完了の間は指定アプリを制限、全達成で解除
5. **ホーム画面ウィジェット（Android App Widget）**:
   - ホーム画面からTodo・習慣の確認と完了/回数カウント/タイマー操作が可能
   - 二層透過率（背景・カード）、テーマカラー連動
6. **メモ（Notes）**:
   - 自由記述メモ機能。ワンタップでTodoへ変換可能。

---

## 重要な実装ファイル

| 機能領域 | 主要ファイルパス |
| :--- | :--- |
| **Todo 機能** | `lib/focus-flow/types.ts`<br>`lib/focus-flow/provider.tsx`<br>`app/(tabs)/todos.tsx`<br>`components/focus-flow/item-cards.tsx`<br>`components/focus-flow/task-form.tsx` |
| **Habit 機能** | `lib/focus-flow/types.ts`<br>`lib/focus-flow/provider.tsx`<br>`app/(tabs)/habits.tsx`<br>`components/focus-flow/item-cards.tsx`<br>`components/focus-flow/habit-form.tsx`<br>`components/focus-flow/habit-progress-control.tsx` |
| **サブタスク 機能** | `lib/focus-flow/types.ts` (`TodoSubtask`)<br>`lib/focus-flow/provider.tsx` (`toggleSubtask`)<br>`components/focus-flow/item-cards.tsx` (`subtaskTreeBranch`, `miniCheck`)<br>`components/focus-flow/task-form.tsx` |
| **Widget (Android)** | `plugins/native/android/kotlin/FocusFlowWidgetProvider.kt`<br>`plugins/native/android/res/layout/focus_flow_widget_initial.xml`<br>`lib/focus-flow/android-gate.ts`<br>`plugins/with-focus-flow-android.js` |
| **集中制限 (Focus Gate)** | `plugins/native/android/kotlin/FocusGateService.kt`<br>`lib/focus-flow/android-gate.ts`<br>`app/(tabs)/settings.tsx` |
| **データ保存 & 状態** | `lib/focus-flow/provider.tsx` (`FocusFlowProvider`, `persistQueue`)<br>`lib/focus-flow/types.ts` (`FocusFlowData`) |
| **ナビゲーション** | `app/_layout.tsx`<br>`app/(tabs)/_layout.tsx` |
| **共通UIデザイン** | `components/focus-flow/ui.tsx`<br>`components/focus-flow/scaled-text.tsx`<br>`lib/focus-flow/app-themes.ts` |
| **GitHub Actions / CI** | `.github/workflows/android-build.yml`<br>`.github/workflows/personal-unlimited-apk.yml` |

---

## データフロー

```
[ ユーザー操作 (UI) ]
  Todo追加 / 完了チェック / 習慣進捗 / サブタスク操作
       ↓
[ FocusFlowProvider (lib/focus-flow/provider.tsx) ]
  ・React State (data) をイミュータブルに更新
  ・非同期キュー (persistQueue) により書き込み順序を保証
       ↓
[ 永続化 (AsyncStorage) ]
  ・キー: @focus_flow_data_v1
  ・JSON文字列として端末ローカルストレージへ保存
       ↓
[ Android ネイティブ同期 (lib/focus-flow/android-gate.ts) ]
  ・syncFocusGateData() / syncNativeWidget() を実行
  ・SharedPreferences へ最新状態（必須項目リスト・進捗・Widget表示データ）を書き出し
       ↓
[ Android ネイティブ機能 ]
  ・FocusFlowWidgetProvider.kt がホーム画面Widgetを即時再描画
  ・FocusGateService.kt がアプリ起動検知時に最新の解除条件を参照して遮断/通過を判定
```

---

## 開発・実行方法

`package.json` に定義されている実際のコマンド：

```powershell
# 依存関係のインストール (lockfile厳格)
pnpm install --frozen-lockfile

# 開発サーバー起動（バックエンドサーバー + Metro Bundler）
pnpm dev

# Metro Bundler のみ起動（Web / エミュレータ / 実機接続用）
pnpm dev:metro
# または
npx expo start

# TypeScript 型チェック
pnpm check

# ESLint 静的コード検査
pnpm lint

# コードフォーマット整形
pnpm format

# Vitest 単体・契約テスト実行
pnpm test

# Android クリーン prebuild（ネイティブコード生成確認）
CI=1 npx expo prebuild --platform android --clean --no-install

# Android 本人用無制限版 prebuild
FOCUS_FLOW_PERSONAL_UNLIMITED=1 CI=1 npx expo prebuild --platform android --clean --no-install
```

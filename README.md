# Focus Flow

Focus Flow は、Todo・習慣・メモ・集中制限・Androidホーム画面ウィジェットを一体で統合した、日本語優先のモバイル生産性・集中支援アプリケーションです。  
Expo Router / React Native（TypeScript）を基盤とし、端末内（ローカルファースト）に完全暗号化・安全保存されます。Androidプラットフォームでは、アクセシビリティサービスを用いた集中制限オーバーレイ（Focus Gate）と、双方向操作可能なホーム画面ウィジェット（RemoteViews）を提供します。

---

## 🌟 主な機能

- **📝 Todo管理:**
  - タイトル、詳細メモ（カード上に `📝` アイコン表示）、期限日、優先度、実行時間帯設定。
  - 階層サブタスク対応 & **全サブタスク完了時の親タスク自動完了連動**。
- **🔥 習慣トラッキング (Habit):**
  - 達成チェック、目標回数カウント（`+` / `-`）、タイマー計測（Chronometer）の3タイプ。
  - 継続ストリーク（連続日数）カウントおよび週次ドット表示。
- **🛡️ 集中制限 (Focus Gate):**
  - 指定した誘惑アプリの前面化を `AccessibilityService` で検知し、今日の必須項目が終わるまで自動遮断。
  - 耐障害性設計（包括的例外防御、ノード即時解放によるメモリリーク防止、端末起動時復旧）。
  - バッテリー最適化除外（`REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`）に対応。
- **📱 ホーム画面インタラクティブウィジェット (Android AppWidget):**
  - アプリを開かずにTodoチェック、習慣カウント（`+`/`-`）、タイマー開始/停止が可能。
  - ウィジェット外枠背景とアイテム行背景の **2層独立透過度スライダー（0%〜100%）**。
  - 端末画面幅・高さに応じたレスポンシブな行数バケット表示（1〜5行）。
- **💎 プラン設計 (Free & Plus):**
  - 無料版（登録数制限）および無制限の Focus Flow Plus。

---

## 📖 仕様書・設計書

- [**機能仕様書 (SPEC.md)**](./SPEC.md): Todo、習慣、ウィジェット、アプリ制限、マネタイズの詳細仕様
- [**アーキテクチャ設計書 (ARCHITECTURE.md)**](./ARCHITECTURE.md): レイヤー構成、IPC同期フロー、アクセシビリティ耐障害性、ウィジェット描画構造
- [**デザイン・UIガイドライン (docs/UI_RULES.md)**](./docs/UI_RULES.md): `TodoItemCard` をマスターとするUIデザイン規則

---

## 🚀 開発・ビルド環境

### 前提条件
- Node.js 22+
- pnpm 9+
- Android Studio & JDK 17+ (Android ネイティブビルド時)

### コマンド一覧

```bash
# 依存パッケージのインストール
pnpm install --frozen-lockfile

# TypeScript型検査
pnpm check

# 全自動単体・回帰テスト (Vitest)
pnpm test

# 開発サーバー起動
pnpm dev

# Android クリーンPrebuild (通常版)
CI=1 npx expo prebuild --platform android --clean --no-install

# 本人用Plus版 Android クリーンPrebuild
FOCUS_FLOW_PERSONAL_UNLIMITED=1 CI=1 npx expo prebuild --platform android --clean --no-install
```

---

## 🔒 セキュリティ & プライバシー

1. **完全ローカルファースト:** すべてのユーザーデータ（タスク、習慣、メモ、利用状況）は端末内（AsyncStorage / SharedPreferences）にのみ保存され、外部サーバーへの通信は一切行いません。
2. **アクセシビリティの目的外利用なし:** 画面テキストや入力内容の監視・収集は行わず、ユーザーが明示的に指定したアプリの前面化検知のみに権限を使用します。

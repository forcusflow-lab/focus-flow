# Focus Flow

Focus Flowは、Todo・習慣・メモ・集中制限・Androidウィジェットを一体で扱う、日本語優先のモバイル生産性アプリです。Expo Router／React Nativeを基盤とし、端末内へ状態を保存します。Androidではアクセシビリティサービスを用いた集中制限と、Todo・習慣を操作できる統合Widgetを提供します。

## 開発を始める前に

Node.js 22、pnpm 9、Android向けのExpo開発環境が必要です。依存関係を取得したら、通常の開発は次で開始します。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

| コマンド | 用途 |
|---|---|
| `pnpm check` | TypeScript型検査 |
| `pnpm lint` | Expo ESLint |
| `pnpm test` | Vitestの全回帰テスト |
| `CI=1 npx expo prebuild --platform android --clean --no-install` | 通常版Androidのクリーン生成 |
| `FOCUS_FLOW_PERSONAL_UNLIMITED=1 CI=1 npx expo prebuild --platform android --clean --no-install` | 本人用Plus APKのクリーン生成 |

## 品質工程

機能修正は、部分的な画面変更で終わらせません。対象機能ごとに、仕様、画面設計、状態遷移、受入基準を記録し、レビュー後に実装します。続いて、型検査、Lint、Vitest、通常版・本人用版のクリーンAndroid生成、署名ビルド、Android実機受入を順に実行します。実機でしか確認できないWidget、アクセシビリティ遮断、起動画面、Deep Linkは、自動検証と分けて記録します。

現行のv12仕様・設計・レビュー・テスト計画は[`release/`](./release/)にあります。作業開始時は、特に次を読んでください。

| 文書 | 目的 |
|---|---|
| [`V12_ALL_FEATURES_SPEC.md`](./release/V12_ALL_FEATURES_SPEC.md) | 全機能の仕様、状態遷移、受入基準 |
| [`V12_UX_REDESIGN_SPEC.md`](./release/V12_UX_REDESIGN_SPEC.md) | 時間帯必須、Today、起動、Widgetのv12設計 |
| [`V12_SETTINGS_REDESIGN_SPEC.md`](./release/V12_SETTINGS_REDESIGN_SPEC.md) | 設定の目的別構造、三段階集中制限、受入基準 |
| [`V12_TEST_PLAN.md`](./release/V12_TEST_PLAN.md) | 自動・ネイティブ・実機の品質ゲート |
| [`V12_FULL_COVERAGE_AUDIT.md`](./release/V12_FULL_COVERAGE_AUDIT.md) | 全機能・全画面・ネイティブ導線の監査台帳 |
| [`GITHUB_HANDOFF.md`](./release/GITHUB_HANDOFF.md) | GitHub、署名ビルド、リリース運用の引継ぎ |

## 主要な実装場所

| 領域 | 主な場所 |
|---|---|
| データモデル・時間帯必須 | `lib/focus-flow/types.ts`、`lib/focus-flow/utils.ts`、`lib/focus-flow/provider.tsx` |
| Todo・習慣・Today | `app/(tabs)/todos.tsx`、`habits.tsx`、`index.tsx` |
| 集中制限・Widget同期 | `lib/focus-flow/android-gate.ts` |
| Androidネイティブテンプレート | `plugins/native/android/` |
| Expo生成時のコピー・差し替え | `plugins/with-focus-flow-android.js` |
| 設定 | `app/(tabs)/settings.tsx` |
| 静的回帰テスト | `tests/` |

Androidネイティブの変更は、テンプレートだけで終わらせず、必ず`with-focus-flow-android.js`のコピー対象、通常版・本人用版のクリーン生成、対応するVitestを更新してください。

## Android Deep Linkの規約

Expo Router向けのネイティブURIは、authorityを使わない`<scheme>:///path`形式に統一します。たとえばTodayは`manusfocusflow:///`、Todo詳細は`manusfocusflow:///todos?open=<id>`です。`<scheme>://today`や4スラッシュのURIは使用しません。Widget、遮断画面、フォールバックActivityはこの規約を共有します。

## バージョンと配布

通常のGoogle Play候補は`com.app.focusflow`、`versionCode 12`です。本人用の制限なしPlus APKは`FOCUS_FLOW_PERSONAL_UNLIMITED=1`で生成する別パッケージ`com.app.focusflow.personal`であり、通常版の無料制限・IAP・Google Play配布には影響させません。本人用を更新配布する際はversionCodeを必ず上げます。

Google Play内部テストや一般公開は外部確定操作です。署名済みAABを生成し、実機受入が完了してから、所有者の確認を得て行います。

## 貢献・AIへの引継ぎ

変更前に`todo-btb3aesl.md`へ未完了項目を追加し、変更後には完了状況を反映します。仕様に影響する変更は`release/`の設計書・テスト計画にも反映してください。新しい不具合は、再現手順、期待結果、実際の結果、対象ビルド、端末・OSを記録し、回帰テストを追加してから修正します。

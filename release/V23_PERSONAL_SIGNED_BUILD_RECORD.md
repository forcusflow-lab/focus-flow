# Focus Flow v23 本人用署名APK 検証記録

## 1. 対象と位置付け

本記録は、実機v22で不合格となったWidget密度、必須Pillの透過連動、回数Habitの操作面、制限アプリ一覧の可読性・文字倍率連動・安定性を改修した、**Focus Flow v23 本人用・制限なしAPK**の出所と独立検証結果を固定するものである。本APKは実機受入前の暫定検証版であり、Google Playへのアップロード・公開はしていない。

## 2. 出所

| 項目 | 値 |
|---|---|
| GitHub source commit | `3c324b13bf604e56ea9abec0a94c0f40ad3d9edc` |
| GitHub Actions workflow run | `33132225712` |
| Workflow result | `success` |
| Artifact ID | `9671194074` |
| Artifact name | `focus-flow-personal-unlimited-apk` |
| Artifact ZIP digest | `sha256:c6fc9d9c606bca8904ddc2b579886277e37414952cb6cd3be8d4ded9e2f64daf` |
| Artifact retention expiry | `2026-09-11T01:42:16Z` |

## 3. APK識別・整合性

| 項目 | 検証値 |
|---|---|
| 配布名 | `Focus-Flow-v23-Personal.apk` |
| APK size | `51,906,065 bytes` |
| APK SHA-256 | `34b7080e6bb3e4565845d71fdfd84273f8b28f5987a40bccc93905649fe78b7b` |
| package | `com.app.focusflow.personal` |
| versionName / versionCode | `1.0.0` / `22` |
| Deep Link scheme | `manusfocusflowpersonal` |
| 署名 | v2 signed、v1/v3 unsigned |
| 証明書SHA-1 | `0D:A5:A7:0E:14:A2:A4:3A:DB:A8:F8:04:40:81:C5:B2:18:86:B5:BC` |

artifact ZIPのSHA-256はGitHub APIが返した公式digestと一致した。ZIP整合性を検査後に抽出したAPKは、上記のサイズ・SHA-256と一致した。

## 4. 独立Native検証

| 検証観点 | 結果 |
|---|---|
| AndroidManifest | 本人用package、versionCode 22、専用schemeを確認 |
| Widget Provider | `FocusFlowWidgetProvider`および`APPWIDGET_UPDATE_OPTIONS`を確認 |
| Widget密度 | `responsiveWidgetViews`と`focus_flow_widget_static_row_five`をDEXから確認 |
| 完了済み表示 | `widgetShowCompleted`のWidget別状態経路をDEXから確認 |
| 時間Habit | `setChronometer`をDEXから確認 |
| 必須Pill資産 | `resources.arsc`から全テーマ・light/dark・0/25/50/75/100%段階のPill資産を81件確認 |
| 禁止経路 | `RemoteViewsService`、`setRemoteAdapter`、`BIND_REMOTEVIEWS`がDEXにないことを確認 |

## 5. ソース品質ゲート

| ゲート | 結果 |
|---|---|
| Vitest | 34 files / 102 passed / 1 skipped |
| TypeScript | `pnpm check` 成功 |
| Lint | `CI=1 pnpm lint` 成功 |
| 通常版クリーンAndroid生成 | versionCode 32、成功 |
| 本人用クリーンAndroid生成 | package分離、scheme分離、versionCode 22、成功 |

## 6. 実機受入の残項目

v23-R01（Pill透過）、v23-R02（5件以上の表示密度）、v23-R03（Widget別完了済み表示）、v23-R04（回数Habitの操作性）、v23-R05（制限アプリ一覧の文字階層・文字倍率・安定性）、v23-R06（連続操作性能）は、利用端末での受入が未完了である。すべての項目が合格するまで、本APKを正式版またはGoogle Play版として扱わない。

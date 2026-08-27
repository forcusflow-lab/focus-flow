# Focus Flow v22 本人用署名APK ビルド記録

## 1. 成果物の識別

| 項目 | 記録値 |
|---|---|
| ソースコミット | `3da62221a6ed92b726ba8b8ebc04489b46618736` |
| GitHub Actions Run | `33120015031`（成功） |
| 成果物ID | `9666770575` |
| Actions成果物名 | `focus-flow-personal-unlimited-apk` |
| Actions ZIP digest | `sha256:ab32e47303cad49adecc3c49990de4910761e55d2df26eccfcb4f6911b936b5a` |
| Actions ZIPサイズ | 27,926,366 bytes |
| 成果物の有効期限 | 2026-09-10 22:17:34 UTC |
| 端末配布ファイル | `Focus-Flow-v22-Personal.apk` |
| APKサイズ | 51,872,538 bytes |
| APK SHA-256 | `062a283c1e4446761a04f712994e7cb60d1acd0552bb51e2845466fd9f395d7c` |

GitHub Actions APIから再取得したartifact ZIPのSHA-256は、GitHubが返したdigestと一致した。ZIP整合性検査を通過し、展開した`app-release.apk`と配布名へ複製したAPKはバイト単位およびSHA-256で一致している。

## 2. パッケージ・署名の独立検証

| 検査項目 | 検証結果 |
|---|---|
| applicationId | `com.app.focusflow.personal` |
| versionCode / versionName | `21` / `1.0.0` |
| 個人用Deep Link scheme | `manusfocusflowpersonal` |
| APK Signature Scheme | v2: **有効**、v1: 無効、v3: 無効 |
| 証明書SHA-1 | `0D:A5:A7:0E:14:A2:A4:3A:DB:A8:F8:04:40:81:C5:B2:18:86:B5:BC`（既知の本人用署名証明書と一致） |

パッケージ・versionCode・証明書はAndroguardで解析した。Manifestには個人用scheme、`FocusFlowWidgetProvider`、`android.appwidget.action.APPWIDGET_UPDATE`、`android.appwidget.action.APPWIDGET_UPDATE_OPTIONS`が登録されている。

## 3. v22 Native検証

| 検査項目 | 検証結果 |
|---|---|
| Widgetレスポンシブ構成 | `responsiveWidgetViews`と1/2/3行バケットの経路を確認した。 |
| 完了済み表示 | `widgetShowCompleted:`のWidget ID別キーと`ACTION_TOGGLE_COMPLETED`をDEXで確認した。 |
| 時間型Habit | `setChronometer`をDEXで確認した。 |
| テーマ別Pill | `mist`、`slate`、`evergreen`、`ocean`、`orchid`、`sunrise`のlight/dark全12 drawableをresources.arscで確認した。 |
| 静的RemoteViews制約 | DEXに`RemoteViewsService`、`setRemoteAdapter`、`BIND_REMOTEVIEWS`が混入していないことを確認した。 |
| ZIP整合性 | `unzip -t`で正常終了した。 |

このAPKは通常のGoogle Play版とは別の`com.app.focusflow.personal`であり、本人用の制限なし検証用途に限定する。Google Playへのアップロード・公開は本記録の対象外であり、実行していない。

## 4. 実機受入の状態

| 受入項目 | 状態 |
|---|---|
| V22-R01：必須Pill | 未受入 |
| V22-R02：5件以上の候補と1/2/3行・overflow | 未受入 |
| V22-R03：Widget別の完了済み表示切替・保持 | 未受入 |
| V22-R04：0/50/100%透過下の開始・停止・回数操作 | 未受入 |
| V22-R05：制限アプリ一覧の識別性・検索・テーマ | 未受入 |
| V22-R06：連続操作時の体感性能 | 未受入 |

**結論:** 自動検証、通常版/本人用クリーンAndroid生成、GitHub Actions署名、APKの独立検証までは完了した。レイアウト、操作性、端末ランチャー上のWidget挙動、体感性能は実機受入前のため、正式版と断定しない。

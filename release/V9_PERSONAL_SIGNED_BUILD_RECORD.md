# Focus Flow 本人用 v9 署名APKビルド記録

## 判定

**実機受入用の候補として保留する。配布は不可。** 本人用v9はGitHub Actionsで署名生成・独立検証を完了したが、Widget追加、テーマ、必須ラベルを含む実機スクリーンショット品質ゲートは未受入である。従って、この成果物を利用者へ共有しない。

| 項目 | 結果 |
|---|---|
| GitHub Actions | run `33004087649`、成功 |
| ソース | `main` の `a8dff220ef3571783fdecd1bdb6e8b44b63ba4ea` |
| Artifact | `focus-flow-personal-unlimited-apk` |
| APK | `app-release.apk`、51,764,719 bytes |
| Package / versionCode | `com.app.focusflow.personal` / `9` |
| APK SHA-256 | `77b8000aab24afc0b17314c190fcfecf1079e696ffdff1184228ece0452eb764` |
| ZIP整合性 | `unzip -t` 成功 |
| APK署名 | Signature Scheme v2 有効、v1/v3なし |
| 証明書SHA-1 | `0D:A5:A7:0E:14:A2:A4:3A:DB:A8:F8:04:40:81:C5:B2:18:86:B5:BC` |
| Deep Link | `manusfocusflowpersonal` をManifestで確認 |
| Widget Provider | `com.app.focusflow.personal.focusflow.FocusFlowWidgetProvider` をManifestで確認 |
| Widget資産 | 初期layout、initial-info、light/dark × 0/25/50/75/100% の10 drawableをresources.arscで確認 |
| Widget layout | APK内layoutを復号し、`FrameLayout`、`LinearLayout`、`TextView`、`ImageView`のみを確認。生`View`、`ListView`、weight、0dp高さは不在 |

## 旧成果物の扱い

最初の run `32999982240` はGitHub `main` がv8の `a77dd407` を参照していたため、本人用 `versionCode 8` を生成した。このAPKはv9検証・実機受入・配布の対象外とする。`main` を `a8dff220` へ早送り同期した後、run `33004087649` を再実行して上表のv9成果物を得た。

## 未完了の必須品質ゲート

1. 小・標準・大Widgetでの追加、同期、空/1件/2件、長文表示。
2. ライト/ダーク、文字サイズ3段階、背景濃さ0/25/50/75/100%、必須ラベル完全表示。
3. 上下行ごとの完了/復元、詳細、ヘッダー→Today、時間ロック、戻る、遮断導線。

上記をスクリーンショットで受入し、記録が合格になるまでAPKの添付・URL共有・Google Play配布を行わない。

# Focus Flow v21 本人用署名APKビルド記録

## 1. 対象と配布上の扱い

本記録は、v20のWidget透過・Slider・完了済み表示・ダークフォーム・Memo保存CTAの是正と、v21の制限対象一覧・テーマ連動ブロック画面・フルスクリーン起動画面を含む、本人用・制限なしAPKの署名ビルドを対象とする。アプリIDは`com.app.focusflow.personal`であり、通常のGoogle Play版、無料上限、IAP、Play配布には影響しない。

> 本APKは利用者の明示許可に基づく**暫定実機検証版**である。V20-R01〜R07およびV21-R01〜R05の実機受入が完了するまでは、正式版・Google Play配布候補として扱わない。

| 項目 | 結果 |
|---|---|
| GitHubリポジトリ | `forcusflow-lab/focus-flow` |
| 対象ソース | [`4d36e2475f88d54db3ca32e810dc68b4a40c29fa`][2] |
| Webチェックポイント | `manus-webdev://4d36e247` |
| ワークフロー | `Build Focus Flow personal unlimited APK` |
| 成功run | [#33110049736][1] |
| Job | `98650171328`、全step成功 |
| 実行結果 | **成功**（26分21秒） |
| artifact | `focus-flow-personal-unlimited-apk`（ID: `9662978722`、27,923,216 bytes） |
| artifact digest | `sha256:9b367e281e7304aaa7330676be071c757f931688f45315fe8eec75449347731a` |
| artifact保持期限 | 2026-09-10 20:12:38 UTC |

## 2. 署名済みAPKの独立検証

GitHub Actions artifact ZIPをプロジェクト外の検証ディレクトリへ直接取得し、artifact ZIPと署名済みAPKを別々に検査した。artifact ZIPのSHA-256はGitHub APIのdigestと一致し、APKのZIP整合性、package、versionCode、署名方式、既知証明書の一致を確認した。

| 検証 | 実測結果 | 判定 |
|---|---|---|
| artifact ZIP | `focus-flow-personal-unlimited-v21-artifact.zip`、27,923,216 bytes | API digestと一致、`unzip -t`成功 |
| APKファイル | `app-release.apk`、51,866,186 bytes | 展開・ZIP整合性確認済み |
| APK SHA-256 | `9b753b18effc7cd8b366d190f5ab42ab877ff8dfd654f45d8d37696b6787daae` | 記録済み |
| package | `com.app.focusflow.personal` | 通常版と分離 |
| versionCode / versionName | `20` / `1.0.0` | 意図した本人用更新版 |
| APK Signature Scheme | v2あり、v1・v3なし | 合格 |
| 証明書 SHA-1 | `0D:A5:A7:0E:14:A2:A4:3A:DB:A8:F8:04:40:81:C5:B2:18:86:B5:BC` | 既知証明書と一致 |
| 証明書 SHA-256 | `7BF73C140458A45EB35858B5664207870DDB2C050C72CCE7C53C57F9DFCAB510` | 記録済み |

## 3. Manifest・Native Widget・Focus Gate契約

| 検証領域 | 実測結果 | 判定 |
|---|---|---|
| 個人用Deep Link | `manusfocusflowpersonal` schemeを宣言 | 合格 |
| Focus Gate | `FocusGateService`と`FocusGateActivity`をManifestに宣言 | 合格 |
| Widget Provider | `FocusFlowWidgetProvider`をreceiverとして宣言 | 合格 |
| リサイズbroadcast | `APPWIDGET_UPDATE_OPTIONS`を宣言 | 合格 |
| Widget provider情報 | `focus_flow_widget_initial_info`をmeta-dataとして接続 | 合格 |
| 透過・完了表示 | DEXに`widgetBackgroundOpacity`、`widgetCardOpacity`、`widgetHiddenCompletedCount`、`completed-toggle`、`colorWithOpacity`、`setBackgroundColor`を確認 | 合格 |
| テーマ・ブロック画面 | DEXに`GatePalette`を確認 | 合格 |
| 時間型・リサイズ | DEXに`timer_pause`、`responsiveWidgetViews`、`setChronometer`を確認 | 合格 |
| 旧一覧経路 | DEXに`RemoteViewsService`、`setRemoteAdapter`、`BIND_REMOTEVIEWS`、`FocusFlowWidgetItemsService`なし | 合格 |

全Vitestは**32 files / 96 passed / 1 skipped**、`pnpm check`、CIモードの`pnpm lint`は成功した。通常版versionCode 30および本人用`com.app.focusflow.personal`／versionCode 20のクリーンAndroid生成も成功している。ローカルGradleの直接コンパイルはsandboxのAndroid SDK未設定で実行できなかったが、同一コミットを入力とするGitHub Actionsのrelease署名ビルドが成功し、Kotlin・Gradle・署名を検証した。

## 4. 実機受入

| 範囲 | 主な確認内容 |
|---|---|
| V20-R01〜R07 | Widget背景／行の独立透過、Sliderのドラッグ精度、Widget完了済み表示、Pill・計数操作、全フォーム可読性、Memo保存CTA、Widgetの操作・リサイズ・同期。 |
| V21-R01〜R05 | 制限対象一覧の64dp行と選択、全テーマ可読性、遮断画面のテーマ連動・再遮断・Today遷移、通常／厳格モード、cold／warm startのフルスクリーン導入。 |

> v20／v21は**暫定実機検証版**である。すべての実機受入が合格するまで、正式配布・Google Play配布・公開は実施しない。

## References

[1]: https://github.com/forcusflow-lab/focus-flow/actions/runs/33110049736 "GitHub Actions: successful v21 personal APK build"
[2]: https://github.com/forcusflow-lab/focus-flow/commit/4d36e2475f88d54db3ca32e810dc68b4a40c29fa "GitHub: v20/v21 source commit"

# Focus Flow v17 本人用署名APKビルド記録

## 1. 対象と配布上の扱い

本記録は、設定画面からTodayとホーム画面Widgetの完了済み項目表示を**各々ワンタップで切り替えるSwitch**を追加した、本人用・制限なしAPK v17の署名ビルドについて記録する。対象のアプリIDは`com.app.focusflow.personal`であり、通常のGoogle Play版、無料上限、IAP、Play配布には影響しない。

本APKは既存の明示許可に基づく**暫定実機検証版**である。実機受入が完了するまでは正式版・Google Play配布候補とは扱わない。

| 項目 | 結果 |
|---|---|
| GitHubリポジトリ | `forcusflow-lab/focus-flow` |
| 対象ソース | [`d706c7f60e0b0a994473d0a0f843d22e99e2f30d`][2] |
| Webチェックポイント | `manus-webdev://d706c7f6` |
| ワークフロー | `Build Focus Flow personal unlimited APK` |
| 成功run | [#33064334804][1] |
| 実行結果 | **成功**（27分53秒） |
| artifact | `focus-flow-personal-unlimited-apk`（ID: `9643855855`） |
| artifact digest | `sha256:06b21cc53bec9008a6fba0ea9de30ae78cd823f7165958febff143053afa43f6` |
| artifact保持期限 | 2026-09-10 11:12:23 UTC |

## 2. 署名済みAPKの独立検証

GitHub Actions artifactをプロジェクト外の検証ディレクトリへ取得し、署名済みAPKを直接検査した。

| 検証 | 実測結果 | 判定 |
|---|---|---|
| APKファイル | `app-release.apk`、51,777,506 bytes | 取得完了 |
| ZIP整合性 | `unzip -t`成功 | 合格 |
| APK SHA-256 | `c29df319e7bfa1705e6452ba5815250a93f6aaf7ae8015b10eb18b311ceb98dc` | 記録済み |
| package | `com.app.focusflow.personal` | 通常版と分離 |
| versionCode / versionName | `17` / `1.0.0` | 意図した本人用更新版 |
| APK Signature Scheme | v2あり、v1・v3なし | 合格 |
| 証明書 SHA-1 | `0D:A5:A7:0E:14:A2:A4:3A:DB:A8:F8:04:40:81:C5:B2:18:86:B5:BC` | 既知証明書と一致 |
| 証明書 SHA-256 | `7BF73C140458A45EB35858B5664207870DDB2C050C72CCE7C53C57F9DFCAB510` | 記録済み |

## 3. Manifest・Widget契約

| 検証領域 | 実測結果 | 判定 |
|---|---|---|
| 個人用Deep Link | `manusfocusflowpersonal` schemeを宣言 | 合格 |
| Widget Provider | `FocusFlowWidgetProvider`をreceiverとして宣言 | 合格 |
| リサイズbroadcast | `APPWIDGET_UPDATE_OPTIONS`を宣言 | 合格 |
| 時間型Widget | DEXに`timer_pause`、`elapsedSeconds`、`responsiveWidgetViews`を確認 | 合格 |
| 旧一覧経路 | DEXに`RemoteViewsService`、`setRemoteAdapter`、`BIND_REMOTEVIEWS`、`FocusFlowWidgetItemsService`なし | 合格 |

`pnpm test`は27ファイル・82件合格・1件スキップ、`pnpm check`と`pnpm lint`は成功した。本人用のクリーンAndroid生成では`com.app.focusflow.personal`、versionCode 17、Widget Provider、静的RemoteViews構成を確認済みである。

## 4. 実機受入

| ID | 操作 | 合格条件 |
|---|---|---|
| V17-R01 | 設定の「完了済みの表示」でToday画面のSwitchをオン・オフにする | オンで完了済みがグレーアウト・取り消し線付きで残り、オフで非表示になる。設定を閉じて開き直しても保持する。 |
| V17-R02 | 同じ画面でWidgetのSwitchだけをオン・オフにする | Widgetだけが残す／非表示へ変わり、Todayの設定は変化しない。逆方向の組合せでも同じ。 |
| V17-R03 | 完了済み表示設定の切替後にWidgetを操作・リサイズする | 完了・復元、時間型操作、small／medium／largeの表示が維持される。 |

> v17は**暫定実機検証版**である。V17-R01〜R03の実機結果を受領するまで、正式配布・Google Play配布は実施しない。

## References

[1]: https://github.com/forcusflow-lab/focus-flow/actions/runs/33064334804 "GitHub Actions: successful v17 personal APK build"
[2]: https://github.com/forcusflow-lab/focus-flow/commit/d706c7f60e0b0a994473d0a0f843d22e99e2f30d "GitHub: v17 source commit"

# Focus Flow v18 本人用署名APKビルド記録

## 1. 対象と配布上の扱い

本記録は、Todo／Habit編集シートの安全領域対応、期限当日以前Todoの有効必須化、完了済み一時表示、Todo縦セクション、Today／Widget表示Switchの整列、およびWidgetテーマsurfaceを実装した、本人用・制限なしAPK v18の署名ビルドを記録する。対象のアプリIDは`com.app.focusflow.personal`であり、通常のGoogle Play版、無料上限、IAP、Play配布には影響しない。

本APKは既存の明示許可に基づく**暫定実機検証版**である。V18-R01〜R07の実機受入が完了するまでは、正式版・Google Play配布候補とは扱わない。

| 項目 | 結果 |
|---|---|
| GitHubリポジトリ | `forcusflow-lab/focus-flow` |
| 対象ソース | [`3ac40e5cd2b60af5042bbcdf64e5cadb345f0b73`][2] |
| Webチェックポイント | `manus-webdev://3ac40e5c` |
| ワークフロー | `Build Focus Flow personal unlimited APK` |
| 成功run | [#33071721730][1] |
| 実行結果 | **成功**（22分9秒） |
| artifact | `focus-flow-personal-unlimited-apk`（ID: `9646803898`、27,837,277 bytes） |
| artifact digest | `sha256:cb610c6042b64838371058de93e2197dd66d0d9dad413f256f02ee06eec58aee` |
| artifact保持期限 | 2026-09-10 12:46:45 UTC |

## 2. 署名済みAPKの独立検証

GitHub Actions artifactをプロジェクト外の検証ディレクトリへ取得し、artifact ZIPと署名済みAPKをそれぞれ直接検査した。artifact ZIPのSHA-256はActions APIが公開するdigestと一致し、内部のAPK 1ファイルの展開前後サイズも一致した。

| 検証 | 実測結果 | 判定 |
|---|---|---|
| artifact ZIP | `focus-flow-personal-unlimited-v18-artifact.zip`、27,837,277 bytes | `unzip -t`成功、API digestと一致 |
| APKファイル | `app-release.apk`、51,789,766 bytes | 取得完了 |
| APK ZIP整合性 | `unzip -t`成功 | 合格 |
| APK SHA-256 | `b031bd7c21c5cd1afa879a18bcab47128e778f3331af9582a8e16a538f8d5a16` | 記録済み |
| package | `com.app.focusflow.personal` | 通常版と分離 |
| versionCode / versionName | `18` / `1.0.0` | 意図した本人用更新版 |
| APK Signature Scheme | v2あり、v1・v3なし | 合格 |
| 証明書 SHA-1 | `0D:A5:A7:0E:14:A2:A4:3A:DB:A8:F8:04:40:81:C5:B2:18:86:B5:BC` | 既知証明書と一致 |
| 証明書 SHA-256 | `7BF73C140458A45EB35858B5664207870DDB2C050C72CCE7C53C57F9DFCAB510` | 記録済み |

## 3. Manifest・Widget契約

| 検証領域 | 実測結果 | 判定 |
|---|---|---|
| 個人用Deep Link | `manusfocusflowpersonal` schemeを宣言 | 合格 |
| Widget Provider | `FocusFlowWidgetProvider`をreceiverとして宣言 | 合格 |
| リサイズbroadcast | `APPWIDGET_UPDATE_OPTIONS`を宣言 | 合格 |
| Widget provider情報 | `focus_flow_widget_initial_info`リソースをmeta-dataとして接続 | 合格 |
| 時間型Widget | DEXに`timer_pause`、`elapsedSeconds`、`responsiveWidgetViews`、`setChronometer`を確認 | 合格 |
| 完了済み一時表示 | DEXに`widgetHiddenCompletedCount`を確認 | 合格 |
| テーマ・レール資産 | 公開リソース表に6テーマ×light／darkの12 surface、初期layout、Chronometer ID、アクセントレールIDを確認 | 合格 |
| 旧一覧経路 | DEXに`RemoteViewsService`、`setRemoteAdapter`、`BIND_REMOTEVIEWS`、`FocusFlowWidgetItemsService`なし | 合格 |

`pnpm test`は29ファイル・89件合格・1件スキップ、`pnpm check`とCIモードの`pnpm lint`は成功した。通常版のversionCode 28および本人用`com.app.focusflow.personal`／versionCode 18のクリーンAndroid生成では、Widget Provider、12 theme surface、完了済み導線、静的RemoteViews禁止構造不在を確認済みである。

## 4. 実機受入

| ID | 操作 | 合格条件 |
|---|---|---|
| V18-R01 | Todo・Habitの長い編集シートを最下部までスクロールし、ソフトキー表示中にも保存する | 保存CTAがナビゲーションバーやキーボードと重ならず、常にタップ可能。 |
| V18-R02 | 期限が今日・期限超過・期限翌日のTodoを、標準／大きい文字・light／darkで表示する | `今日まで`、期限超過、日付が切れず、期限当日以前の2件だけが必須Pill・集中制限・Today・Widgetで同じ扱い。 |
| V18-R03 | 全テーマでToday、Todo、Habit、設定、編集シート、Widgetを確認する | 文字、選択肢、完了状態、必須Pill、無効状態、境界が背景と判別でき、固定ライト面・不可視文字がない。 |
| V18-R04 | Widgetをsmall／medium／largeで表示する | ヘッダーとmini-cardがともに角丸で、アクセントレールがカード外へはみ出さず、テーマがカード・見出し・本文・操作へ一貫して反映される。 |
| V18-R05 | Todo／Habitを完了・復元し、Todoタブを確認する | 順番が不意に入れ替わらず、未完了が上、完了が下の縦セクションになる。 |
| V18-R06 | Today、Todo、Widgetで完了表示を`非表示`にし、完了済みを一時表示する | 「完了済みを表示」入口から即時に確認でき、保存済みの`非表示`設定や他画面の設定は変わらない。 |
| V18-R07 | Today／Widgetの表示Switchをそれぞれ切り替える | 64dp行・状態文言・Switch配置が揃い、片方の切替が他方の表示設定を変更しない。 |

> v18は**暫定実機検証版**である。V18-R01〜R07の実機結果を受領するまで、正式配布・Google Play配布・公開は実施しない。

## References

[1]: https://github.com/forcusflow-lab/focus-flow/actions/runs/33071721730 "GitHub Actions: successful v18 personal APK build"
[2]: https://github.com/forcusflow-lab/focus-flow/commit/3ac40e5cd2b60af5042bbcdf64e5cadb345f0b73 "GitHub: v18 source commit"

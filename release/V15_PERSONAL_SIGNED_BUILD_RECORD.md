# Focus Flow v15 本人用署名APKビルド記録

## 1. 対象と配布上の扱い

本記録は、時間型Habitの一時停止／再開、予定時刻前の手動完了／復元、Widgetの個別mini-card・必須先頭表示・時間計測操作を含む、**本人用・制限なしAPK v15** の署名ビルドを記録する。対象APKは通常のGoogle Play版と異なる`com.app.focusflow.personal`であり、通常版の無料上限・IAP・Play公開へ影響しない。

この成果物は、利用者が既に許可した例外の範囲でのみ**暫定実機検証版**として扱う。V15-R01〜R05の実機受入前であり、正式配布・Google Playアップロード・公開の根拠にはしない。

| 項目 | 結果 |
|---|---|
| GitHubリポジトリ | `forcusflow-lab/focus-flow` |
| 対象ソース | [`dcf90208475914cbe4c74b418311271f6b145095`][2] |
| Webチェックポイント | `manus-webdev://dcf90208` |
| ワークフロー | `Build Focus Flow personal unlimited APK` |
| 成功run | [#33048834376][1] |
| 結果 | **成功**（26分53秒） |
| artifact | `focus-flow-personal-unlimited-apk`（ID: `9637444714`） |
| artifact SHA-256 | `af25e4e2971dc28ba0f7e29c2c4d7ca0248167c2a92fea3e027d3aaf95acb689` |
| artifact保持期限 | 2026-09-10 07:40:11 UTC |
| APKファイル | `app-release.apk` |

初回run [#33046847439][3] は`FocusFlowWidgetProvider.kt:267`における`kind`の宣言前参照によりKotlinコンパイルが失敗しており、APKは生成されなかった。該当参照を是正して全自動検査とクリーン生成を再実行した後の、上記成功runだけを本記録の根拠とする。

## 2. APK独立検証

GitHub Actions artifactをプロジェクト外の検証ディレクトリへ取得し、ソースツリー・生成ディレクトリではなく**署名済みAPKそのもの**を検査した。

| 検証 | 実測結果 | 判定 |
|---|---|---|
| APKサイズ | 51,784,930 bytes | 取得完了 |
| ZIP整合性 | `unzip -t` 成功 | 合格 |
| APK SHA-256 | `7d9b541615ea0046610ce4d5945e72b0370d1cb151587b1f56a75c7d9eb48616` | 記録済み |
| Android package | `com.app.focusflow.personal` | 通常版と分離 |
| versionCode / versionName | `15` / `1.0.0` | 意図した本人用更新版 |
| APK Signature Scheme | v2署名あり、v1・v3なし | 合格 |
| 証明書 SHA-1 | `0D:A5:A7:0E:14:A2:A4:3A:DB:A8:F8:04:40:81:C5:B2:18:86:B5:BC` | 既知証明書と一致 |
| 証明書 SHA-256 | `7BF73C140458A45EB35858B5664207870DDB2C050C72CCE7C53C57F9DFCAB510` | 記録済み |

## 3. マニフェスト・Widget・実装契約

署名APKからマニフェストおよびコンパイル済みリソースを復号し、個人用scheme、Widget Provider、サイズ対応およびv15固有の実装契約を確認した。

| 検証領域 | 実測結果 | 判定 |
|---|---|---|
| 個人用Deep Link | `manusfocusflowpersonal` schemeを宣言 | 合格 |
| Widget Provider | `FocusFlowWidgetProvider`をreceiverとして宣言 | 合格 |
| リサイズbroadcast | `APPWIDGET_UPDATE`および`APPWIDGET_UPDATE_OPTIONS`を登録 | 合格 |
| Widget metadata | `focus_flow_widget_initial_info`を解決 | 合格 |
| サイズ範囲 | 最小130×102dp、最大530×450dp、水平・垂直リサイズ可 | v13のリサイズ経路を維持 |
| 初期レイアウト | 復号済みXMLは`FrameLayout`・`LinearLayout`・`TextView`・`ImageView`のみで構成 | 静的RemoteViews互換 |
| 禁止構造 | 初期layoutに生`View`、`ListView`、`layout_weight`、0dp寸法なし | 合格 |
| mini-card資産 | light/darkの通常・必須・完了、開始、light/dark停止の9 drawableを公開リソース表で確認 | 合格 |
| 時間型操作 | DEXに`timer_pause`および`elapsedSeconds`を確認 | 合格 |
| 旧一覧経路 | DEXに`RemoteViewsService`、`setRemoteAdapter`、`BIND_REMOTEVIEWS`、`FocusFlowWidgetItemsService`なし | 合格 |

## 4. 修正後の自動品質ゲート

Kotlin修正後に、`pnpm test`、`pnpm check`、`pnpm lint`、本人用クリーンAndroid生成を実行した。結果は**26テストファイル・79件合格・1件スキップ**、TypeScript成功、Lint成功、`FOCUS_FLOW_PERSONAL_UNLIMITED=1`での`expo prebuild --clean --platform android`成功である。クリーン生成後のProviderには`kind`の先行取得と`elapsedSeconds`の受け渡しが存在することも再確認した。

## 5. 実機受入が必要な項目

ビルド・署名・静的検証は、端末上の操作、Widgetホストの描画、AsyncStorage復元を代替しない。APKを既存の本人用Focus Flowへ**上書きインストール**した上で、次のv15受入を完了する必要がある。

| ID | 操作 | 合格条件 |
|---|---|---|
| V15-R01 | 本体Habit／Todayで時間型Habitを開始→少し待機→停止→待機→再開する | 停止中は秒数が増えず、再開後は保存済み秒数から継続する。画面切替・アプリ再起動後も状態を保持する。 |
| V15-R02 | 未開始・計測中・一時停止で、行頭チェックを押して完了／復元する | 予定時間前でも対象だけの状態が変わり、詳細画面を開かない。 |
| V15-R03 | Widgetから時間型Habitを開始→停止→再開し、本体を開く | 本体と経過・状態が同期し、計測操作がToday遷移に誤判定されない。Widgetのチェックも完了／復元する。 |
| V15-R04 | 必須・非必須のTodo／HabitをWidgetに混在表示する | `必須`Pillはタイトル先頭で全文表示され、非必須行にはPillがない。TodoとHabitがmini-card・補足・アクセントで区別できる。 |
| V15-R05 | Widgetをsmall／medium／largeへ順にリサイズし、ライト／ダークを切り替える | 1／2／3行への変化、カード可読性、操作後・本体同期後のサイズ維持を確認する。 |

> v15は**暫定実機検証版**である。実機受入が完了するまでは「修正済み」「正式版」とは扱わず、Google Playのトラックへのアップロードも実施しない。

## References

[1]: https://github.com/forcusflow-lab/focus-flow/actions/runs/33048834376 "GitHub Actions: successful v15 personal APK build"
[2]: https://github.com/forcusflow-lab/focus-flow/commit/dcf90208475914cbe4c74b418311271f6b145095 "GitHub: v15 Kotlin-fix source commit"
[3]: https://github.com/forcusflow-lab/focus-flow/actions/runs/33046847439 "GitHub Actions: failed initial v15 personal APK build"

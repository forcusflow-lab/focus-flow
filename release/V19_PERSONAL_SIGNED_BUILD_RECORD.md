# Focus Flow v19 本人用署名APKビルド記録

## 1. 対象と配布上の扱い

本記録は、期限当日以前Todoの必須自動選択、Todo完了基準の単純化、画面内完了表示切替、テーマ統一、フラット連続Widget、背景・項目行の二層透過設定を実装した本人用・制限なしAPK v19の署名ビルドを対象とする。アプリIDは`com.app.focusflow.personal`であり、通常のGoogle Play版、無料上限、IAP、Play配布には影響しない。

> 本APKは利用者の明示許可に基づく**暫定実機検証版**である。V19-R01〜R07の実機受入が完了するまでは、正式版・Google Play配布候補として扱わない。

| 項目 | 結果 |
|---|---|
| GitHubリポジトリ | `forcusflow-lab/focus-flow` |
| 対象ソース | [`2c970a00eacb184b97928274fd2ac002f1a9eda3`][2] |
| Webチェックポイント | `manus-webdev://2c970a00` |
| ワークフロー | `Build Focus Flow personal unlimited APK` |
| 成功run | [#33082614911][1] |
| Job | `98553629891`、全step成功 |
| 実行結果 | **成功**（27分22秒） |
| artifact | `focus-flow-personal-unlimited-apk`（ID: `9651798648`、27,825,384 bytes） |
| artifact digest | `sha256:67ebadabf7d2a2089eb293f6c7d552183337dd5b910c65dce9b46bd42285bf37` |
| artifact保持期限 | 2026-09-10 14:57:46 UTC |

## 2. 署名済みAPKの独立検証

GitHub Actions artifact ZIPをプロジェクト外の検証ディレクトリへ取得し、ZIPと署名済みAPKをそれぞれ直接検査した。artifact ZIPのSHA-256はGitHub APIのdigestと一致し、ZIP整合性、APK整合性、package、versionCode、署名方式、既知証明書を確認した。

| 検証 | 実測結果 | 判定 |
|---|---|---|
| artifact ZIP | `focus-flow-personal-unlimited-v19-artifact.zip`、27,825,384 bytes | SHA-256がAPI digestと一致、`unzip -t`成功 |
| APKファイル | `app-release.apk`、51,768,682 bytes | 展開・ZIP整合性確認済み |
| APK SHA-256 | `19df2697f227875504816d110cfaac524f80a97353677cb48b4aa9cfb574a927` | 記録済み |
| package | `com.app.focusflow.personal` | 通常版と分離 |
| versionCode / versionName | `19` / `1.0.0` | 意図した本人用更新版 |
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
| フラットWidget | 52dp見出し、48dp連続行、1dp divider、small／medium／largeの1／2／3行設計を生成物とDEXで確認 | 合格 |
| 二層透過 | DEXに`widgetBackgroundOpacity`、`widgetCardOpacity`、`setBackgroundColor`の経路を確認 | 合格 |
| 時間型Habit | DEXに`timer_pause`、`elapsedSeconds`、`responsiveWidgetViews`、`setChronometer`を確認 | 合格 |
| 完了済み一時表示 | DEXに`widgetHiddenCompletedCount`を確認 | 合格 |
| 旧一覧経路 | DEXに`RemoteViewsService`、`setRemoteAdapter`、`BIND_REMOTEVIEWS`、`FocusFlowWidgetItemsService`なし | 合格 |

全Vitestは**30 files / 88 passed / 1 skipped**、`pnpm check`、CIモードの`pnpm lint`は成功した。通常版versionCode 29および本人用`com.app.focusflow.personal`／versionCode 19のクリーンAndroid生成も成功している。

## 4. 実機受入

| ID | 実機操作 | 合格条件 |
|---|---|---|
| V19-R01 | 期限を今日・過去・未来・未設定へ切り替え、Todoフォームと各一覧を確認する | 今日・過去では必須チェックが自動オン、未来・未設定では手動必須だけがオンとなり、Pill・Today・Widget・集中制限が一致する。 |
| V19-R02 | 6テーマ×light／darkでToday・Todo・Habit・設定・フォーム・Widgetを確認する | 背景、行面、本文、補足、必須、完了、accentの役割が一貫し、色が不自然に混在せず全て読める。 |
| V19-R03 | Widgetをsmall／medium／largeで確認する | 52dp見出し、角丸なし・隙間なしの連続行、一定位置のチェック・Pill・タイトル・補足、1／2／3行が崩れず表示される。 |
| V19-R04 | Today／Todo／Habitで完了済み表示を切り替え、Widgetヘッダーをタップする | 各画面で`完了済みを表示`／`完了済みを非表示`を直接操作でき、保存設定を探す必要がなく、WidgetからTodayの一時表示を開ける。 |
| V19-R05 | Todoの作成・編集・完了・復元を行う | Todoは完了チェックだけで操作でき、Habit専用の回数・時間・曜日・連続記録の条件がTodoに現れない。 |
| V19-R06 | Widget設定の二本のスライダーを0%、50%、100%へ動かす | 背景と項目行が別々に10%単位で変化し、見出しは背景と連動、本文・チェック・Pillはどの値でも判読できる。 |
| V19-R07 | WidgetでTodo／Habitを操作し、サイズ変更・本体再起動後を確認する | 完了・復元・回数・開始／停止、1／2／3行、テーマ・透過率が正しい項目だけに反映され、行や状態が混線しない。 |

## References

[1]: https://github.com/forcusflow-lab/focus-flow/actions/runs/33082614911 "GitHub Actions: successful v19 personal APK build"
[2]: https://github.com/forcusflow-lab/focus-flow/commit/2c970a00eacb184b97928274fd2ac002f1a9eda3 "GitHub: v19 source commit"

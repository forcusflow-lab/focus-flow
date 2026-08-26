# Focus Flow v12 実機不合格是正記録

## 背景と判定

本人用v11の実機画像では、Todo・Habit・Todayの必須Pillが`必`に切れ、Widgetも目標とするコンパクトな単一リストカードより過大で、Pill／補足の可読性が不足していた。したがってv11は実機不合格として固定し、v12では表示トークンの存在ではなく、**親幅・実ランチャーサイズ・実際の描画文字列**を受入対象とした。

## v12設計

| 対象 | v11で残った問題 | v12の対策 | 受入条件 |
|---|---|---|---|
| Todo / Habit / Today | 必須が`必`に切れる | 共通Pillを76dp幅・32dp高へ拡張し、文字は省略なしの直接Text描画に変更。各カードで84dpの専用Pill枠を確保 | 日本語・英語・3文字サイズで`必須`／`Must-do`が全文表示される |
| Android 12以降Widget | MIN/MAX推定だけではランチャーの実サイズが不安定 | `OPTION_APPWIDGET_SIZES`の`SizeF`ごとにRemoteViewsを生成し、公式のresponsive mappingとして更新 | 小・標準・大で1/2/3行が実際に切り替わる |
| Widgetカード | `match_parent`カードが大きな空白面を作る | 外側はホスト領域のまま、カードは上部配置・内容高`wrap_content`へ変更 | Widgetが余白を残すコンパクトな単一リストカードになる |
| Widget行 | 48dp行・横並びの必須/時間帯で密度と可読性が競合 | ヘッダー38dp、行44dp、操作44dp・視覚チェック22dpへ圧縮。必須がある行では時間帯補足を非表示にして必須を優先 | 最大3行、必須Pill、タイトル、丸形チェックが読める |

Android公式は、Android 12以降でMIN/MAX値から現在サイズを推定する方式には限界があるとし、少数のresponsive layoutまたは`OPTION_APPWIDGET_SIZES`に対応するexact layoutを推奨している。[1]

## 自動検証

| 検証 | 結果 |
|---|---|
| Vitest | 25 files / 76 passed / 1 skipped |
| TypeScript | `pnpm check` 成功 |
| Lint | `pnpm lint` 成功 |
| 通常版クリーン生成 | versionCode 22、Provider・`OPTION_APPWIDGET_SIZES`・44dp行・22dpチェック・42dp badge最小幅を確認 |
| 本人用クリーン生成 | `com.app.focusflow.personal` / versionCode 12、専用scheme、Provider・サイズ別RemoteViews・旧Collection経路不在を確認 |

## 実機再受入

署名済み本人用v12 APKを生成・独立検証した後、次を確認する。いずれかが不合格なら正式配布・Google Play配布へ進まない。

| ID | 操作 | 合格条件 |
|---|---|---|
| V12-R01 | Widgetを小・標準・大へ連続してリサイズ | 1/2/3行に変化し、古いレイアウトが残らない |
| V12-R02 | Todo・Habit混在のWidgetを表示 | 外側に過大な塗り面を作らず、上部の単一コンパクトカードとして表示される |
| V12-R03 | 必須Todo・HabitをToday / Todo / Habit / Widgetで確認 | `必須`が全文表示され、`必`だけにならない |
| V12-R04 | ライト/ダーク、文字サイズ小/標準/大 | タイトル、Pill、補足、チェックが判読できる |
| V12-R05 | 丸形チェック・本文をタップ | 対象だけの完了/復元と、本文の詳細遷移が区別される |

## References

[1]: https://developer.android.com/develop/ui/views/appwidgets/layouts "Android Developers: Provide flexible widget layouts"

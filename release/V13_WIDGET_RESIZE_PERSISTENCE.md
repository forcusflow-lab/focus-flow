# Focus Flow v13 Widgetリサイズ再設計

## v12実機結果からの原因分離

本体のTodo・Habit・Todayにおける`必須`Pillは、実機画像で全文表示を確認した。一方、Widgetはリサイズ操作をしても見た目が変わらないとの報告を受け、v12をWidget受入不合格とした。

| 原因候補 | v12の構成 | v13の対策 |
|---|---|---|
| ランチャーの`OPTION_APPWIDGET_SIZES`未提供または空配列 | exact-size一覧がある場合だけサイズ別RemoteViewsを構築 | Android 12+では、ランチャー一覧に依存しない3段階のresponsive `RemoteViews(Map<SizeF, RemoteViews>)`を常に更新する |
| 状態同期後の再描画 | JS→Native同期が`refreshAll`を呼び、resize callbackで選んだ表示を再利用できない | pre-Android 12ではwidgetIdごとに1/2/3行バケットを保存し、通常更新・操作後更新で復元する |
| resize通知の取りこぼし | Provider登録は通常更新だけ | `APPWIDGET_UPDATE_OPTIONS`をReceiverのintent-filterへ明示追加し、callbackではsuper呼び出し・保存・即時再描画を行う |
| 視覚上の変化不足 | カードが内容高のため、ホスト外形だけの変更が見えにくい | カードを`match_parent`へ変更してホスト高に追従させ、1/2/3行の段階で内容を追加する |

Android公式は、Android 12以降のサイズ対応として、少数のresponsive layoutの`RemoteViews`対応表を推奨し、launcherが`OPTION_APPWIDGET_SIZES`を提供しない場合があることも明示している。[1]

## サイズ対応表

| 最小対応サイズ | 表示 | 用途 |
|---|---|---|
| 130×102dp | 1行、compact header | 最小高さ |
| 130×155dp | 2行、standard header | 標準高さ |
| 130×250dp | 3行、standard header | 拡大高さ |

幅だけを広げても情報量は変えず、縦方向の領域に応じて行を追加する。これは、横幅の変化で文字を拡大して可読性を損なうのではなく、Todoと習慣の一覧階層を安定させるためである。

## 自動検証

| 検証 | 結果 |
|---|---|
| Vitest | 25 files / 76 passed / 1 skipped |
| TypeScript | `pnpm check` 成功 |
| Lint | `pnpm lint` 成功 |
| 通常版クリーンAndroid生成 | versionCode 23、resize broadcast、responsive map、サイズ保存、カード`match_parent`、旧Collection経路不在を確認 |
| 本人用クリーンAndroid生成 | `com.app.focusflow.personal` / versionCode 13、専用scheme、同一のWidget資産・resize経路を確認 |

## v13実機再受入

Widgetの行数差を視覚的に確認するため、**未完了のTodoまたは習慣を3件**用意する。実機で以下を全て満たすまで、v13を正式版・Google Play配布として扱わない。

| ID | 操作 | 合格条件 |
|---|---|---|
| V13-R01 | Widgetを最小高さまで縮小 | 1行だけ表示され、カード外形も縮小する |
| V13-R02 | Widgetを標準高さへ拡大 | 2行表示に変化し、カードがホスト領域へ追従する |
| V13-R03 | Widgetを大きく縦方向へ拡大 | 3行表示に変化し、3件目が確認できる |
| V13-R04 | リサイズ後にアプリを開く、項目を更新、Widgetで完了／復元 | 表示行数が直前のサイズから戻らず、各操作後もサイズ別表示を維持する |
| V13-R05 | Todo / Habit / Today / Widgetをライト・ダークで確認 | `必須`の全文、タイトル、チェック、カード境界が判読できる |

## References

[1]: https://developer.android.com/develop/ui/views/appwidgets/layouts "Android Developers: Provide flexible widget layouts"

# Focus Flow v16 Widget・Today整合性仕様

## 1. 改訂の背景とレビュー結論

v15の実機では、Widgetのヘッダー直下にmini-cardが詰まり、カード間隔に対してタイトル面の余白が不足することで、全体の重心が上へ寄って見えた。また、時間型Habitは開始・停止・再開の操作自体は機能する一方で、Widgetの経過値が描画時の静的値のまま固定されていた。本体は共有コントロールの1秒更新で正しく経過するため、問題はHabit状態ではなく**Widget表示の再描画方式**にある。

Todayは集中制限が有効な時間帯の解除条件を主な抽出条件にしており、ユーザーが求める「必須または期限が当日以前」という一貫した今日の対象と異なっていた。さらにToday独自の`HomeTodoCard`／`HomeHabitCard`が、Todo／Habitタブのカード内容と別に実装されているため、同じ項目でも期限・進捗・週次情報・操作の見え方が異なる。

| 実機指摘 | 根本原因 | v16の判断 |
|---|---|---|
| ヘッダーとカード群の釣り合いが悪い | 40dpヘッダー直後に最初の54dp行を配置し、カードに上余白がない | 最小102dp高でも1行を欠かさないよう、40dpヘッダーに上5dp・横7dpのインセット、最初のカード前に5dp、カード間に2dpを設ける。行高は51dpへ圧縮する。 |
| Widgetの経過数字が止まる | `TextView`へ同期時の秒数を一回だけ描画している | RemoteViewsで正式に許容される`Chronometer`を計測中にだけ使用し、ホスト側で経過表示を継続させる。[1] |
| TodoとHabitの区別が弱い | Widgetに本体の優先度／Habit色が渡されていない | 各行の左端に4dpの`TextView`アクセントレールを置き、Todoは優先度色、Habitは作成時のHabit色を同期する。 |
| 今日の対象が直感と異なる | TodayとWidgetがアクティブな集中ルール中心で抽出している | Todoは`isRequired`または未完了の期限が当日以前、Habitは`isRequired`をToday対象とする。期限当日以前のTodoは自動的に必須扱いとする。 |
| 完了済みの残し方を分けたい | Widgetだけに`widgetCompletedDisplay`が存在する | `todayCompletedDisplay`を追加し、TodayとWidgetで独立して`残す`／`非表示`を選べるようにする。 |
| Todayと各タブのカードが異なる | 画面ごとに別カードを実装している | Todo／Habitの共通カードを作り、Todayと各一覧タブで同じ内容、完了表現、進捗操作、必須Pillを使う。遷移先に応じて末尾操作だけを差し替える。 |

## 2. 状態・抽出仕様

### 2.1 有効必須状態

| 対象 | `effectiveRequired` | Todayへの表示 | 集中制限・Widget同期 |
|---|---|---|---|
| Todo（手動必須） | `isRequired = true` | 未完了、または「残す」選択時の完了済みを表示 | 必須として同期する。 |
| Todo（期限当日以前） | 未完了かつ`dueDate <= today` | 手動設定にかかわらず必須として表示 | `autoRequireDueToday`が有効なら解除条件にも含め、Widgetでは必須Pillを表示する。 |
| Todo（期限未来・通常） | false | Todayには表示しない | Widgetには表示しない。 |
| Habit（手動必須） | `isRequired = true` | 未記録、または「残す」選択時の当日記録済みを表示 | 必須として同期する。 |
| Habit（通常） | false | Todayには表示しない | Widgetには表示しない。 |

期限当日以前のTodoについて、TodayとWidgetの表示は`autoRequireDueToday`のON/OFFに左右されない。集中制限への自動追加のみは、既存設定との互換性のため当該設定を尊重する。設定画面ではこの差を「今日の表示」と「集中制限への自動追加」として混同しない。

### 2.2 完了済み表示の個別設定

| 設定キー | 対象画面 | `dim`（残す） | `hide`（非表示） | 既定値 |
|---|---|---|---|---|
| `todayCompletedDisplay` | 本体Today | 対象に該当する完了済みを未完了の後にグレーアウト・取り消し線で表示する | 完了済みをTodayから除外する | `hide` |
| `widgetCompletedDisplay` | ホーム画面Widget | 対象に該当する完了済みをWidget下部に残す | 完了済みをWidgetから除外する | `dim` |

両設定は個別に保存される。したがって、**「Widgetは残す／Todayは非表示」**と、逆の組合せのどちらも選択できる。完了済みを残す設定であっても、完了／復元チェックは対象行だけを変更する。

### 2.3 時間型HabitのWidget表示

| 状態 | メタ行 | インライン操作 | 経過表示 |
|---|---|---|---|
| 未開始 | `時間目標 00:00 / 30:00` | `開始` | 静的TextView |
| 計測中 | `計測中`＋`Chronometer / 30:00` | `停止` | `SystemClock.elapsedRealtime()`を基準にWidgetホスト上で継続更新 |
| 一時停止 | `一時停止 00:12 / 30:00` | `再開` | 保存済み秒数の静的TextView |
| 完了・復元待ち | 完了の見た目 | なし | 手動復元はチェック操作のみ |

`Chronometer`はAndroidのRemoteViewsが許容するWidgetであり、`setChronometer`は基準時刻・書式・開始状態をリモートで設定できる。[1] v16でも`RemoteViewsService`、`ListView`、生`View`、`layout_weight`、0dp寸法、`setFloat`／`setAlpha`を使わない。

## 3. レイアウト仕様

Widgetは背景面、ヘッダー、mini-card群の3層を維持し、各mini-cardを「一つの小さなタスク面」として読む構成にする。

| 要素 | v15 | v16 |
|---|---|---|
| ヘッダー | 40dp、全幅、カード直結 | 40dpを維持し、横7dp・上5dpのインセットでカード群と視覚的に分離する。 |
| 最初のカード前 | なし | 5dp。タイトル面からカード群への呼吸を作る。 |
| mini-card | 54dp、横5dp | 51dp、横7dp。操作領域は44dpを維持する。 |
| カード間 | 3dp＋1dp divider | 2dp。独立面の区別を保ちながら密度を上げる。 |
| 左端アクセント | なし | 4dp、Todo優先度色またはHabit色。完了後も種別・カテゴリの手がかりとして保持する。 |
| タイトルと補足 | 必須Pill、タイトル、メタ | 同じ階層を維持し、時間型の計測中のみ`Chronometer`へ切り替える。 |

## 4. Today／一覧カード統一

`TodoCard`と`HabitCard`を共通部品として実装する。各画面は、表示対象と末尾の遷移／削除操作だけを渡す。カードに表示する主情報、必須Pill、期限、進捗、週次ドット、時間型操作、完了済み表現は共通化する。

| 項目 | Todoタブ | Habitタブ | Today |
|---|---|---|---|
| 必須Pill | 同一 | 同一 | 同一 |
| 期限・期限超過 | 同一 | 該当なし | Todoタブと同一 |
| 進捗・サブタスク | 同一 | 該当なし | Todoタブと同一 |
| 週次・連続記録・日別ドット | 該当なし | 同一 | Habitタブと同一 |
| 時間型開始／停止／再開 | Todo仕様 | Habit仕様 | 各タブと同一 |
| 完了済み | 同一のグレーアウト・取り消し線 | 同一 | `todayCompletedDisplay=dim`のとき同一 |

## 5. テスト計画と受入基準

| ID | 層 | 操作または検査 | 合格条件 |
|---|---|---|---|
| V16-A01 | 単体 | 期限昨日・今日・明日・期限なし、手動必須のTodoを抽出する | 昨日／今日は有効必須、明日／期限なしの通常TodoはTodayとWidgetに出ない。 |
| V16-A02 | 単体 | Today／Widgetの`dim`／`hide`を組み合わせる | TodayとWidgetが互いの表示設定を変更せず、完了済みをそれぞれ正しく残す／隠す。 |
| V16-A03 | 静的契約 | Widget XML・Providerを検査する | 40dpヘッダー、51dp行、5dp先頭余白、2dp間隔、4dpアクセント、`Chronometer`、禁止構造不在を確認する。 |
| V16-A04 | 静的契約 | Widgetの時間型状態を検査する | `setChronometer`、`SystemClock.elapsedRealtime`、開始／停止／再開の切替と保存経過値を確認する。 |
| V16-A05 | 統合 | Todayと各タブのカード実装を比較する | 共通カードを使用し、Todo／Habitの必須・メタ・進捗・完了状態が同じになる。 |
| V16-R01 | 実機 | Widgetをsmall／medium／largeにし、1／2／3行を確認する | ヘッダーとカード群の間に余白があり、カード同士は過度に離れず、切れ・重なり・過大な空白がない。 |
| V16-R02 | 実機 | Widgetで時間型Habitを開始→15秒待機→停止→15秒待機→再開する | 計測中だけ秒数が進み、停止中は固定、再開時は保存済み値から進む。本体の状態と一致する。 |
| V16-R03 | 実機 | 高・中・低優先度Todoと色の異なるHabitをWidgetに表示する | 左4dpアクセントが本体の優先度／Habit色と対応し、ライト／ダークで区別できる。 |
| V16-R04 | 実機 | 期限昨日／今日／明日、必須／通常、完了済みを混在させる | TodayとWidgetには必須・期限昨日・期限今日だけが出て、期限昨日／今日には必須Pillが出る。 |
| V16-R05 | 実機 | Todayを非表示、Widgetを残す（逆も）に設定し、完了／復元する | 2つの表示設定が独立し、完了・復元後の表示が各設定どおりになる。 |
| V16-R06 | 実機 | 同一Todo／HabitをTodayと各タブで見る | 主情報・進捗・必須Pill・時間型操作・完了表現が一致する。 |

> 実機のV16-R01〜R06が受入されるまでは、v16を正式版・Google Play配布候補として扱わない。本人用署名APKは、署名・独立検証後に限り暫定実機検証用として扱う。

## 6. 実装・自動検証の記録

| 検証 | 結果 |
|---|---|
| 共通カード | `TodoItemCard`と`HabitItemCard`を追加し、Today／Todo／Habitタブで同じカード実装を使用するよう変更。 |
| Today対象 | 手動必須または期限が当日以前のTodo、手動必須Habitだけを対象とし、期限当日以前のTodoを有効必須として表示する実装へ変更。 |
| 完了済み設定 | `todayCompletedDisplay`を追加。TodayとWidgetで`残す`／`非表示`を独立して保存・復元する。 |
| Widgetレイアウト | 40dpヘッダー＋上5dp、51dp mini-card、2dp間隔、4dpアクセントレール、静的RemoteViewsの`Chronometer`へ変更。 |
| 全回帰 | 27テストファイル、82件合格、1件スキップ。v16対象の期限当日以前・共通カード・Chronometer・禁止構造を含む。 |
| 型・Lint | `pnpm check`、`pnpm lint`成功。 |
| Androidクリーン生成 | 通常版（versionCode 26）と本人用（`com.app.focusflow.personal`／versionCode 16）で成功。Provider、Chronometer、アクセントレール、51dp行、禁止構造不在を確認。 |

GitHub Actions run 33061080251でKotlinコンパイル・release署名・artifact保存まで成功し、APK本体の独立検証も完了した。詳細は`release/V16_PERSONAL_SIGNED_BUILD_RECORD.md`を参照する。この時点で残る品質ゲートは、V16-R01〜R06の端末受入である。

## References

[1]: https://developer.android.com/reference/android/widget/RemoteViews "Android Developers: RemoteViews"

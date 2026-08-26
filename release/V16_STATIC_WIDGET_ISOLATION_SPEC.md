# Focus Flow v16 / 本人用v6 静的Widget原因分離仕様

**記録日:** 2026-08-26  
**対象:** 本人用v5でも継続したWidget本文領域の「ウィジェットを追加できませんでした」  
**目的:** 追加済みWidgetのヘッダーは描画される一方、アプリ同期後の本文領域だけがランチャーのエラー表示へ置換される症状について、Collection `ListView`・`RemoteViewsService`を配布APKから除外して原因を分離する。

## 1. 事実と判断

v5では`initialLayout`、`layout_weight`、`0dp`高さ、追加直後のCollection切替を見直したが、実機では見出しと状態表示は残り、一覧本文だけにランチャーの失敗表示が現れた。この表示位置は、アプリ同期後にProviderがCollection Adapterを設定し、ホームアプリ側が`RemoteViewsService`をbind・inflateする経路で失敗しているという仮説と整合する。

Android公式資料では、WidgetはProvider metadata、`AppWidgetProvider`、XMLの初期layoutで構成され、Widget layoutは`RemoteViews`がサポートするViewに制限されると説明している。また、Collectionのデータ更新は通常のfull updateと異なる経路である。[1] [2]

> Widget追加の合否が未確定の間は、高密度Collection、スクロール、全件表示よりも、ランチャーに安全に配置できることを優先する。

## 2. v6静的Widget契約

| 観点 | v5 | v6 |
|---|---|---|
| Widget本文 | `ListView` + `RemoteViewsService` | Provider内の静的RemoteViewsだけ |
| 生成Manifest | `BIND_REMOTEVIEWS` serviceを登録 | serviceを除外 |
| 初回追加・同期後 | 異なる静的／Collection経路 | 同一の静的layoutを使用 |
| 表示件数 | スクロールで可変 | Todo／習慣を合計最大2件 |
| 行の操作 | fill-in Intent template | 行本文と48dpチェック領域の個別PendingIntent |
| 失敗時 | Collection hostの失敗表示へ置換され得る | Provider例外時も静的初期面とToday遷移を維持 |

v6は機能を最終形へ戻すリリースではない。Widgetが追加・更新できるという土台を実機で確定するための**原因分離ビルド**である。追加成功後に、静的行数の増加、表示優先順位、操作・復元の再受入を行い、Collection復帰はログと端末互換性を根拠に別設計レビューで判断する。

## 3. 実装要件

静的layoutは`FrameLayout`、固定36dpヘッダー、最大2行の48dp行、`match_parent`、明示マージンだけを使う。`ListView`、`RemoteViewsService`、`setRemoteAdapter`、`setPendingIntentTemplate`、`notifyAppWidgetViewDataChanged`、`layout_weight`、`0dp`高さを含めない。各行の本文は該当Todo／習慣詳細を開き、48dpのチェック領域は完了／復元だけを行う。本文色はライト`#13251F`／`#4E655B`、ダーク`#F4FBF7`／`#B7CCC2`を維持する。

## 4. 受入基準

| ID | 実機操作 | 合格条件 |
|---|---|---|
| S-01 | v6をv5へ上書きし、ホーム画面からWidgetを追加する | エラー表示がなく、ヘッダーと空状態または最大2行が描画される |
| S-02 | Focus Flowを開いてからホームへ戻る | 本文領域がランチャーの失敗表示へ置換されず、最大2行が更新される |
| S-03 | 行本文・チェック領域・ヘッダーを押す | 詳細、完了／復元、Todayが混線しない |
| S-04 | ライト／ダークと文字サイズ3段階を試す | 本文・補足・必須・時間帯・チェックが読め、重ならない |

S-01またはS-02が再び不合格なら、端末名、Androidバージョン、ホームアプリを記録し、可能なら`adb logcat`から`AppWidgetHost`、`RemoteViews`、`InflateException`を含む行を取得する。この場合、Collectionではなく静的layoutそのもの／Provider metadata／ランチャー互換性を調査対象に絞る。

## References

[1]: https://developer.android.com/develop/ui/views/appwidgets "Create a simple widget | Android Developers"
[2]: https://developer.android.com/develop/ui/views/appwidgets/advanced "Create an advanced widget | Android Developers"

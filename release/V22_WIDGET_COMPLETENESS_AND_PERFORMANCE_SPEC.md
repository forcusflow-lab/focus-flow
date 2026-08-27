# Focus Flow v22 Widget完全性・操作・性能仕様

## 1. 背景と目的

v21実機で、Widgetの必須Pillが本体と異なる角形に見えること、Today対象の一部がWidgetに見えないこと、開始／回数操作に行透過が反映されないこと、Widget内の完了済み表示切替が明確でないこと、制限対象一覧の識別性が十分でないことを確認した。また、アプリ全体の反応が重く感じられるとの報告がある。

v22では、**Widgetで表示できる情報の完全性と制約を明示し、操作の視認性とタップ可能性を両立する**。さらに、一覧・Widget同期・起動における不必要な再描画と更新を測定・抑制する。React Nativeは大きい一覧に対して、軽量な行、安定key、メモ化、適切な仮想化設定を推奨している。[1] Android Widgetでは完全な`RemoteViews`更新は高コストであり、必要な操作時に限定した更新を行う必要がある。[2] 起動改善では、最初の表示を妨げない処理を遅延し、TTID／TTFDとフレームを計測する。[3]

## 2. Widget表示と状態設計

| 領域 | v22の設計 |
|---|---|
| 必須Pill | 本体と同じ**楕円形**の`必須`Pillを使う。テーマごとにPill面と文字を対で決め、角形・固定白面・文字切れを残さない。 |
| Today対象 | 未完了の手動必須Habit、未完了の手動必須Todo、未完了の期限当日以前Todoを候補にする。Widgetの完了済み表示がオンなら、同じ安定順序で完了済みTodo／Habitも候補に含める。 |
| サイズ別件数 | static RemoteViews制約を維持し、small／medium／largeは1／2／3行で表示する。候補が行数を上回る場合は、先頭から不意に切り捨てるのではなく、見出しに`ほか n 件`を出し、`すべて表示`でTodayの該当状態を開く。 |
| 完了済み表示 | ヘッダーの44dp以上の専用操作で、Widget内の`完了を表示`と`完了を非表示`を切り替える。切替状態はWidgetごとに保存し、再描画・サイズ変更・本体再起動で保持する。Todayの一時表示への遷移は別のヘッダー領域に分離する。 |
| 操作面 | 時間Habitの開始／停止、回数Habitの減算／増算は、背景・枠・文字すべてに行の透過率を反映する。操作は44dp以上、主行より強いコントラスト、隣接操作間8dp以上、種類を区別する文字／記号で構成する。 |

## 3. 制限対象アプリ一覧

アプリアイコンが取得可能な場合は先頭に32dpのアイコンを置き、取得できない場合は一定幅のテーマ色タイルとアプリ名の先頭文字を表示する。名称は主情報として16sp前後、package名は補足として12sp前後に固定し、選択操作と状態表示を末尾に揃える。行の選択状態だけでなくアイコン／タイル、名称、補足、末尾チェックの組合せで判別できるようにする。

## 4. 性能測定と軽量化方針

| 測定対象 | 測定・検査方法 | 改修方針 |
|---|---|---|
| 制限対象一覧 | 表示件数、行key、render関数参照、初期描画件数を静的契約で検査し、実機では100件以上の検索・スクロールを受入する | `FlatList`の仮想化、安定`keyExtractor`、`useCallback`、メモ化された行、固定行高の`getItemLayout`を使う。 |
| Widget同期 | Native payloadの内容ハッシュと更新回数をdebug計測し、同一状態の更新が連続しないことを契約化する | 設定スライダーは指を離した時だけ永続化・同期し、同じpayloadではNative更新を行わない。Widget操作・実データ変更は即時反映する。 |
| 起動導入 | 初期表示前に走る非必須処理、資産寸法、導入アニメーション時間を確認する | 起動ロゴは最適化済み小サイズを維持し、初回フレーム後まで不要な一覧・同期・分析を遅延する。 |
| 描画負荷 | Today／Todo／Habitの派生配列とWidget同期の発火契機を確認する | `useMemo`で派生値を安定化し、秒更新中の時間Habitが無関係な一覧・Widget同期を再描画しないよう分離する。 |

## 5. 実装レビューと反映状況

| 項目 | 実装内容 | 検証状況 |
|---|---|---|
| 必須Pill | `mist`、`slate`、`evergreen`、`ocean`、`orchid`、`sunrise`のlight/dark計12種のAndroid shapeを追加し、全て`999dp`半径の楕円背景へ統一した。 | リソース存在・プラグインコピー・形状を自動検査済み。 |
| Widget候補 | 有効必須Todo/Habitの未完了・完了を同一payloadに送信し、`kind:id`単位で重複除外してstable orderで並べる。サイズごとの1/2/3行上限を超える数は見出しの`ほかn件`で通知する。 | 候補組成・安定順序・overflow契約を自動検査済み。 |
| 完了済みの表示 | `widgetShowCompleted:<widgetId>`を優先し、既存の共通設定は後方互換fallbackとして利用する。切替PendingIntentにもWidget IDを持たせ、削除時には個別キーを消去する。 | Widget ID・切替文言・PendingIntent extraを自動検査済み。 |
| 操作面 | 回数の`− / 現在値 / +`と時間Habitの開始・停止を、行と同一の透過率でprimary soft面へ描画し、行と操作だけが別の不透明度で残る状態を解消した。 | 背景計算・RemoteViews更新経路を自動検査済み。実機でV22-R04を要確認。 |
| 制限アプリ一覧 | 実アイコンを安全に取得するNative APIは現時点で未導入のため、テーマ色の先頭文字タイル、16spの名称、補足package名、末尾状態を72dp行に整理した。`FlatList`の仮想化・固定行高・検索・選択済み先頭表示を導入した。 | TypeScript・静的契約を検査済み。100件実機のV22-R05を要確認。 |
| 軽量化 | 同一シリアライズ済みNative stateは書込みとWidget refreshを省略し、時間型Habitの1秒更新は実行中のものがある時だけ開始する。 | Native/Providerの静的契約を自動検査済み。体感性能はV22-R06で要確認。 |

自動検証では、`pnpm test`が**33 files / 100 passed / 1 skipped**、`pnpm check`、`CI=1 pnpm lint`、`git diff --check`が成功した。通常版および本人用構成の`expo prebuild --clean --platform android`では、12種のPill drawable、Provider、通常版versionCode 31、本人用versionCode 21、個人用package/schemeの生成を確認済みである。GitHub Actionsでの署名APKコンパイル、成果物の独立検証、実機受入はまだ完了していない。

## 6. テスト計画

| 区分 | ケース | 合格条件 |
|---|---|---|
| Widget候補 | 手動必須Todo／Habit、今日期限、期限超過、翌日期限、完了済み、0〜5件 | 候補判定がTodayと一致し、サイズ上限を超える件数は`ほか n 件`と`すべて表示`で説明される。 |
| Widget操作 | light／dark×6テーマ、背景／行透過0%／50%／100%、開始／停止、回数±、完了表示切替 | Pillが楕円・可読、操作がタップ可能、透過・状態が正しいWidgetだけへ反映される。 |
| 制限一覧 | アイコンあり／なし、日英長文、package長文、0／1／100件、検索、選択／解除 | 一覧の識別子とテキストが揃い、スクロールと検索で操作が遅延・混線しない。 |
| 性能回帰 | 同一payload連続同期、Sliderドラッグ、時間Habit毎秒更新、cold／warm start | 冗長なNative更新や永続化がなく、主要操作で表示の遅延・不必要な再描画が起きない。 |

## 7. 実機受入基準

| ID | 実機操作 | 合格条件 |
|---|---|---|
| V22-R01 | 本体とWidgetを全テーマで並べ、必須Todo／Habitを確認する | `必須`が同じ楕円形・テーマ整合色で完全表示される。 |
| V22-R02 | Today対象を5件以上作り、Widgetをsmall／medium／largeへ変更する | 1／2／3行の候補が正しく出て、収まらない対象は`ほか n 件`と`すべて表示`で確認できる。 |
| V22-R03 | Widgetで完了済み表示を表示／非表示へ切り替え、サイズ変更・本体再起動を行う | 表示切替がWidget内で明確にでき、選択状態と対象が保持される。 |
| V22-R04 | 背景／行透過を0%／50%／100%にして開始・停止・回数±を操作する | 操作面にも適切な透過と境界が反映され、誤タップなく読める。 |
| V22-R05 | 制限対象アプリを多数表示・検索・選択し、light／darkを切り替える | アイコン／代替タイル、名称、package名、選択状態が即座に判別でき、行が崩れない。 |
| V22-R06 | 起動、Today表示、時間Habit計測中、設定Slider、制限一覧検索を連続操作する | 目立つ待機・カクつき・タップ遅延・状態の取り違えがなく、v21より重くならない。 |

## 8. References

[1]: https://reactnative.dev/docs/optimizing-flatlist-configuration "React Native: Optimizing FlatList Configuration"
[2]: https://developer.android.com/develop/ui/views/appwidgets/advanced "Android Developers: Create an advanced widget"
[3]: https://developer.android.com/topic/performance/appstartup/analysis-optimization "Android Developers: App startup analysis and optimization"

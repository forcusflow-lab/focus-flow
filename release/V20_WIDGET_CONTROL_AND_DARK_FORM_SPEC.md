# Focus Flow v20 Widget操作・ダークフォーム品質仕様

## 1. 実機結果と改修目的

v19実機では、Todoの期限起点必須自動選択、Todoの単純な完了操作、Widgetの連続行という方向性を確認できた一方、項目行の透過率が実機で変化しない、スライダーのドラッグ位置と設定値が一致しない、Widget内に完了済み表示の直接操作がない、必須Pillと回数操作のテーマ整合が弱い、ダーク時フォームの固定ライト面・淡色文字、メモ操作と保存CTAのテーマ・安全領域に不整合があることが報告された。

v20では、見た目の調整だけでなく、設定値、永続化、JSからNativeへの同期、Widget再描画、Native内の一時表示状態を分離して検証する。外観設定は操作直後に結果を確認でき、どのテーマでも本文と操作が読めることを最低条件とする。[1] [2]

| 実機報告 | 原因仮説 | v20の完了条件 |
|---|---|---|
| Widget項目行の透過率が変わらない | 行surfaceのalpha適用先とWidget再描画が実機上で区別できない | 背景と行が0%／50%／100%で別々に明確に変わる。 |
| Sliderをドラッグすると意図しない値になる | ローカル座標を移動中のイベントtargetに依存している | タップ・ドラッグのどちらも同じトラック座標を使い、10%刻みへ安定してスナップする。 |
| Widget内に完了済み表示操作がない | Todayへの遷移だけでWidget自身を切り替えられない | Widgetヘッダーの操作で、Widget内の完了済み項目を表示／非表示できる。 |
| 必須Pillと増減操作のテーマ整合が弱い | 固定色、角張った操作面、アクセントの競合 | Pill・数値・増減操作をテーマのprimary／primarySoft／surfaceへ揃え、行と一体のフラットな操作にする。 |
| ダークフォームで文字が見えない | 固定ライトsurface、固定文字色、注意面がpalette外 | Todo／Habit／Memoフォームの本文・補足・選択・注意・無効がtheme paletteの対として読める。 |
| メモの操作と保存CTAが不整合 | 共通palette未適用、ScrollView内CTA、下端安全領域不足 | 追加・Todo化・削除操作とCTAをテーマ化し、保存CTAを安全領域上の固定フッターへ置く。 |

## 2. 状態設計

### 2.1 Sliderの座標と永続化

透過率Sliderはトラックの**window座標の左端**と`pageX`との差だけで値を算出する。押下開始、ドラッグ、終了のいずれも同じ変換式を使い、0〜100の範囲へclampして最も近い10%へスナップする。表示中の値、thumb位置、保存値、Nativeへ送る値は同じ正規化関数を通す。移動中は値が変化した境界だけを状態更新し、同値で再描画を連続させない。

| 操作 | 入力 | 期待する値 |
|---|---|---|
| トラックをタップ | `pageX - trackLeft` | 該当位置の10%刻みへ即時移動 |
| thumbをドラッグ | 同じ`pageX - trackLeft` | 指に追従し、10%境界で安定して切替 |
| 左端／右端 | 0未満／trackWidth超過 | 0%／100% |
| 再起動後 | AsyncStorageの表示設定 | 最後に設定した背景／項目行の各値を復元 |

### 2.2 Widget透過と完了済み表示

Widgetは、背景・見出しを`widgetBackgroundOpacity`、各Todo／Habit行を`widgetCardOpacity`で別々に描画する。両者はNative payloadに必ず含め、更新時、Widget操作時、リサイズ時、アプリ再起動後のいずれも同じARGB計算を再実行する。文字、チェック、Pill、計数操作は不透明のままとし、透明面の上でも読める色を使用する。

Widgetのヘッダー右側には、完了済みの件数を含むTextView操作を置く。未表示時は`完了済みを表示`、表示中は`完了済みを非表示`とし、押すたびにNativeのwidget-local表示状態だけを反転する。JSが送る状態には未完了と完了の双方を含め、Native側の表示状態で行を選別する。Todayを開くヘッダー余白のDeep Linkは維持し、トグルTextViewのPendingIntentと競合させない。

| 状態 | Widget表示 | ヘッダー操作 |
|---|---|---|
| 完了済み非表示 | 未完了を優先して最大1／2／3行 | `完了済みを表示（n）` |
| 完了済み表示 | 未完了に続けて完了済みを最大1／2／3行 | `完了済みを非表示` |
| 完了項目なし | 未完了だけ | toggleを非表示 |
| Item操作後 | 即時に同じ表示状態で再描画 | 行固有PendingIntentを維持 |

### 2.3 テーマとダークフォーム

テーマは背景、surface、elevated、text、muted、border、primary、primarySoftの役割だけで構成し、フォーム内に固定白・固定濃紺・固定淡色文字を置かない。通常本文・補足はそれぞれ背景面とのコントラストを確認し、通常サイズの文字は少なくとも4.5:1を確保する。[3] 注意・選択・無効は色だけに依存せず、面・境界・文言も併用する。

メモの保存CTAはTodo／Habitフォームと同じ、安全領域を考慮した固定フッターに置く。本文ScrollViewには固定フッターの高さと`insets.bottom`に相当する余白を確保し、キーボード表示時も保存が遮られない。

## 3. Widget視覚・操作設計

Widgetは、見出し52dp、連続行48dp、1dp divider、small／medium／largeの1／2／3行を維持する。見出しは左に`今日の項目`と集中制限状態、右に完了済み表示toggleを置く。行は左から、4dpアクセント、44dp以上のチェック操作、必須Pill、本文、必要時のみ回数操作を配置する。回数Habitの減少・現在値・増加は、別カードの角張ったボタンではなく、同じsurface上のコンパクトなTextView操作として構成する。

| 要素 | 設計 | 禁止 |
|---|---|---|
| 必須Pill | `primarySoft`面と`primary`文字。背景・本文・Pillとの十分な輝度差をテーマごとに確認 | 固定青文字、背景と同化するPill |
| 増減操作 | `−  0/5  ＋`を行の末尾に揃え、操作文字はprimary、タップ面はelevated | 独立して浮く濃色四角ボタン |
| 行の透過 | surfaceだけに別々のARGBを適用。文字・Pill・チェックは不透明 | 行だけ変わらない／文字まで透過する実装 |
| 完了toggle | TextView専用PendingIntent。状態コピーを明示 | header全体と同じPendingIntentによる誤遷移 |

Android 12+ではsmall／medium／largeのresponsive RemoteViews mapを保持し、旧Androidではサイズcallbackで記憶したbucketを用いる。[1]

## 4. 全テーマ検査計画

以下を**6テーマ×light／dark×対象状態**で静的契約、数値コントラスト、Android生成、実機により確認する。実機でユーザーが指摘した画面以外も、同じ色役割を使う共有部品から確認する。

| 画面・状態 | 検査対象 |
|---|---|
| Todoフォーム | 見出し、入力、placeholder、必須、選択、期限、説明、警告、固定保存CTA、disabled CTA、キーボード表示 |
| Habitフォーム | 必須、時間帯、数値目標、選択、注意、固定保存CTA、キーボード表示 |
| Memo一覧・フォーム | 追加、Todo化、削除、空状態、入力、placeholder、固定保存CTA、追加／編集、キーボード表示 |
| Widget | 背景0／50／100%、行0／50／100%、必須／通常、未完了／完了、check／count／minutes、small／medium／large、完了表示toggle |
| 共通部品 | ScreenHeading、IconButton、Pill、EmptyState、Primary CTA、本文・補足・border・disabled |

## 5. 品質ゲートと実機受入

| ID | 実機操作 | 合格条件 |
|---|---|---|
| V20-R01 | Widgetの背景・項目行をそれぞれ0%／50%／100%にする | 片方だけを変えたときも意図した面だけが変化し、文字・Pill・チェックは読める。 |
| V20-R02 | 両Sliderを端、中央、任意位置でタップ・ドラッグする | thumbと数値が指の位置に一致し、常に10%単位の期待値になる。 |
| V20-R03 | Widgetヘッダーで完了済みを表示／非表示し、完了・復元する | Widget自身で表示を切替でき、Today遷移・行操作・リサイズと競合しない。 |
| V20-R04 | 全テーマで必須Todo／Habit、回数Habit、時間HabitをWidget表示する | 必須Pill、`−／＋`、数値、本文、補足がテーマ内で統一され、可読でフラットに見える。 |
| V20-R05 | 6テーマ×light／darkのTodo／Habit／Memoフォームを操作する | 固定ライト面、白背景上の淡色文字、読めない注意文・選択肢がない。 |
| V20-R06 | Memoの追加・編集・Todo化・削除、キーボード表示中の保存を行う | 全操作がテーマに連動し、保存CTAがタブバー・ナビゲーションバー・キーボードと重ならない。 |
| V20-R07 | Widgetをsmall／medium／largeへリサイズし、全操作後に本体を開く | 1／2／3行と行別操作・透過・完了表示が保持され、違う行へ状態が混線しない。 |

2026-08-27時点で、Slider座標のwindow座標化、Widget行の個別透過・ヘッダー完了表示toggle、テーマPill・フラット計数操作、Todo／Habit／時間帯／Memoフォームのpalette化、Memo固定保存CTAを実装した。全Vitest **32 files / 96 passed / 1 skipped**、TypeScript、CI Lint、通常版／本人用のクリーンAndroid生成が成功している。ローカルGradleの直接Kotlin compileは、実装エラーではなくsandboxのAndroid SDK未設定により完了できなかったため、本人用GitHub Actions署名ビルドでNative Kotlinを検証する。

> v20は、全自動検証、クリーンAndroid生成、本人用署名APKの独立検証、V20-R01〜R07の実機受入が揃うまでは、Google Play配布候補にしない。

## References

[1]: https://developer.android.com/develop/ui/views/appwidgets/layouts "Android Developers: Provide flexible widget layouts"
[2]: https://m3.material.io/components/sliders/guidelines "Material Design 3: Sliders"
[3]: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html "W3C WCAG 2.2: Contrast (Minimum)"

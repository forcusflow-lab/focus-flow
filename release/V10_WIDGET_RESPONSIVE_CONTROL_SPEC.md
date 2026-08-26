# Focus Flow v10 Widget・必須表示 再設計仕様

## 実機不合格の記録

本人用v9暫定検証版において、Widget自体の追加・表示は成功した。一方で、リサイズしても表示内容が変わらないこと、参考としたコンパクトな統合リストの情報階層になっていないこと、アプリテーマ・必須ラベル・チェック操作が視認できないことを実機で確認した。さらに、本体Todoでは必須Pillが`必`だけに切れている。

> v10では「Widgetが表示できる」ことだけを合格とせず、サイズ別の情報量、テーマ追従、必須の完全表示、行ごとの操作が実機で見えることを同時に満たす。

## 設計方針

Focus FlowのWidgetは、一覧表示と直接操作を合わせた**ハイブリッドWidget**として扱う。小サイズでは一つの次項目と単一操作に絞り、中サイズでは2行のTodo/習慣統合リスト、大サイズでは最大4行と習慣の進捗操作を表示する。Androidの公式指針に従い、サイズごとに情報を増やす応答レイアウトを提供し、`onAppWidgetOptionsChanged` で古いランチャーのサイズ変更にも追従する。[1] [2]

| サイズバケット | 目安 | 表示内容 | 操作 |
|---|---:|---|---|
| Small | 幅 < 200dp または 高さ < 150dp | ヘッダー、最優先1項目、必須ラベル、状態 | Todo/チェック習慣は正方形チェック。本文は詳細 |
| Medium | 上記以外で高さ < 250dp | ヘッダー、最大2項目、必須・時間帯・進捗 | Todo/チェック習慣はチェック。回数習慣は`− 1/3 +` |
| Large | 高さ ≥ 250dp | ヘッダー、最大4項目、各項目の補足・進捗 | 回数は増減、時間は開始/停止状態、本文は詳細 |

## 視覚仕様

| 要素 | v10仕様 |
|---|---|
| テーマ | 本体と同じ`AppPalette`の`surface`・`elevated`・`text`・`muted`・`primary`をJSONでWidgetへ同期する。Providerはライト/ダーク二値ではなくテーマID別のshape drawableを選択する。 |
| 必須ラベル | 日本語は常に`必須`、英語は`MUST`。専用ラベル領域は最小42dp、12sp、左右8dp以上、単一文字へ縮小・省略しない。 |
| チェック | 未完了でも濃い境界線が見える20dpの正方形。タップ領域は48dp。完了時はテーマprimary面＋白いチェック。 |
| 行 | 最小48dp、Largeでは56dp。先頭に操作、中央にタイトルと補足、末尾に習慣種別操作を置く。本文タップと操作タップを分離する。 |
| 参考レイアウト | 白い大カードの中に文字だけを並べず、淡いテーマ面のコンパクト行を連続させ、左操作・中央情報・右進捗で一貫した見出しを作る。 |

## 習慣のWidget操作仕様

| 習慣種別 | 中/大サイズの操作 | 状態同期 | 制約 |
|---|---|---|---|
| check | 正方形チェック / 復元 | `complete` / `restore` | 時間ロック時は鍵表示・操作不可 |
| count | `−`、`現在/目標`、`+` | `decrement` / `increment` | 0〜目標にクランプ。目標到達で完了扱い |
| minutes | 未計測は`開始`、計測中は`計測中`、完了後は復元 | `timer_start` / `restore` | Widgetは経過時間を本体状態へ同期。完了判定は既存タイマー規約を維持 |

## 実装・回帰要件

1. `RemoteViewsService`、`ListView`、生`View`、`layout_weight`、0dp寸法、`setFloat`/`setAlpha`を再導入しない。
2. static RemoteViewsのSmall/Medium/Large layoutだけを使い、初回追加と更新後に同じ安全な経路を使う。
3. Widget actionには`widgetId`、サイズ行、操作、`kind`、`id`を含め、Todo/習慣で同じID文字列でも混線させない。
4. 本体Todo/Habit/TodayのPillは、文字倍率`compact`/`standard`/`large`で完全なラベルを表示する。
5. 静的契約、TypeScript、Lint、通常・本人用clean prebuild、署名APK解析を通す。実機スクリーンショットが合格するまで正式APKは配布しない。

## 実機受入

| ID | ケース | 合格条件 |
|---|---|---|
| R-01 | Small/Medium/Largeへのリサイズ | 項目数または進捗操作がバケットどおり変わり、余白だけが拡大しない |
| R-02 | 6テーマ × ライト/ダーク | 背景・文字・primary・未完了チェック・必須ラベルが本体選択と一致し読める |
| R-03 | Todo、check/count/minutes習慣 | チェック、増減、開始/復元が該当行だけを更新する |
| R-04 | 必須と通常、短文・長文、文字3倍率 | `必須`が完全に表示され、文字・行・操作が重ならない |
| R-05 | 本体Todo/Habit/Today | `必須`が`必`に切れず、カードの詳細・チェック操作が分離される |

## Today習慣カードの統一

Todayの習慣カードは、簡略なTodo風行として扱わない。習慣タブと同じく、正方形チェック、必須Pill、週次7日表示、連続記録、回数・時間の進捗操作、完了時の取り消し線、詳細導線を表示する。Todayでは「今やる」「この後」「今日のリスト」という時間文脈だけを追加し、習慣自体の表示と操作規約は変えない。

## 自動検証結果

| 検証 | 結果 |
|---|---|
| Vitest | 24 files / 74 passed / 1 skipped |
| TypeScript | `pnpm check` 成功 |
| Lint | `pnpm lint` 成功 |
| 通常版クリーン生成 | `com.app.focusflow` / versionCode 20、Provider、4行静的layout、10段階drawable、禁止Collection経路不在を確認 |
| 本人用クリーン生成 | `com.app.focusflow.personal` / versionCode 10、専用scheme、Provider、4行静的layout、10段階drawable、禁止Collection経路不在を確認 |

ローカルのクリーン生成は、Widgetがランチャーで視覚的に正しいことを証明しない。小・標準・大へのリサイズ、テーマ、必須Pill、正方形チェック、回数・時間操作、Today習慣カードは、署名APKによる実機受入が必須である。

## References

[1] [Android Developers: Provide flexible widget layouts](https://developer.android.com/develop/ui/views/appwidgets/layouts)

[2] [Android Developers: App widgets overview](https://developer.android.com/develop/ui/views/appwidgets/overview)

# Focus Flow v9 視覚品質監査台帳

## 目的と判定原則

本台帳は、本人用 v8 で報告された **Widget追加・表示不能、ダークテーマの低可読性、必須ラベルの切れ** を受けて作成した v9 の出荷判定記録である。自動テスト、クリーンAndroid生成、署名ビルド検証は必要条件であり、実機上のスクリーンショット受入を代替しない。対象ケースのいずれかが未実施又は不合格である限り、v9 APK を利用者へ配布しない。

> v8のWidget不具合について、RemoteViews階層に生の`View`を背景・dividerとして含めた点と、`setAlpha`を利用した点を高リスク仮説として扱う。ランチャー実機での再現・解消確認前に、これを確定原因とは断定しない。

| 領域 | v9安全設計 | 自動検証 | 実機受入状態 |
|---|---|---|---|
| Widget配置 | `FrameLayout`、`LinearLayout`、`TextView`、`ImageView`のみの静的RemoteViews | 生`View`、`ListView`、weight、0dp高さ、`setFloat`の不在を契約テスト | 未実施 |
| Widget透過 | light/dark × 0/25/50/75/100% のshape drawable | Provider参照とプラグインコピー対象を契約テスト | 未実施 |
| Widget文字 | 明示ライト・ダーク本文/補足色、文字倍率連動 | 明示色と13/12/10sp倍率を契約テスト | 未実施 |
| 必須バッジ | 42dp最小幅、10dp横padding、非縮小、Habitメタ折返し | `Pill`とHabitレイアウトの契約テスト | 未実施 |
| 表示と言語 | テーマ、フォント、Segmented、Widget設定、プレビューをpaletteで描画 | `focus-flow-v9-visual-contract` | 未実施 |
| 主な本体画面 | Today/Todo/Habitに加え、Notes/Insights/More/Settings共通カードをpaletteで上書き | `focus-flow-v9-screen-palette` | 未実施 |

## 自動品質ゲート

| ID | 検査 | 合格条件 | 現状 |
|---|---|---|---|
| A-01 | v9静的視覚契約 | RemoteViews許容階層、alpha禁止、必須ラベル幅、Appearance palette | 合格（3 tests） |
| A-02 | 全画面palette契約 | Notes/Insights/MoreとSettings共通surfaceが動的paletteを使用 | 合格（2 tests） |
| A-03 | 全Vitest・型検査・Lint | 失敗0、警告0 | 合格：Vitest 22 files / 69 passed / 1 skipped、`pnpm check`、`pnpm lint` |
| A-04 | 通常・本人用クリーンprebuild | package/versionCode、Provider、layout、10 drawableが生成先に存在 | 合格。通常`com.app.focusflow`/19、本人用`com.app.focusflow.personal`/9、各10 drawable、禁止階層・`setFloat`不在を確認 |
| A-05 | 署名ビルド | 通常AAB 19・本人用APK 9の成果物署名・Manifest・資産解決を独立確認 | 本人用APK 9は合格（run `33004087649`）。通常AAB 19は未実施 |

ローカルの `:app:compileReleaseKotlin` は、依存関係評価中にサンドボックスの高メモリ警告が出たため安全のため停止した。これはコンパイル合格を意味しない。署名済みGitHub Actions成果物の検証を A-05 として別途必須とする。

## 実機スクリーンショット受入

| ID | 画面・状態 | 必須観点 | 結果 |
|---|---|---|---|
| W-01 | 小・標準・大Widget | 追加成功、ヘッダー、空状態、枠・余白の破綻なし | 未実施 |
| W-02 | Widget 0/25/50/75/100% | light/darkそれぞれで本文・チェック・境界が読める | 未実施 |
| W-03 | Widget 1件/2件、長文 | 重複なし、行ID混線なし、切れ・中途半端な行なし | 未実施 |
| W-04 | Widget操作 | 上下各行の完了、復元、詳細、ヘッダー→Today、時間ロック | 未実施 |
| W-05 | Todo/Habit/Today | 必須表示が「必須」と完全に読め、通常項目に不要なタグがない | 未実施 |
| S-01 | 表示と言語 | ライト/ダーク、3フォント、3文字サイズ、テーマ/Segmented/Widget設定 | 未実施 |
| S-02 | 全タブと詳細 | Today、Todo、Habit、Notes、Insights、More、Settingsの空/複数/完了/入力状態 | 未実施 |
| N-01 | ネイティブ導線 | 起動、戻る、Deep Link、集中制限、通知、法務・サポート、エラー | 未実施 |

## v9配布判定

v9の署名済み成果物を生成しても、上表の実機スクリーンショットが受入済みになるまで **配布候補にしない**。Google Playへのアップロード・公開は、実機合格の記録と利用者の明示確認後にのみ実施する。

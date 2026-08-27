# Focus Flow v16 本人用署名APKビルド記録

## 1. 配布対象と扱い

本記録は、Widgetのヘッダー／カード余白、ライブ経過表示、左アクセントレール、Today対象の有効必須化、TodayとWidgetの完了済み表示分離、Todayと各一覧の共通カードを含む、**本人用・制限なしAPK v16** の署名ビルドに関するものである。対象のアプリIDは`com.app.focusflow.personal`であり、通常のGoogle Play版`com.app.focusflow`、無料上限、IAP、Playの配布状態は変更しない。

本APKは、利用者が既に許可している範囲の**暫定実機検証版**である。V16-R01〜R06の端末受入が完了するまで、正式版・Google Play配布候補とは扱わない。

| 項目 | 結果 |
|---|---|
| GitHubリポジトリ | `forcusflow-lab/focus-flow` |
| 対象ソース | [`085dfcfd0582d76dc479b9b4701c312248a2b4bf`][2] |
| Webチェックポイント | `manus-webdev://085dfcfd` |
| ワークフロー | `Build Focus Flow personal unlimited APK` |
| 成功run | [#33061080251][1] |
| 実行結果 | **成功**（26分29秒） |
| artifact | `focus-flow-personal-unlimited-apk`（ID: `9642524244`） |
| artifact digest | `sha256:6565ebd4361d6b445e46f00ddf6762184e8196daf83d83f331ff777907aa131a` |
| artifact保持期限 | 2026-09-10 10:26:19 UTC |
| APK | `app-release.apk` |

## 2. 署名済みAPKの独立検証

artifactをプロジェクト外の検証ディレクトリへ取得し、ソースや生成途中の`android/`ではなく、署名済みのAPK本体を直接検査した。

| 検証 | 実測結果 | 判定 |
|---|---|---|
| APKサイズ | 51,777,354 bytes | 取得完了 |
| ZIP整合性 | `unzip -t`成功 | 合格 |
| APK SHA-256 | `ad15c586c77dd15d2cc67828ef57d0607d8d2433b440782907c2fd15378fbdff` | 記録済み |
| package | `com.app.focusflow.personal` | 通常版と分離 |
| versionCode / versionName | `16` / `1.0.0` | 意図した本人用更新版 |
| APK Signature Scheme | v2あり、v1・v3なし | 合格 |
| 証明書 SHA-1 | `0D:A5:A7:0E:14:A2:A4:3A:DB:A8:F8:04:40:81:C5:B2:18:86:B5:BC` | 既知証明書と一致 |
| 証明書 SHA-256 | `7BF73C140458A45EB35858B5664207870DDB2C050C72CCE7C53C57F9DFCAB510` | 記録済み |

## 3. Manifest・Widget構成の独立検証

署名済みAPKのManifestとリソース公開表、DEXを照合し、個人用scheme、Widget Provider、v16固有のライブ計測・アクセント構成、および旧Collection経路不在を確認した。

| 検証領域 | 実測結果 | 判定 |
|---|---|---|
| 個人用Deep Link | `manusfocusflowpersonal` schemeを宣言 | 合格 |
| Widget Provider | `com.app.focusflow.personal.focusflow.FocusFlowWidgetProvider`をreceiverとして宣言 | 合格 |
| リサイズbroadcast | `APPWIDGET_UPDATE_OPTIONS`を宣言 | 合格 |
| 静的初期layout | `focus_flow_widget_initial`資源を解決し、APK内の`res/KU.xml`へ対応付け | 含有確認 |
| v16レイアウトID | `focus_flow_widget_static_row_one_chronometer`および`focus_flow_widget_static_row_one_rail`を公開リソース表で確認 | 合格 |
| mini-card資産 | light/darkの通常・必須・完了、開始、light/dark停止の9 drawableを確認 | 合格 |
| ライブ計測・状態同期 | DEXに`setChronometer`、`timer_pause`、`timerStartedAtMillis`、`elapsedSeconds`、`responsiveWidgetViews`を確認 | 合格 |
| 旧一覧経路 | DEXに`RemoteViewsService`、`setRemoteAdapter`、`BIND_REMOTEVIEWS`、`FocusFlowWidgetItemsService`なし | 合格 |

クリーンAndroid生成では、通常版versionCode 26と本人用versionCode 16の双方で、静的RemoteViews許容要素だけのlayout、Chronometer、4dpアクセントレール、51dp行、`View`／`ListView`／`layout_weight`／0dp寸法の不在も確認した。

## 4. 自動品質ゲート

| 検証 | 結果 |
|---|---|
| ユニット・静的契約 | 27テストファイル、82件合格、1件スキップ。期限当日以前の有効必須化、共通カード、Today／Widget表示分離、Chronometer、アクセントレール、禁止構造を含む。 |
| TypeScript | `pnpm check`成功。 |
| Lint | `pnpm lint`成功。 |
| 本人用クリーン生成 | `FOCUS_FLOW_PERSONAL_UNLIMITED=1`で成功。package、versionCode、Provider、静的Widget資産を確認。 |
| 通常版クリーン生成 | versionCode 26で成功。本人用の変更が通常Play版の生成を阻害しないことを確認。 |

## 5. 実機受入が必要な項目

署名・自動検証では、端末ランチャーの余白・Chronometerの見え方・テーマ・AsyncStorage復元を代替できない。次の受入を完了するまで、Google Playへのアップロードや公開を行わない。

| ID | 実機操作 | 合格条件 |
|---|---|---|
| V16-R01 | Widgetをsmall／medium／largeへ切替え、1／2／3行を表示する | ヘッダーとカード群に不自然な詰まり・過剰な空白がなく、2dpのカード間隔、タイトル・本文の可読性、リサイズ維持を確認する。 |
| V16-R02 | 時間型HabitをWidgetで開始→数十秒待機→停止→待機→再開する | 計測中は数字がホスト上で増え、停止中は固定、再開後は停止値から継続する。本体との状態も一致する。 |
| V16-R03 | 優先度の異なるTodoと色の異なるHabitを混在表示する | 各mini-cardの左4dpアクセントが本体のTodo優先度・Habit色と一致し、light／dark双方で区別できる。 |
| V16-R04 | 手動必須、期限超過、期限当日、期限翌日のTodoを作成する | TodayとWidgetには手動必須・期限超過・期限当日だけが出る。期限超過／当日は必須として見え、期限翌日は出ない。 |
| V16-R05 | 設定でTodayのみ`残す`、Widgetのみ`非表示`、次に逆の組合せを試す | 完了後のグレーダウン／取り消し線または非表示が、TodayとWidgetで互いに独立して反映され、復元もできる。 |
| V16-R06 | Today、Todo、Habitの同じ項目を比較する | 必須Pill、期限、進捗、時間型の開始／停止／再開、完了表示、詳細遷移が同一の情報階層・操作になっている。 |

> v16は**暫定実機検証版**である。V16-R01〜R06の結果を報告いただくまでは、「正式」「完全に修正済み」とは表現しない。

## References

[1]: https://github.com/forcusflow-lab/focus-flow/actions/runs/33061080251 "GitHub Actions: successful v16 personal APK build"
[2]: https://github.com/forcusflow-lab/focus-flow/commit/085dfcfd0582d76dc479b9b4701c312248a2b4bf "GitHub: v16 source commit"

# Focus Flow v17 / 本人用v7 行同一性・コンパクトWidget ビルド記録

**記録日:** 2026-08-26  
**対象コミット:** `de45397f89df1aa2ef74405db7abfbb35951247f`  
**目的:** 本人用v6のTodo重複表示、上段チェックが下段へ移る状態混線、過大な視覚チェック、文字切れ・可読性不良を修正したv7を、署名済みAPKで実機再受入へ渡す。

## 1. 修正の要点

JS状態生成の`uniqueWidgetItems()`、Provider描画の`uniqueStaticItems()`、完了／復元処理の一意対象確認という三層で`kind:id`の重複を防ぐ。操作対象が複数一致する場合は、末尾行を変更せず操作を拒否する。各PendingIntentは`widgetId + row + operation + kind + itemId`で固有化した。

タップ領域は48dpのまま、視覚チェックは中央の20dpへ縮小した。本文は12sp、補足は10sp、補足は必要時のみ表示し、タイトルは1行省略表示とする。Collection `ListView`・`RemoteViewsService`は引き続き生成APKに含めない。

## 2. 自動・ネイティブ生成品質ゲート

| 検証 | 結果 |
|---|---|
| 失敗先行の行同一性テスト | 追加後に実装前失敗を確認 |
| 対象テスト | 3 files / 9 passed |
| 全Vitest | 20 files / 63 passed / 1 skipped |
| TypeScript | 成功 |
| ESLint | 成功 |
| 通常版クリーンAndroid生成 | 成功。versionCode 17、Provider metadata、20dpチェック、Collection service不在を確認 |
| 本人用クリーンAndroid生成 | 成功。`com.app.focusflow.personal`、versionCode 7、完了背景drawable、20dpチェック、Collection service不在を確認 |

## 3. 本人用・制限なし v7 APK

| 項目 | 値 |
|---|---|
| GitHub Actions | [Build Focus Flow personal unlimited APK run 32954914746](https://github.com/forcusflow-lab/focus-flow/actions/runs/32954914746) |
| Artifact | `focus-flow-personal-unlimited-apk` / ID `9602445631` |
| 結果 | 成功 |
| パッケージ | `com.app.focusflow.personal` |
| versionCode | `7` |
| versionName | `1.0.0` |
| APK容量 | 51,755,203 bytes |
| SHA-256 | `ba82dcb69c5019349e77cc0a68563b5ad82f8cc038d21f487f0e507ac2bbc984` |
| ZIP整合性 | 成功 |
| APK Signature Scheme | v2署名あり、v1/v3なし |
| 署名証明書SHA-1 | `0D:A5:A7:0E:14:A2:A4:3A:DB:A8:F8:04:40:81:C5:B2:18:86:B5:BC` |
| Provider metadata | `xml/focus_flow_widget_initial_info`へ解決 |
| initialLayout | `layout/focus_flow_widget_initial`へ解決 |

APK復号結果では、Widget Provider receiverと`APPWIDGET_UPDATE`を確認し、旧`FocusFlowWidgetItemsService`と`BIND_REMOTEVIEWS`は存在しなかった。initialLayoutは固定48dpの2行、48dp外側操作領域、中央20dp ImageView、本文残余幅で構成され、`ListView`、`layout_weight`、`0dp`高さを含まない。

## 4. v7 実機受入

| ID | 操作 | 合格条件 |
|---|---|---|
| A-01 | Todoを1件だけ作成してWidgetを更新する | 表示は1行だけ。空の2行目、同じTodoの重複表示はない |
| A-02 | Todoを2件作成する | 異なるTodoだけが上段・下段に1件ずつ表示される |
| A-03 | 上段、下段を個別にチェック・復元する | 押した行だけが完了／復元され、もう一方へチェックが移らない |
| A-04 | 行本文、チェック、ヘッダー／空状態を押す | 詳細、該当項目の状態変更、Todayが混線しない |
| A-05 | ライト／ダーク、文字サイズ3段階、サイズ変更を試す | 20dpチェックが中央にあり、タイトル・補足・必須・時間帯を判読でき、文字切れ・重なりがない |

v7は署名・生成物検証まで完了しているが、上記実機受入が完了するまで修正成功・不具合なしとは扱わない。

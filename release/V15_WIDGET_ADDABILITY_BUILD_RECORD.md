# Focus Flow v15 / 本人用v5 Widget追加互換性 ビルド記録

**記録日:** 2026-08-26  
**対象コミット:** `f56999676b376e22cf41bff1ecb8fddb066a0ed6`  
**目的:** 本人用v4で再現したランチャーのWidget追加失敗を、追加時にCollection RemoteViewsを使わない互換設計へ変更し、署名済み本人用v5 APKで実機再受入へ渡す。

## 1. v4実機失敗とv5の修正範囲

v4ではProvider宣言、metadata、`initialLayout`、署名が存在していたにもかかわらず、ランチャーで「ウィジェットを追加できませんでした」が再現した。追加中の`onUpdate`がCollection `ListView`と`RemoteViewsService`を持つ面へ直ちに更新していたこと、さらに初期面・Collection面に`layout_weight`と`0dp`高さが残っていたことを、追加時にホスト側inflateへ失敗を伝播し得る互換性リスクとして扱った。

v5では`onUpdate`を最小の静的initial RemoteViewsだけを更新する処理に変えた。Collection更新はアプリの状態同期が`refreshAll()`を呼ぶ後段へ分離した。初期安全面とCollection shellの両方をFrameLayout、固定ヘッダー、`match_parent`、明示マージンで構成し、`layout_weight`と`0dp`高さを排除した。Collection更新でProvider内例外が起きた場合は、Todayを開ける初期安全面へ戻す。

## 2. 自動・生成品質ゲート

| 検証 | 結果 | 記録 |
|---|---|---|
| Widget登録対象テスト | 成功 | `tests/focus-flow-android-plugin.test.ts` 5 passed |
| TypeScript型検査 | 成功 | `pnpm check` |
| ESLint | 成功 | `pnpm lint` |
| 全Vitest | 成功 | 19 files / 62 passed / 1 skipped |
| 通常版クリーンAndroid生成 | 成功 | Provider、metadata、versionCode 15、weight／0dp不在を確認 |
| 本人用クリーンAndroid生成 | 成功 | `com.app.focusflow.personal`、専用scheme、Provider、metadata、versionCode 5、weight／0dp不在を確認 |

## 3. 本人用・制限なし v5 APK

| 項目 | 値 |
|---|---|
| GitHub Actions | [Build Focus Flow personal unlimited APK run 32941178393](https://github.com/forcusflow-lab/focus-flow/actions/runs/32941178393) |
| Artifact | `focus-flow-personal-unlimited-apk` / ID `9597286205` |
| 結果 | 成功 |
| パッケージ | `com.app.focusflow.personal` |
| versionCode | `5` |
| versionName | `1.0.0` |
| APK容量 | 51,744,109 bytes |
| SHA-256 | `62e370af9c26184ec9c63ef8951959ccbe26f4b2264fe83e0460dfa4cb748bcb` |
| ZIP整合性 | 成功 |
| APK Signature Scheme | v2署名あり、v1/v3なし |
| 署名証明書SHA-1 | `0D:A5:A7:0E:14:A2:A4:3A:DB:A8:F8:04:40:81:C5:B2:18:86:B5:BC` |
| Provider metadata | `xml/focus_flow_widget_initial_info`へ解決 |
| 初期layout | `layout/focus_flow_widget_initial`へ解決、`layout_weight`・0dp高さなし |

APK解析でProvider receiver、`APPWIDGET_UPDATE`、非exportedの`BIND_REMOTEVIEWS` service、本人用Deep Link、初期metadata、初期layoutの存在と連鎖を確認した。これはAndroidランチャーでの追加成功を保証するものではないため、v5は実機受入まで**検証用ビルド**として扱う。

## 4. v5実機受入

| 順序 | 操作 | 合格条件 |
|---|---|---|
| 1 | 既存の本人用Focus Flowをv5へ上書き更新する | Androidが更新を受け付け、データが保持される |
| 2 | ホーム画面長押し → Widgets → `Focus Flow · Today` → 追加 | 「ウィジェットを追加できませんでした」が出ず、初期安全面が表示される |
| 3 | Focus Flowを一度開き、ホーム画面へ戻る | Todayの一覧へ更新される。更新できない場合もエラー面ではなくTodayへ移動できる初期面が残る |
| 4 | ライト／ダーク、文字サイズ3段階、小・中・大リサイズを試す | 本文、補足、必須、時間帯、チェックが読め、重なり・切れ・過大な余白がない |
| 5 | チェック、本文、ヘッダー／空状態、遮断画面の項目確認を試す | 完了／復元、該当詳細、Today、Todayへの遷移がそれぞれ分離して動く |

追加が再び失敗した場合は、端末名、Androidバージョン、ホームアプリ、旧APKの有無、追加後の画面を記録する。可能なら`adb logcat`の`RemoteViews`、`AppWidgetHost`、`InflateException`を含む行を取得して、残るランチャー固有の問題を特定する。

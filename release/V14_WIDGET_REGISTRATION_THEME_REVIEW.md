# Focus Flow v14 — Widget登録・テーマ回帰レビュー

## 1. 実機報告と成果物確認

本人用APK versionCode 3では、ランチャーに「ウィジェットを追加できませんでした」と表示され、追加済みの表示ではライトモードの本文が見えない実機報告があった。配布APKを直接解析した結果、`com.app.focusflow.personal`／versionCode 3に`FocusFlowWidgetProvider`、`FocusFlowWidgetItemsService`、`APPWIDGET_UPDATE` Receiver、`android.appwidget.provider` metadataが含まれ、metadataは`focus_flow_widget_info`、`initialLayout`は`focus_flow_widget`を参照していることを確認した。

このため、Provider宣言そのものの欠落ではなく、**Provider更新時のRemoteViews経路、Collection Widgetの初期化、またはランチャー固有の追加処理に対する防御不足**が追加失敗の有力な範囲である。端末ログなしに一つの原因へ断定せず、初期レイアウトの安全化、Provider例外時のフォールバック、生成済みManifestとリソース連鎖のテストを導入する。

## 2. 設計上の不備

| 観点 | 現行の不備 | 改訂判断 |
|---|---|---|
| 初回追加 | `initialLayout`がCollection Widget本体であり、追加直後からListView／Serviceを必要とする | metadataは最小の安全な初期レイアウトを使い、Provider更新で高密度リストへ置換する。 |
| Provider失敗 | `onUpdate`の例外がLauncher上の追加操作を失敗させ得る | 追加時に必ず描画できるフォールバックを用意し、Collection更新失敗でもWidgetを配置可能にする。 |
| テーマ同期 | アプリ共通パレットを行本文まで暗黙に流用する | Widget本文・補足・空状態は、ライト／ダーク別に明示した高コントラストのWidgetセマンティック色を使う。 |
| テスト範囲 | Receiver・metadata・Serviceの存在と、実APKでのリソース連鎖を合格条件にしていない | プラグイン原本、通常・本人用のクリーン生成Manifest、APK解析の三層で登録契約を固定する。 |

## 3. 改訂後のネイティブ設計

Widgetは次の二層に分ける。

1. **追加保証層:** `initialLayout`は、タイトル・状態・タップ可能な最小面だけを持つRemoteViews互換レイアウトとする。Collection Serviceが未初期化でも、この面は配置できる。
2. **機能層:** Providerが状態同期後にCollection Widgetを適用する。ここで例外が起きたときは追加保証層へ戻し、Launcherに追加失敗を伝播させない。

Widget本文の色は、アプリのテーマ識別には追従するが、本文・補足・空状態を共通パレットの可変値へそのまま委ねない。ライトでは濃いフォレスト系、ダークでは明るいミント系、境界はそれぞれの面と明確に区別できる値を明示する。主操作と必須線だけは選択テーマのprimary色を使う。

## 4. レビュー結論

今回の症状は、Widgetを「追加できる」ことを独立した受入基準にしていなかったこと、テーマ連携を「配色値が届く」ことだけで検査し「文字が読める」ことを検査していなかったことに起因する設計上の不足である。次の実装では、追加成功、初期レイアウト、本文コントラスト、Collection Widget更新、ライト／ダーク、文字サイズ、チェック・詳細遷移を一つの連続した品質ゲートとして扱う。

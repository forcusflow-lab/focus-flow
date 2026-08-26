# Focus Flow v16 / 本人用v6 静的Widget版 ビルド記録

**記録日:** 2026-08-26  
**対象コミット:** `bc9a78bc4e721b63fbd779c20ddb79371600d9dc`  
**目的:** 本人用v5で継続したWidget本文領域のランチャーエラーを、Collection依存のない静的RemoteViews Widgetで原因分離し、署名済みAPKを実機受入へ渡す。

## 1. 実装・生成品質ゲート

| 検証 | 結果 | 備考 |
|---|---|---|
| 全Vitest | 成功 | 19 files / 61 passed / 1 skipped |
| TypeScript型検査 | 成功 | `pnpm check` |
| ESLint | 成功 | `pnpm lint` |
| 通常版クリーンAndroid生成 | 成功 | versionCode 16、Provider metadata、静的layout、Collection service不在を確認 |
| 本人用クリーンAndroid生成 | 成功 | versionCode 6、別package／scheme、Provider metadata、静的layout、Collection service不在を確認 |
| ローカルGradle Kotlin compile | 未完走 | サンドボックスのGradle daemonがメモリ終了。ソースエラーとは断定せず、GitHub署名ビルドでコンパイルを確認 |

クリーン生成後の`AndroidManifest.xml`と生成ソースに、`FocusFlowWidgetItemsService`、`BIND_REMOTEVIEWS`、`setRemoteAdapter`、`focus_flow_widget_list`がないことを確認した。初期layoutに`ListView`、`layout_weight`、`0dp`高さはない。

## 2. 本人用・制限なしv6署名APK

| 項目 | 値 |
|---|---|
| GitHub Actions | [Build Focus Flow personal unlimited APK run 32949165490](https://github.com/forcusflow-lab/focus-flow/actions/runs/32949165490) |
| Artifact | `focus-flow-personal-unlimited-apk` / ID `9600240888` |
| 結果 | 成功 |
| パッケージ | `com.app.focusflow.personal` |
| versionCode | `6` |
| versionName | `1.0.0` |
| APK容量 | 51,754,035 bytes |
| SHA-256 | `ced46dc83b8286ea254a856be1cb0de1c92de5898a11784cd8004a764ba8f779` |
| ZIP整合性 | 成功 |
| APK Signature Scheme | v2署名あり、v1/v3なし |
| 署名証明書SHA-1 | `0D:A5:A7:0E:14:A2:A4:3A:DB:A8:F8:04:40:81:C5:B2:18:86:B5:BC` |
| 専用Deep Link | `manusfocusflowpersonal:///` |

復号Manifestでは、`FocusFlowWidgetProvider`が`APPWIDGET_UPDATE` receiverとして登録され、旧`FocusFlowWidgetItemsService`と`BIND_REMOTEVIEWS`は存在しなかった。Provider metadata resource `@7F140003`は`xml/focus_flow_widget_initial_info`へ解決し、同XMLの`initialLayout` resource `@7F0C0032`は`layout/focus_flow_widget_initial`へ解決した。

成果物から復号した静的layoutは、固定36dpヘッダー、最大2件の48dp `FrameLayout`行、48dpアクション領域、本文・補足領域で構成される。`ListView`、`layout_weight`、`0dp`高さは含まれない。従って、v6のWidget本文はCollection Adapter／RemoteViewsServiceのbind・inflate経路を通らない。

## 3. 実機受入の範囲

v6の署名・パッケージ・生成物構成は検証済みだが、ランチャーでの追加成功は未検証である。v6は最終機能版ではなく、**追加失敗の原因分離ビルド**として扱う。

| ID | 実機操作 | 合格条件 |
|---|---|---|
| S-01 | v6をv5へ上書きし、ホーム画面から`Focus Flow · Today`を追加する | 「ウィジェットを追加できませんでした」が出ず、空状態または最大2件の静的行が表示される |
| S-02 | Focus Flowを開き、ホームへ戻る | 本文領域がランチャーのエラーに置換されず、最大2件が更新される |
| S-03 | 本文、48dpチェック領域、ヘッダー／空状態を押す | 詳細、完了／復元、Todayが意図どおりに分離する |
| S-04 | ライト／ダーク、文字サイズ3段階、サイズ変更を試す | 文字・必須・時間帯・チェックが背景から識別でき、重なり・切れがない |

S-01またはS-02が再び不合格なら、端末名、Androidバージョン、ホームアプリ、追加直後とアプリ起動後の画面を記録する。可能なら`adb logcat`で`AppWidgetHost`、`RemoteViews`、`InflateException`を含むログを取得し、Collection以外のProvider metadata／静的layout／ランチャー互換性へ原因範囲を狭める。

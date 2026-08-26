# Focus Flow v14 Widget登録・可読性修正版 ビルド記録

**記録日:** 2026-08-26  
**対象コミット:** `47696503c70dd90c4607c4e7bc5aea2e005f410d`  
**目的:** 本人用APKで報告された「ウィジェットを追加できませんでした」と、ライトモードでのWidget本文消失を対象に、Widgetの登録安全層と明示的な文字コントラストを署名済み成果物で確認し、Android実機受入へ渡す。

## 1. 実装した登録安全層

Widgetの初回追加時にCollection `RemoteViewsService`の生成・更新へ依存しないよう、Provider metadataは最小の`focus_flow_widget_initial_info`を参照する。これは4×2セルの最小サイズ、縦横リサイズ、かつ`focus_flow_widget_initial`を`initialLayout`として指定する。Collection更新で例外が発生した場合は、ProviderがTodayへ遷移できるフォールバック面を更新する。

Widgetの見出し、本文、補足、境界には、アプリの可変パレットを直接流用せず、ライトテーマでは`#13251F`／`#4E655B`、ダークテーマでは`#F4FBF7`／`#B7CCC2`の明示的な高コントラスト色を使う。この対策は、追加に成功することと、本文が読めることを別々の受入条件として扱うためのものである。

## 2. 自動・ネイティブ生成品質ゲート

| 検証 | 結果 | 記録 |
|---|---|---|
| TypeScript型検査 | 成功 | `pnpm check` |
| ESLint | 成功 | `pnpm lint` |
| Vitest | 成功 | 19 files / 62 passed / 1 skipped |
| 通常版Androidクリーン生成 | 成功 | `CI=1 npx expo prebuild --platform android --clean --no-install` |
| 本人用Androidクリーン生成 | 成功 | `FOCUS_FLOW_PERSONAL_UNLIMITED=1 CI=1 npx expo prebuild --platform android --clean --no-install` |
| 生成Manifest | 成功 | Provider、`APPWIDGET_UPDATE`、RemoteViews service、初期情報metadata、初期レイアウト、専用Deep Linkを確認 |

## 3. 通常版 Google Play 用 AAB

| 項目 | 値 |
|---|---|
| GitHub Actions | [Build signed Android App Bundle run 32933608667](https://github.com/forcusflow-lab/focus-flow/actions/runs/32933608667) |
| Artifact | `focus-flow-v7-aab` / ID `9594550721` |
| 結果 | 成功 |
| パッケージ | `com.app.focusflow` |
| versionCode | `14` |
| AAB容量 | 38,575,671 bytes |
| SHA-256 | `0c4c1536ddc3bd99cd199ae43106362fe9234ab5ad5086af629f18ddde1437a4` |
| ZIP整合性 | 成功 |
| Google Play upload certificate SHA-1 | `0D:A5:A7:0E:14:A2:A4:3A:DB:A8:F8:04:40:81:C5:B2:18:86:B5:BC` |

通常版AABは成果物ZIPの完全性、AABのSHA-256、`META-INF/*.RSA`からの証明書SHA-1を独立に確認した。既存のGoogle Playアップロード証明書の期待値と一致する。**実機受入とアカウント所有者の明示確認が済むまで、Google Play内部テストへのアップロード・公開は実行しない。**

## 4. 本人用・制限なし APK

| 項目 | 値 |
|---|---|
| GitHub Actions | [Build Focus Flow personal unlimited APK run 32933623876](https://github.com/forcusflow-lab/focus-flow/actions/runs/32933623876) |
| Artifact | `focus-flow-personal-unlimited-apk` / ID `9594616904` |
| 結果 | 成功 |
| パッケージ | `com.app.focusflow.personal` |
| versionCode | `4` |
| versionName | `1.0.0` |
| 専用Deep Link | `manusfocusflowpersonal:///` |
| APK容量 | 51,744,085 bytes |
| SHA-256 | `0d1f6de8eeaf5b82d8cd27e5ba6872c108f458760e093c19bb21e627519cf807` |
| ZIP整合性 | 成功 |
| APK Signature Scheme | v2署名あり、v1/v3なし |
| 署名証明書SHA-1 | `0D:A5:A7:0E:14:A2:A4:3A:DB:A8:F8:04:40:81:C5:B2:18:86:B5:BC` |

APK解析では、`FocusFlowWidgetProvider`が`APPWIDGET_UPDATE`を受信するexported receiverとして登録され、`FocusFlowWidgetItemsService`は`BIND_REMOTEVIEWS`を持つ非exported serviceとして登録されていることを確認した。Provider metadata resource `@7F140004`は`xml/focus_flow_widget_initial_info`へ、さらにその`initialLayout` resource `@7F0C0033`は`layout/focus_flow_widget_initial`へ解決された。これは署名APK内に登録安全層の定義が含まれることの確認であり、端末ランチャーでの追加成功を保証するものではない。

本人用APKは通常のGoogle Play版と別パッケージであり、通常版の無料制限・購入処理・Play配布には影響しない。

## 5. 未完了のAndroid実機受入

署名ビルドとAPK解析の成功は、AndroidランチャーでWidgetを追加できること、または実機のライト・ダーク表示とタップが合格することを意味しない。以下を本人用v4で判定する。

| ID | 実機操作 | 合格条件 |
|---|---|---|
| W-00 | ホーム画面長押しから`Focus Flow · Today`を追加する | 「ウィジェットを追加できませんでした」が出ず、初期面または一覧が表示される |
| W-01 | 追加直後とアプリ起動後を確認する | 白紙・クラッシュにならず、初期面／フォールバック面が出た場合もTodayへ復帰でき、同期後に一覧が更新される |
| W-02 | ライトモードで本文・補足・必須・時間帯・チェックを確認する | 背景に溶け込む文字がなく、本文を読める |
| W-03 | ダークモードで同じ項目を確認する | 見出し、本文、補足、境界、チェックを識別できる |
| W-04 | コンパクト・標準・大きめの文字サイズを切り替える | Todoと習慣が同じ規則で拡大縮小し、チェック領域と行高が破綻しない |
| W-05 | 小・中・大にリサイズしてスクロールする | 文字切れ、重なり、過大な空白、半端な最終行がなく、項目が多い場合はスクロールで見られる |
| W-06 | チェック、本文、ヘッダー／空状態をそれぞれ押す | チェックは完了／復元だけ、本文は該当詳細、ヘッダー／空状態はTodayを開く |
| W-07 | 集中制限の遮断画面で「項目を確認」を押す | 必ずTodayタブを開き、Unmatched Routeにならない |

Widget追加が再び失敗した場合は、端末名、Androidバージョン、ホームアプリ、旧本人用APKの有無、追加操作直後の表示を記録し、可能ならAndroidのログを取得する。実機合格前に通常版AABをPlayへ送らない。

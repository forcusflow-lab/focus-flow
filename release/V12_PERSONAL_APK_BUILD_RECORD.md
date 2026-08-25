# Focus Flow v12 — 本人用Plus APK更新ビルド記録

## 1. 対象

本記録は、通常のGoogle Play版から分離した本人用・制限なしPlus APKの更新ビルドを記録する。対象には、WidgetのUnmatched Route対策として導入したauthorityなしDeep Link構成と、Android更新インストール用のversionCode 2を含む。Google Play配布には使用しない。

| 項目 | 結果 |
|---|---|
| GitHubリポジトリ | `forcusflow-lab/focus-flow` |
| 対象コミット | `4045cb25566ea38b88eb0e071f5165aaeaafc871` |
| ワークフロー | `Build Focus Flow personal unlimited APK` |
| Run | [#2 / 32906598723](https://github.com/forcusflow-lab/focus-flow/actions/runs/32906598723) |
| 結果 | **成功** |
| 所要時間 | 20分46秒 |
| artifact | `focus-flow-personal-unlimited-apk` |
| APK | `app-release.apk` |

## 2. 成果物の静的確認

生成APKを一時領域へ取得して、圧縮データ、アプリ識別子、versionCode、APK Signature Scheme v2、証明書を確認した。

| 検証 | 実測結果 | 判定 |
|---|---|---|
| APKサイズ | 51,733,548 bytes | 取得完了 |
| ZIP整合性 | `No errors detected in compressed data` | 合格 |
| Android package | `com.app.focusflow.personal` | 通常版と分離 |
| versionCode | `2` | 更新インストール可能な増分 |
| APK署名 | v2署名あり | 合格 |
| signing certificate SHA-1 | `0D:A5:A7:0E:14:A2:A4:3A:DB:A8:F8:04:40:81:C5:B2:18:86:B5:BC` | 期待値と一致 |
| APK SHA-256 | `256b7502944d32d76a3a0c524a1ca857b4f80e171d752d4657e1bbbb71d6683c` | 記録済み |

## 3. Deep Link構成

このワークフローは`FOCUS_FLOW_PERSONAL_UNLIMITED=1`を明示し、クリーンExpo prebuildを実行している。生成APKのマニフェストでは、アプリIDが`com.app.focusflow.personal`、schemeが`manusfocusflowpersonal`、`host`を指定しないintent filterであることを確認した。ネイティブテンプレートと回帰テストは、Widget、遮断画面、詳細導線をauthorityなしの`manusfocusflowpersonal:///...`形式で生成するよう統一している。

## 4. 実機受入が必要な項目

静的確認と署名ビルドの成功は、端末上のルーティングを完了扱いにしない。更新APKを既存の本人用アプリへ上書きして、少なくとも次を実機で確認する。

| ID | 操作 | 合格条件 |
|---|---|---|
| P-01 | Widgetのヘッダー余白を押す | Unmatched RouteにならずTodayを開く |
| P-02 | WidgetのTodoまたは習慣の本文を押す | 該当詳細を開く |
| P-03 | Widgetのチェックを押す | 画面遷移せず完了・復元できる |
| P-04 | 制限アプリの遮断画面で「Focus Flowで項目を確認する」を押す | Todayを開く |
| P-05 | Androidの戻る操作を行う | 直前の画面へ自然に戻る |

GitHub Actions画面には、Action依存がNode.js 20を対象としており実行基盤でNode.js 24へ強制移行された旨の警告が1件表示された。APK生成・署名・artifact保存はいずれも成功しており、今回の配布候補を阻害する警告ではない。

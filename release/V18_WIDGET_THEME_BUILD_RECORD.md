# Focus Flow v18 / 本人用v8 高密度一覧カード・テーマ版 ビルド記録

**記録日:** 2026-08-26  
**対象コミット:** `a77dd40719665b892e63e2b95a7a78987660c184`  
**目的:** 実機で残ったWidgetの大きな濃色面、補足の文字切れ、区切り不足、透過による文字の低コントラストを、高密度一覧カードと背景のみ透過する構造へ置き換え、本人用実機受入へ渡す。

## 1. 実装・自動品質ゲート

| 検証 | 結果 |
|---|---|
| 全Vitest | 20 files / 64 passed / 1 skipped |
| TypeScript | 成功 |
| ESLint | 成功 |
| 通常版クリーンAndroid生成 | 成功。versionCode 18、一覧カードresource、旧Collection service不在を確認 |
| 本人用クリーンAndroid生成 | 成功。`com.app.focusflow.personal`、versionCode 8、一覧カードresource、旧Collection service不在を確認 |
| 生成Manifest・resource検証 | Provider、initial metadata、32dp header、48dp静的行、20dp視覚チェック、inset divider、light／dark card drawableを確認 |

## 2. 本人用・制限なし v8 APK

| 項目 | 値 |
|---|---|
| GitHub Actions | [Build Focus Flow personal unlimited APK run 32966775337](https://github.com/forcusflow-lab/focus-flow/actions/runs/32966775337) |
| Artifact | `focus-flow-personal-unlimited-apk` / ID `9606744000` |
| 結果 | 成功 |
| パッケージ | `com.app.focusflow.personal` |
| versionCode | `8` |
| versionName | `1.0.0` |
| APK容量 | 51,754,970 bytes |
| SHA-256 | `62ed64a75cf156d48efc18b5abc0c5dc986060127499a8122707ad35a399ead0` |
| ZIP整合性 | 成功 |
| APK Signature Scheme | v2署名あり、v1/v3なし |
| 署名証明書SHA-1 | `0D:A5:A7:0E:14:A2:A4:3A:DB:A8:F8:04:40:81:C5:B2:18:86:B5:BC` |

APK解析では、`FocusFlowWidgetProvider`、`APPWIDGET_UPDATE`、`xml/focus_flow_widget_initial_info`、`layout/focus_flow_widget_initial`を確認した。旧`FocusFlowWidgetItemsService`、`BIND_REMOTEVIEWS`、`ListView`は存在しない。初期layoutは48dp外側操作領域、中央20dp ImageView、最大2行、inset dividerを含む。

## 3. v8 実機受入

| ID | 操作 | 合格条件 |
|---|---|---|
| V18-01 | 小・中・大Widgetで、Todo／習慣を1件・2件表示 | 外側の余白を濃色面として塗らず、内側listCardだけが内容高で収まる。過大な空白・半端な補足・重なりがない |
| V18-02 | 短文・長文、必須、時間帯を混在させる | タイトルは1行で読みやすく省略され、補足は短い必須／時間帯タグだけ。文字切れが見えない |
| V18-03 | 透明度を0、50、100%に変更する | 背景だけが透過し、本文・補足・チェックはライト／ダーク双方で読める |
| V18-04 | ライト／ダーク、コンパクト・標準・大きめ文字を試す | surface、本文、補足、divider、必須、完了、無効を識別できる |
| V18-05 | 上段・下段の本文、チェック、ヘッダー／空状態を操作する | 詳細、該当行の完了／復元、Todayが混線しない |

v8は署名・生成物検証まで完了しているが、上記の実機受入が合格するまで、レイアウト・テーマが解消済みとは扱わない。

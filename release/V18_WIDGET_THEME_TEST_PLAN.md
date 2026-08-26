# Focus Flow v18 / Widget・テーマ反復テスト計画

## 1. 対象と判定方針

本計画は、本人用v7で操作合格後も残ったWidgetレイアウト崩れと、アプリ本体・Widgetのライト／ダーク反映漏れを対象とする。静的テスト、クリーンAndroid生成、署名APK解析、実機受入のすべてに合格するまで、設計・実装へ戻る。

| 区分 | 対象 | 合格条件 |
|---|---|---|
| W-L01 | Widget root・listCard | 外側は透明、内側listCardだけがsurfaceと角丸を持ち、固定全高の濃色面を持たない |
| W-L02 | Header・rows | 32dp header、48dp行、最大2件、2行目だけinset divider、個別濃色カードなし |
| W-L03 | 長文・補足 | タイトルは1行省略、補足は短い必須／時間帯のみ。切れた補足、重なり、半端な文字がない |
| W-L04 | 操作 | 48dp操作領域と20dp視覚チェックを保ち、本文・チェック・Todayが混線しない |
| W-C01 | Widget light | surface、本文、補足、divider、完了、必須、無効を判読できる |
| W-C02 | Widget dark | W-C01と同じ。ライト専用色が混ざらない |
| A-C01 | 共通UI | IconButton、EmptyState、Pill、Loadingがpaletteのsurface／text／muted／borderだけで描画される |
| A-C02 | 主要画面 | Today、Todo、習慣、メモ、振り返り、その他、設定、Plus、法務、サポート、起動の固定ライト色を監査し、残件を画面別に記録する |
| N-01 | Android生成 | Provider metadata、static layout、resource、light／dark drawable、旧Collection service不在を確認する |
| D-01 | 実機 | 小・中・大、1件・2件、短文・長文、必須・時間帯、完了・復元、ライト・ダーク、文字サイズ3段階で受入する |

## 2. 反復手順

1. 失敗を静的テストまたは実機再現手順として記録する。  
2. 仕様・レイアウト・テーマ契約をレビューし、採用判断を記録する。  
3. 実装と単体／静的テストを更新する。  
4. 全Vitest、TypeScript、ESLint、通常・本人用クリーンprebuildを実行する。  
5. 本人用署名APKを解析し、実機受入を行う。  
6. いずれか1件でも不合格なら、原因・影響範囲を追記して1へ戻る。

## 3. 出荷判定

本人用APKの実機受入が合格するまで、通常版AABのPlay内部テスト配布・公開は行わない。通常版を配布する場合は、同一コミットから通常版AABを署名ビルドし、証明書・versionCode・Widget resourceを独立検証した後、アカウント所有者の明示確認を受ける。

# Focus Flow v9 全面視覚品質監査台帳

**目的:** v8で実機再現したWidgetの「ウィジェットを表示できません」、ダーク設定画面の白面・白文字、Todo必須ラベルの切れを、孤立した不具合ではなく、画面・状態・ネイティブ導線を横断する品質不全として扱う。未検証または不合格が残る間はAPK配布を禁止する。

## 1. 採用する表示品質の根拠

Material 3は、小さい文字に背景との少なくとも4.5:1、グラフィック・大きい文字に少なくとも3:1のコントラストを推奨する。[1] 連続リストでは、主要テキストと補助視覚要素を同じ位置へ揃え、短いラベル、必要時だけの補足、安定した行構造により走査しやすくする。[2] ダークテーマは、暗い面を主に使い、アクセントを限定し、面・本文・状態の全てでコントラストを満たす必要がある。[3]

> **v9の合格定義:** コード・Lint・APK署名・XML解析の成功ではなく、対象実機のスクリーンショットで各ケースが読め、切れず、誤操作せず、状態が正しく反映されること。

## 2. 全画面・全状態の監査範囲

| 領域 | 画面・導線 | 必須状態 |
|---|---|---|
| 起動・基盤 | 起動、タブ、戻る、Deep Link、端末テーマ変更 | light／dark、初回／復元、文字サイズ3段階 |
| 実行管理 | Today、Todo、習慣、詳細、作成・編集、時間帯、日付選択 | 空／1件／複数件、短文／長文、必須／通常、完了／未完了、時間ロック、無料上限 |
| 記録・分析 | メモ、振り返り、その他、Insights | 空／入力中／保存済み／エラー、light／dark |
| 設定 | 設定ホーム、表示と言語、Widget、通知、集中制限、Plus、データ、端末設定案内 | light／dark、全テーマ、全フォント、文字サイズ、選択／未選択、無効／警告、モーダル |
| 公開情報 | 利用条件、プライバシー、サポート、ヘルプ | 読み込み／空／エラー、light／dark、長文スクロール |
| 集中制限 | アプリ選択、遮断、厳格モード、項目確認 | 有効／無効、対象あり／なし、Today遷移、戻る |
| Widget | 追加、同期、再描画、本文、チェック、詳細、Today、透明度 | 小／中／大、空／1件／2件、短文／長文、必須／通常、完了／復元、light／dark、文字サイズ3段階、透明度0／50／100 |

## 3. v8実機失敗を起点とするP0テストケース

| ID | 再現条件 | 期待表示 | 不合格条件 |
|---|---|---|---|
| W-ADD | 新規追加直後、アプリ起動後、ホームへ復帰後、再描画後 | Widgetのヘッダー・空状態または行が読める | `ウィジェットを表示できません`、白紙、クラッシュ |
| W-STRUCT | 小・中・大、空・1件・2件、短文・長文 | 行は切れず、Widget面は内容を邪魔しない | 半端な行、重なり、過大空白、文字切れ |
| W-ACTION | 上段・下段の本文・チェック・ヘッダー | 詳細、該当行だけの状態変更、Todayが分離 | 行間の状態混線、誤遷移 |
| W-THEME | light／dark、透明度0・50・100、文字3段階 | 本文・補足・境界・チェックを判読できる | 背景に溶ける文字、透過で本文も薄くなる |
| S-APPEARANCE | 表示と言語でlight／dark、各テーマ・フォント・文字サイズ | 見本、選択肢、説明、ラジオ、境界が読める | 白面＋白文字、淡色ラベル、選択状態不明 |
| T-REQUIRED | Todo／習慣／Today／Widgetで必須項目、文字3段階 | `必須`を完全に読める | `必`だけ、切れ、縮み、重なり |

## 4. 配布停止基準

1. 上表のP0テストに対応する**対象実機スクリーンショット**が存在しない。  
2. 1件でも表示不能、低コントラスト、文字切れ、誤操作、テーマ反映漏れがある。  
3. 全画面監査台帳のP0／P1に未検証が残る。  

上記のいずれかに該当するAPKは、検証候補・本人用・通常版を問わず配布しない。修正後は同じケースを最初から再実行し、スクリーンショット、テスト結果、未検証事項をビルド記録へ残す。

## 5. v8 Widget表示不能の根本原因

Androidの`RemoteViews`は、使用できるlayoutを`FrameLayout`、`LinearLayout`、`RelativeLayout`等に、widgetを`TextView`、`ImageView`等に限定している。生の`View`はこの許可一覧に含まれない。[4] v8の`focus_flow_widget_initial.xml`には、背景専用とinset dividerのための生の`View`が2個含まれていた。v7では動作していた静的Widgetにv8でこの構造を追加した直後、実機で`ウィジェットを表示できません`が再現したため、**生の`View`をRemoteViews layoutへ入れた点を高リスク仮説**として扱う。ただし、ランチャー実機でv9を再受入するまで、これを単独の確定原因とは断定しない。

v9では、Widget XMLから生の`View`を完全に除去する。背景とdividerは、RemoteViewsで許容される`FrameLayout`／`LinearLayout`／`TextView`だけで構成する。透過率は`setFloat(..., "setAlpha", ...)`で親や本文を操作せず、段階別のshape drawableを`setBackgroundResource`で選択する。これにより、文字・チェックを薄くせず、RemoteViewsの許容View階層を維持する。

| v8要素 | 問題 | v9置換 |
|---|---|---|
| `View#focus_flow_widget_card_background` | RemoteViews許可widget外 | `FrameLayout#focus_flow_widget_card`のshape background |
| `View#focus_flow_widget_static_divider` | RemoteViews許可widget外 | 1dp高の`TextView` divider |
| `setFloat(cardBackground, setAlpha)` | unsupported hierarchy上の動的alpha。本文の可読性問題も招いた | 0／25／50／75／100%ごとのshape drawableを選択 |

## References

[1]: https://m3.material.io/foundations/designing/color-contrast "Color contrast – Material Design 3"
[2]: https://m3.material.io/components/lists/guidelines "Lists – Material Design 3"
[3]: https://m2.material.io/design/color/dark-theme.html "Dark theme – Material Design"
[4]: https://developer.android.com/reference/android/widget/RemoteViews "RemoteViews API reference – supported layouts and widgets"

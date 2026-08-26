# Focus Flow v11 Widget再設計仕様

## 実機不合格の整理

v10はWidgetを配置できた一方で、リサイズ後も情報量が変わらず、行内の必須・回数操作が過密で、目標とする単一リストカードの視線誘導になっていない。原因仮説は、Providerが現在のサイズではなく`OPTION_APPWIDGET_MAX_WIDTH`／`MAX_HEIGHT`を優先して参照していたため、常に最大バケットを選ぶことにある。また、カード本体が`wrap_content`であり、配置領域の変化をカード面に反映できていない。

Androidでは、サイズ変更時に`onAppWidgetOptionsChanged()`で新しいoptionsを受け、サイズレンジに応じた少数のレイアウトを提供することが推奨されている。[1]

## v11の表示設計

| サイズ | 表示 | 情報密度 |
|---|---|---|
| 小 | 見出し、進捗、1行 | 本文と丸形の完了操作だけを優先する |
| 標準 | 見出し、進捗、2行 | Todo/習慣のタイトル、必須、最小限の補足を表示する |
| 大 | 見出し、進捗、最大3行 | 3件の一覧と、回数習慣の簡潔な進捗のみを表示する |

Widgetは、余白を持つ一枚のsurfaceカードに統一する。ヘッダーには日付または「今日」と短い進捗を置き、各行は左の**丸形完了操作**、中央のタイトルと必須Pill、右または補足部の最小情報で構成する。行ごとの過大な±ボタン、同時表示された複数の装飾、4行目は廃止する。回数習慣は大サイズでのみ小さな進捗値を表示し、操作は本体詳細へ委譲する。時間習慣も同様に本体へ遷移させ、Widgetの読みやすさと誤タップ防止を優先する。

## 実装方針

1. `onAppWidgetOptionsChanged()`で渡されたBundleを直接使用し、`OPTION_APPWIDGET_MIN_WIDTH`／`MIN_HEIGHT`を優先して1/2/3行を決定する。
2. 初回更新ではmanagerのoptionsを使うが、リサイズ更新では受信optionsをそのまま描画へ渡す。
3. カード面を`match_parent`にし、利用可能な外形の変化を内部surfaceへ反映する。
4. テーマはpaletteのsurface/text/muted/primarySoftを使い、ライトでは白いリストカード、ダークでは高コントラストsurfaceにする。
5. 本体のHabit/Today HabitではTodoと同じPillコンテナを使用し、`numberOfLines={1}`によるPill隣接テキストの圧迫を撤去する。

## v11受入基準

| ID | 合格条件 |
|---|---|
| R-01 | 小・標準・大への変更後、Widget内部が1/2/3行で変わる |
| R-02 | Widget外形とsurfaceカードが配置枠に追従し、余白・文字が切れない |
| R-03 | 大サイズでも最大3行で、各行は丸形の操作、タイトル、必須Pillが読める |
| R-04 | ライト/ダーク双方でカード、本文、補足、必須Pillが高コントラストである |
| R-05 | Habit/Today Habitの必須Pillが文字サイズ3段階で`必須`と完全に読める |

## References

[1]: https://developer.android.com/develop/ui/views/appwidgets/layouts "Android Developers: Provide flexible widget layouts"

## 自動検証結果

| 検証 | 結果 |
|---|---|
| Vitest | 25 files / 76 passed / 1 skipped |
| TypeScript | `pnpm check` 成功 |
| Lint | `pnpm lint` 成功 |
| 通常版クリーン生成 | versionCode 21、Provider、3行layout、丸角Pill/丸形チェックdrawable、禁止Collection経路不在を確認 |
| 本人用クリーン生成 | `com.app.focusflow.personal` / versionCode 11、専用scheme、Provider、3行layout、新drawable、禁止Collection経路不在を確認 |
| 本人用署名APK | GitHub Actions run `33019053821`の成果物をZIP整合性、SHA-256、package/versionCode、v2署名、既存証明書、専用scheme、Provider、3行Widget資産、旧Collection経路不在まで独立確認 |

署名成果物の識別情報と実機受入シートは `release/V11_PERSONAL_SIGNED_BUILD_RECORD.md` に記録する。これらはソースと生成資産の検証であり、ランチャー上で外形・行数が実際に変わることは保証しない。小・標準・大のリサイズ、ライト/ダーク、必須Pill、丸形完了操作は実機スクリーンショットで受入する。

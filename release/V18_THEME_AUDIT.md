# Focus Flow v18 ライト／ダークテーマ監査台帳

**基準日:** 2026-08-26  
この台帳は、`useFocusPalette`によるテーマ橋渡しが存在しても、固定したStyleSheet色が残ることで起きるライト／ダークの反映漏れを画面単位で追跡する。

## 1. v18で是正済み

| 対象 | 是正内容 | 確認方法 |
|---|---|---|
| Widget | 全高背景を廃止し、背景のみ透過する内側一覧カード、明示light／dark surface、onSurface、dividerへ変更 | 静的Widgetテスト、クリーンAndroid生成、実機受入予定 |
| 共通UI | IconButton、EmptyStateの固定白背景・固定境界をpalette surface／borderへ移行 | 静的テーマテスト |
| 起動 | 固定濃緑の面・StatusBar・文字をdisplaySettingsのresolved paletteへ移行 | 静的テーマテスト |

## 2. 固定色が残る画面と優先順位

| 優先 | 画面・部品 | 監査結果 | 次の是正方針 |
|---|---|---|---|
| P0 | Settings | cards、entries、input、choice、segmented、modal、widget設定説明に固定白／淡色／境界が広く残る | panel paletteを導入し、surface／elevated／border／text／mutedへ一括移行する |
| P0 | Today / Habits | 完了・必須・進捗・空状態の固定淡色、白カード、check borderが残る | item row tokenを共通化し、required／done／warningをlight／dark別の意味色へ移行する |
| P1 | Notes / Insights / More | カード、placeholder、metric、icon tintに固定白／淡色が残る | screen paletteを導入してsurface、elevated、muted、borderを差し替える |
| P1 | Task / Habit form・時間帯 selector・日付 picker | modal sheet、入力、option、required、statusに固定色が残る | form paletteを導入し、modal／input／selection／warning stateを意味色で統一する |
| P2 | Device setup | tutorial sheet、進捗、permission stateに固定色が残る | setup paletteを導入し、permission state以外を共通surfaceへ移行する |

## 3. 完了判定

固定色の全廃ではなく、**ブランド・警告・成功・破壊的操作として意味を持つ固定色だけを明示許可**し、それ以外の面・本文・補足・境界・入力・モーダルをpalette tokenへ移す。各画面のlight／darkで、本文と背景、補足と背景、境界とsurface、選択と未選択、完了と未完了が識別できることを実機で受入する。

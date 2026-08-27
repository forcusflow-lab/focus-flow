# Focus Flow v21 制限対象一覧・ブロック画面・起動画面仕様

## 1. 背景と目的

v20のWidget、フォーム、メモの品質是正を完了した後、実機で確認された「制限対象アプリ一覧の行のガタつき」「ブロック画面のテーマ非連動」「起動画面が四角いアイコンだけに見える」問題を修正する。対象はAndroid-firstであり、アクセシビリティサービスによる遮断の強度、Todayへの安全な復帰、既存の必須条件・時間帯・厳格モードを後退させない。

Material Designは、縦一覧で先頭の視覚要素と主テキストを全行で揃え、複数選択ではチェックボックスを先頭または末尾へ一貫配置することを推奨する。[1] Androidの視覚アクセシビリティでは、本文文字のコントラスト4.5:1以上、非文字要素3:1以上、タッチ対象48dp以上が指針である。[2] 本設計はこれらを最低条件とする。

## 2. 画面別設計

| 画面 | 課題 | v21の設計 |
|---|---|---|
| 制限対象アプリ一覧 | チェック、アプリ名、package名の開始位置と高さが行ごとに乱れ、長い文字で読み取りにくい | 64dp以上の連続行へ統一する。48dpのチェック操作を先頭に固定し、名称（1行）とpackage名（1行）を同じx座標で積む。選択時は**行全体**の面・チェック・末尾の選択状態を変え、名称／package名の位置は変えない。 |
| 選択中のアプリ | 選択済み項目が情報カードの中で視認しにくい | 一覧と同一の2行レイアウトを使う。左はlock、中央は名称／package名、末尾は「制限中」状態だけとし、操作なしの情報行へ分離する。 |
| ブロック画面 | 緑の固定色で本体テーマ・dark／lightと一致しない | `widgetPalette`と同じ同期済みpaletteの`background`、`elevated`、`surface`、`text`、`muted`、`primary`、`primarySoft`を使う。ブロック理由、残る必須数、Todayを開く主操作、厳格モード説明を明確な階層で表示する。 |
| 起動画面 | ネイティブ初期表示が四角いアイコンだけに見え、アプリ内の遷移と連続しない | Android 12+のOS Splashでは単色背景と円形マスクの制約を守り、ロゴを小さく無背景化してから、JS起動画面のフルスクリーン背景・淡い図形・Focus Flowマーク・控えめなフェード／スケール遷移へ連結する。OS Splashに長い文言や不必要な待機を加えない。 [3] |

## 3. 状態遷移

| 起点 | 状態 | 操作 | 結果 |
|---|---|---|---|
| 制限設定 | 未選択 | 行または48dpチェック領域をタップ | 行全体が選択面になり、チェックがオンになる。無料上限時はロック状態と理由を維持する。 |
| 制限設定 | 選択済み | 同じ行をタップ | チェックと選択面がオフになり、選択中一覧から除外される。 |
| 制限対象アプリを前面化 | 必須未完了 | Accessibility Serviceが遮断 | 同期済みテーマでブロック画面／オーバーレイを表示する。対象アプリへタップを通さない。 |
| ブロック画面 | 表示中 | 「今日の項目を確認」をタップ | Focus Flowの**今日**タブを開き、Activity／Overlayを閉じる。 |
| 起動 | cold / warm start | OS SplashからReact rootが準備完了 | OS Splashは即時にアプリ内フルスクリーンへ渡し、300ms以下の控えめなモーション後に操作可能な画面を表示する。 |

## 4. 実装方針

### 4.1 制限対象アプリ一覧

`AppPicker`、`SelectedApps`、時間帯別の`RoutineAppPicker`を、共通の`AppSelectionRow`へまとめる。ネイティブからアプリアイコンURIを提供しない現状では、先頭のチェックボックスを識別子として固定し、名称とpackage名が正確に揃うことを優先する。検索欄もpaletteに従わせ、固定の淡色placeholderを残さない。

### 4.2 ブロック画面

`FocusGateService`とフォールバックの`FocusGateActivity`は、gate state内の`widgetPalette`を読み、色を安全な既定値へフォールバックする。主操作は48dp以上、Todayへ進む操作は一つだけにする。厳格モード中は端末設定への逃げ道を出さず、通常モードだけに補助設定導線を残す。Accessibility Overlayの再判定、recent appsからの再遮断、Deep Linkの`CLEAR_TOP`は維持する。

### 4.3 起動画面

Android 12以降、OS Splashはアプリアイコンと単色window backgroundを表示するOS管理画面である。[3] そのため、アプリ内でより長いブランド表現を重ねず、OS Splash側は透明背景の小さいロゴとMistの単色面、React root側は現在のテーマを反映するフルスクリーンのマーク・二層の淡い面・短いモーションへ役割を分ける。モーションは最大300ms、データ読み込み完了後に即時終了し、操作や読み上げを遮らない。

## 5. テスト計画

| 区分 | ケース | 合格条件 |
|---|---|---|
| 一覧レイアウト | 日本語・英語、長い名称、長いpackage名、0件、多数件、選択／未選択、無料上限 | 全行でチェック・名称・補足の開始位置が一致し、行高・境界・省略表示が安定。選択操作は行全体で48dp以上。 |
| ブロック画面 | 6テーマ×light／dark、通常／厳格、必須0件／未完了、Activity／Overlay、Today遷移 | 面、本文、補足、主操作が読め、対象アプリを再前面化しても遮断を維持。Todayを正しく開く。 |
| 起動画面 | cold start、warm start、light／dark、設定読み込み遅延、reduce motion相当 | 四角いアイコンだけの静止画で終わらず、OS Splashからテーマ同期の起動画面へ滑らかに移行。無限待機・白画面・タップ阻害なし。 |
| 回帰 | Focus Gate、時間帯、厳格モード、Widget、戻る、Deep Link | 遮断・解除・Today遷移・Widget操作・既存の必須条件に後退がない。 |

## 6. 実機受入基準

| ID | 実機操作 | 合格条件 |
|---|---|---|
| V21-R01 | 制限対象アプリを検索し、長い名称／package名を含めて選択・解除する | 行がずれず、チェック・名称・package名・選択状態が一貫して読み取れる。 |
| V21-R02 | light／darkと全6テーマで制限設定一覧を確認する | 固定白面、不可視文字、テーマ非連動ボタンがない。 |
| V21-R03 | 必須未完了の状態で制限対象アプリを開き、recent appsから再開する | テーマに沿ったブロック画面が表示され、対象アプリを利用できず、Todayへ遷移できる。 |
| V21-R04 | 通常／厳格モードのブロック画面を確認する | 状態説明と操作が矛盾せず、厳格モードで不適切な設定回避導線がない。 |
| V21-R05 | cold startとwarm startを繰り返す | 透過的なマークと控えめなモーションによるフルスクリーン起動画面へ遷移し、白画面・四角いアイコン単体・操作遅延がない。 |

## 7. 実装・自動検証状況

2026-08-27時点で、`AppPicker`、`SelectedApps`、時間帯別`RoutineAppPicker`を64dpの共通`AppSelectionRow`へ統合し、48dpのチェック操作、名称とpackage名の二行、選択・上限・制限中状態を揃えた。`FocusGateService`とフォールバックの`FocusGateActivity`は、同期済み`widgetPalette`からテーマを復元し、Todayを開く主操作と通常モードだけの補助設定導線を実装した。起動画面では透明ロゴを使い、OS Splashの小さい無背景マークからテーマ連動フルスクリーン導入へ接続した。

`focus-flow-v21-gate-list-and-launch.test.ts`を追加し、全Vitest **32 files / 96 passed / 1 skipped**、TypeScript、CI Lint、通常版／本人用のクリーンAndroid生成を確認した。GitHub Actions run `33110049736`でFocus GateのKotlinを含む本人用release署名APKを成功生成し、artifact digest、APK整合性、package／versionCode、v2署名、既知証明書、Focus Gate・Widget Provider・個人用schemeを独立検証した。V21-R01〜R05は実機受入前である。

## References

[1]: https://m3.material.io/components/lists/guidelines "Material Design 3: Lists"
[2]: https://developer.android.com/design/ui/mobile/guides/foundations/accessibility "Android Developers: Accessibility"
[3]: https://developer.android.com/develop/ui/views/launch/splash-screen "Android Developers: Splash screens"

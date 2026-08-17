# Focus Flow ストア提出パック

**作成日:** 2026-08-17  
**対象バージョン:** 1.0.0  
**編集者:** Manus AI

この文書は、現行アプリの実装内容に合わせた提出準備用ドラフトです。角括弧で示す項目は、アカウント所有者が実在する情報に差し替える必要があります。仮のメールアドレス、URL、会社名、価格を入力したまま提出してはいけません。

## ストア掲載文

| 項目 | 日本語案 | 英語案 |
|---|---|---|
| アプリ名 | Focus Flow | Focus Flow |
| カテゴリ | 仕事効率化 | Productivity |
| サブタイトル | 今日の必須を整え、集中を続ける | Plan must-dos and protect your focus |
| Google Play短い説明 | Todo・習慣・日課を一つにまとめ、今日の集中を支えるローカル完結型プランナー。 | A private planner for tasks, habits, routines, and daily focus. |
| 価格 | 無料。任意のFocus Flow Plus定期購入あり。 | Free with an optional Focus Flow Plus subscription. |

### Google Play 詳細説明（日本語）

Focus Flowは、今日やるべきことを落ち着いて整理し、習慣と日課を続けるためのローカル完結型プランナーです。Todo、習慣、メモ、日課ルール、1日1回のリマインダーを一つにまとめ、進捗を振り返れます。

Androidでは、任意の「集中ルール」を使えます。あなたが選んだアプリを開いたとき、未完了の必須項目がある場合だけルールを適用します。画面の文字、メッセージ、入力内容、スクリーンショットは読み取りません。いつでもFocus FlowまたはAndroidの設定から無効にできます。iPhoneでは、Todo、習慣、メモ、日課、リマインダー、振り返りを追加の端末権限なしで利用できます。

無料版ではTodo・習慣・メモを各2件、制限対象アプリを合計5件まで使えます。言語、配色、ライト／ダーク表示、文字、文字サイズ、カード表示、ホーム画面ウィジェットの見た目は無料です。Focus Flow Plusは、これらの件数上限を解除し、名前付きテーマセットを保存・呼び出すための任意の定期購入です。分を目標にしたTodo・習慣は設定時間の経過後に完了し、時間前に完了する場合は1回限りの消費型早期完了商品を使えます。

### Apple App Store 詳細説明（英語）

Focus Flow is a private, on-device planner for the things you need to do today. Keep tasks, habits, notes, routines, and one gentle daily reminder in one calm place, then review your progress at the end of the week.

On iPhone, Focus Flow gives you planning, routines, reminders, notes, and progress review without requiring extra device permissions. Language, color, light or dark appearance, type, text size, card style, and widget styling are free for everyone.

The free plan includes 2 tasks, 2 habits, 2 notes, and 5 limited apps in total. Focus Flow Plus is an optional subscription that removes these limits and lets people save and reuse named appearance sets. Your App Store purchase sheet shows the current price, billing period, and renewal terms before you confirm. Restore or manage a previous subscription at any time from Settings. Timed tasks and habits complete only after their configured time elapses; customers can buy a one-time consumable early completion for one item when needed.

## 審査メモ

| 提出先 | 入力すべき審査メモ |
|---|---|
| Google Play | Focus Flow uses AccessibilityService only after an in-app disclosure and affirmative user action. It observes only foreground-window changes for apps the user selected to apply an optional focus rule. The service has `canRetrieveWindowContent=false`; it does not read screen text, messages, typed content, or screenshots. Users can disable the service in Focus Flow or Android Settings. `QUERY_ALL_PACKAGES` is used to present the launcher-app picker required for user-selected focus rules; installed-app data is neither transmitted off-device nor used for ads or analytics. `focus_flow_early_complete_100` is a consumable one-time product that completes one timed task or habit before its timer expires. |
| App Store | This iPhone build provides tasks, habits, notes, routines, reminders, and progress review. It does not restrict other apps and does not request Android Accessibility permissions. Focus Flow Plus is an optional auto-renewable subscription that removes content limits and enables named appearance-set storage. `focus_flow_early_complete_100` is a consumable one-time purchase for early completion of one timed item; it is not restorable. Provide a TestFlight sandbox account only if App Review requests store-account testing; the app has no separate user-login requirement. |

## 収益化の商品設定

両ストアで **`focus_flow_plus`** を自動更新サブスクリプションとして作成し、Plusの価格・請求期間・無料トライアルの有無を設定します。さらに **`focus_flow_early_complete_100`** を消費型の1回限り商品として作成し、日本の価格を¥100に設定します。早期完了商品は購入成功後に対象項目1件へ付与し、復元対象にはしません。詳しい手順は [ONE_TIME_UNLOCK_PRODUCT_SETUP_JA.md](./ONE_TIME_UNLOCK_PRODUCT_SETUP_JA.md) を参照してください。

アプリは購入、復元、有効状態の再照会、ストアのサブスクリプション管理画面への遷移を実装しています。ストアの商品を設定する前は商品が見つからない旨を表示し、Expo Goではネイティブ課金を利用しません。公開前に、ライセンステスター／TestFlightサンドボックスで、購入成功、購入キャンセル、復元、更新、支払い失敗、解約後の満了を確認してください。[1] [2]

## プライバシー・サポートの公開URL

AppleではプライバシーポリシーURLが必須であり、AppleとGoogleの両ストアでユーザーが到達できるサポート導線を設定する必要があります。[3] [4] 次の2つを、所有・維持できる公開HTTPSドメインで用意してください。

| 必要なURL | 提出前に確定する値 | 必要な内容 |
|---|---|---|
| プライバシーポリシー | `[https://example.com/focus-flow/privacy]` | 収集・利用・共有、端末内保存、Accessibility、アプリ一覧、課金、保持・削除、連絡先、改定日 |
| サポート | `[https://example.com/focus-flow/support]` | `[サポートメールアドレス]`、FAQ、課金／復元／返金の案内、対応時間 |

アプリ内の「プライバシーとデータ」「FAQ・サポート」「利用条件とサブスクリプション」は実装済みです。公開URLと連絡先は、事実と整合するようアカウント所有者が設置・入力する必要があります。Appleのプライバシー回答とGoogle PlayのData safety回答は、組み込みSDKも含めた実際のデータ処理を正確に反映してください。[3] [4]

## 提出素材

ストアのスクリーンショットは、タイトル画面やスプラッシュ画面ではなく、実際の画面と価値が分かる内容にしてください。[5] 以下の5枚を推奨します。

1. 今日のTodoと必須項目が分かるホーム画面。
2. 習慣と日課の進捗を確認する画面。
3. リマインダーと集中ルールを設定する画面。
4. 無料の言語・外観・文字サイズの設定画面。
5. Androidのみ、集中ルールの説明と安全停止の画面。iPhone用素材にはアプリ制限を掲載しない。

## 提出直前のチェック

| 確認事項 | 担当 |
|---|---|
| `com.app.focusflow` の識別子を継続保有できることを確認する | アカウント所有者 |
| App Store Connect・Play Consoleの契約、税務、銀行情報を完了する | アカウント所有者 |
| `focus_flow_plus` と `focus_flow_early_complete_100` を両ストアで作成し、価格・請求期間・消費型設定を決める | アカウント所有者 |
| PlayのData safety、Accessibility、`QUERY_ALL_PACKAGES`申告を完了する | アカウント所有者 |
| App StoreのApp Privacy、年齢レーティング、サポートURL、プライバシーURLを完了する | アカウント所有者 |
| TestFlightとPlay内部テストでIAPの全ケースを実機検証する | アカウント所有者・テスター |
| 実機画面をもとにストア素材をアップロードする | アカウント所有者 |

## References

[1]: https://developer.android.com/google/play/billing/test "Google Play Billing testing"
[2]: https://developer.apple.com/in-app-purchase/ "Apple In-App Purchase"
[3]: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/ "Apple: Manage app privacy"
[4]: https://developer.android.com/privacy-and-security/declare-data-use "Android: Declare your app's data use"
[5]: https://developer.apple.com/app-store/review/guidelines/ "Apple App Review Guidelines"

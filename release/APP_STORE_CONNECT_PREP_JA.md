# Focus Flow App Store Connect 提出準備パック

**対象:** Focus Flow 1.0.0  
**Bundle ID:** `com.app.focusflow`  
**課金商品ID:** `focus_flow_plus`、`focus_flow_early_complete_100`  
**作成日:** 2026-08-17  
**編集者:** Manus AI

## 提出方針

Focus Flowは、Todo、習慣、メモ、日課、通知、振り返りを端末内で使える集中支援アプリです。無料版ではTodo・習慣・メモを各2件、制限対象アプリを合計5件まで利用できます。**Focus Flow Plusは、これらの上限を解除し、名前付きテーマセットを保存・呼び出す任意の自動更新サブスクリプション**です。言語、配色、外観モード、文字サイズ、ウィジェットの見た目は無料です。時間管理項目を設定時間前に完了する場合は、消費型の1回限り商品を使います。

Appleは、iOSアプリごとに公開可能なプライバシーポリシーURLと、組み込みSDKを含む実際のデータ利用に基づいたApp Privacy回答を求めています。[1] 自動更新サブスクリプションは、アプリ内で内容、期間、更新価格、復元・管理方法を明確に示す必要があります。[2]

## App Store Connect 入力値

| 入力欄 | 提出値または入力方針 |
|---|---|
| App Name | `Focus Flow` |
| Subtitle | `Plan must-dos and protect your focus` |
| Primary Category | Productivity |
| Bundle ID | `com.app.focusflow` |
| Content Rights | 第三者の著作物を含めない限り、必要な権利を保有している旨を選択 |
| Age Rating | アプリの実際の内容に沿って質問へ回答。成人向け、ギャンブル、医療診断、ユーザー間交流は提供しない。 |
| Privacy Policy URL | 公開HTTPSの最終URL。`release/public-pages/privacy.html` を所有ドメインまたはGitHub Pages等へ配置後に入力。 |
| Support URL | 公開HTTPSの最終URL。`release/public-pages/support.html` を配置し、実在する連絡先を設定後に入力。 |
| Marketing URL | 任意。公開済みの紹介ページがなければ空欄でよい。 |

## ストア掲載文

### 英語の説明文

> Focus Flow is a private, on-device planner for the things you need to do today. Keep tasks, habits, notes, routines, and one gentle daily reminder in one calm place, then review your progress at the end of the week.
>
> On iPhone, Focus Flow gives you planning, routines, reminders, notes, and progress review without requiring extra device permissions. Language, color, light or dark appearance, type, text size, card style, and widget styling are free for everyone.
>
> The free plan includes up to 2 tasks, 2 habits, 2 notes, and 5 limited apps in total. Focus Flow Plus is an optional subscription that removes those limits and lets you save and reuse named appearance sets. Your App Store purchase sheet shows the current price, billing period, and renewal terms before you confirm. Restore or manage a previous subscription at any time from Settings. Timed tasks and habits complete after their configured time elapses; customers can buy a one-time consumable early completion for one item when needed.

### キーワード案

`planner, todo, habits, routine, focus, productivity, reminders, daily planning`

キーワードはApp Store Connect側で重複語を削除し、競合他社名、価格、誤解を招く表現を入れないでください。[3]

## App Privacy 回答の準備

現行のFocus Flowは、計画データと表示設定を端末内のアプリ保存領域に保持し、広告・行動分析SDKを使用しません。購入の決済情報はAppleの購入フローで扱われ、アプリ開発者がカード情報を受け取りません。Appleの定義では、端末内のみの処理は「収集」に当たりません。[4]

ただし、**最終回答は提出するビルドに含まれるSDKと実際の通信をアカウント所有者が再確認してから**選択してください。現行設計どおりで、開発者または第三者が端末外にデータを保持・利用しないことを確認できる場合は、App Privacyの最初の質問で **“No, we do not collect data from this app”** を選択する候補です。クラッシュレポート、分析、サポートフォーム、認証、外部APIなどを後から有効化した場合は、該当するデータ種別と用途を申告します。[1] [4]

## Focus Flow Plus の設定

| 項目 | 提出値 |
|---|---|
| Subscription Group Reference Name | `Focus Flow Plus` |
| Subscription Group Display Name | `Focus Flow Plus` |
| Product ID | `focus_flow_plus` |
| Reference Name | `Focus Flow Plus` |
| Display Name | `Focus Flow Plus` |
| Description | `Remove content limits and save and reuse named appearance sets in Focus Flow.` |
| Type | Auto-Renewable Subscription |
| 対象機能 | Todo・習慣・メモ・制限対象アプリの上限解除と、名前付きテーマセットの保存・呼び出し。表示設定は無料。 |
| 価格・期間 | アカウント所有者が最終決定。アプリ内はストアの現地価格・請求期間を表示する。 |
| Family Sharing | オンにすると後から戻せないため、初回はオフを推奨。共有価値を提供する方針に変える場合だけ有効化する。 |

商品ローカライズ、価格、審査用スクリーンショットを設定し、アプリのバージョンと一緒に審査へ提出します。Appleは、審査者に課金商品が見つかり、実際に動作するよう求めています。[3] [5]

## 消費型早期完了の設定

| 項目 | 提出値 |
|---|---|
| Product ID | `focus_flow_early_complete_100` |
| Reference Name | `Finish early (one time)` |
| Display Name | `Finish early (one time)` |
| Type | Consumable In-App Purchase |
| 日本語表示名 | `時間前に完了する（1回）` |
| Description | `Finish one timed task or habit before its scheduled time elapses.` |
| 価格 | 日本は¥100。その他の地域はストア価格表に従う。 |
| 復元 | 対象外。消費型商品のため、購入を復元には含めない。 |

審査時は、時間管理のTodoまたは習慣を作成し、計測開始後に早期完了を試すと購入導線が見えます。購入成功時は対象項目だけが完了し、消費型として同じ商品を再購入できます。詳細は `ONE_TIME_UNLOCK_PRODUCT_SETUP_JA.md` を参照してください。

## Notes for Review（貼り付け用）

> Focus Flow is an on-device planner. No account or login is required. The core features—tasks, habits, notes, routines, reminders, and display settings—are free.
>
> The iPhone build does not restrict other apps and does not use Android Accessibility. Focus Flow Plus is an optional auto-renewable subscription (`focus_flow_plus`) that removes task, habit, note, and limited-app limits and enables named appearance sets. `focus_flow_early_complete_100` is a consumable one-time purchase for one timed item before its timer expires; it is not restored. The purchase flow uses the App Store purchase sheet, and Settings contains Restore purchases and Manage subscription actions.
>
> To review the subscription, open Settings → Appearance → Get Plus. Please use the App Store sandbox purchase flow associated with the review environment. No demo account is required.

## TestFlight 実機確認

提出前に、TestFlight上で次の項目を記録してください。購入機能はExpo Goでは確認せず、**TestFlightビルド**で確認します。

| 確認内容 | 期待結果 |
|---|---|
| Plus新規購入 | App Storeの購入シートに商品名、期間、現地価格、更新条件が表示され、成功後に件数上限解除とテーマセット保存が有効になる。 |
| 購入キャンセル | 無料機能は引き続き利用でき、Plus状態は有効化されない。 |
| 購入を復元 | 同一Apple Accountの有効な購入でPlus状態が復元される。 |
| サブスクリプション管理 | 設定の管理導線からAppleの管理画面へ進める。 |
| 無料機能 | 言語・配色・外観・文字サイズ・ウィジェット設定を購入なしで変更・保存できる。 |
| 早期完了 | 時間管理項目は時間前に完了せず、消費型商品の購入成功時だけ対象項目が早期完了する。キャンセル時は状態を変えず、同じ商品を再購入できる。 |
| 通知 | 明示的な許可後に、設定した時刻で1日1回の通知が動作する。 |

## アカウント所有者のみが行う最終操作

公開URLのホスティング、実在するサポート連絡先、Apple Developer Programの契約・税務・銀行情報、App Store Connect上の価格・税区分・地域・年齢レーティング・商品メタデータ・スクリーンショット・審査提出は、アカウント所有者の操作が必要です。アプリコードや本書では代行できません。

## References

[1]: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/ "Apple: Manage app privacy"
[2]: https://developer.apple.com/app-store/subscriptions/ "Apple: Auto-renewable subscriptions"
[3]: https://developer.apple.com/app-store/review/guidelines/ "Apple: App Review Guidelines"
[4]: https://developer.apple.com/app-store/app-privacy-details/ "Apple: App privacy details"
[5]: https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-in-app-purchase/ "Apple: Submit an In-App Purchase"

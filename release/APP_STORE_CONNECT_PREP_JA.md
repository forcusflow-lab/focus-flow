# Focus Flow App Store Connect 提出準備パック

**対象:** Focus Flow 1.0.0  
**Bundle ID:** `com.app.focusflow`  
**課金商品ID:** `focus_flow_plus`  
**作成日:** 2026-08-17  
**編集者:** Manus AI

## 提出方針

Focus Flowは、Todo、習慣、メモ、日課、通知、振り返りを端末内で使える無料の集中支援アプリです。**Focus Flow Plusは、現在の配色・文字・ウィジェット設定を名前付きテーマセットとして保存・呼び出すためだけの任意の自動更新サブスクリプション**です。基本的な計画機能、言語、配色、外観モード、文字サイズ、ウィジェットの見た目を課金で制限しません。

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
> Focus Flow Plus is an optional subscription for saving and reusing named appearance sets. Your App Store purchase sheet shows the current price, billing period, and renewal terms before you confirm. Restore or manage a previous subscription at any time from Settings.

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
| Description | `Save and reuse named appearance sets in Focus Flow.` |
| Type | Auto-Renewable Subscription |
| 対象機能 | 名前付きテーマセットの保存・呼び出し。基本の計画・表示設定は無料。 |
| 価格・期間 | アカウント所有者が最終決定。アプリ内はストアの現地価格・請求期間を表示する。 |
| Family Sharing | オンにすると後から戻せないため、初回はオフを推奨。共有価値を提供する方針に変える場合だけ有効化する。 |

商品ローカライズ、価格、審査用スクリーンショットを設定し、アプリのバージョンと一緒に審査へ提出します。Appleは、審査者に課金商品が見つかり、実際に動作するよう求めています。[3] [5]

## Notes for Review（貼り付け用）

> Focus Flow is an on-device planner. No account or login is required. The core features—tasks, habits, notes, routines, reminders, and display settings—are free.
>
> The iPhone build does not restrict other apps and does not use Android Accessibility. Focus Flow Plus is an optional auto-renewable subscription (`focus_flow_plus`) that only enables saving and reusing named appearance sets. The purchase flow uses the App Store purchase sheet, and Settings contains Restore purchases and Manage subscription actions.
>
> To review the subscription, open Settings → Appearance → Get Plus. Please use the App Store sandbox purchase flow associated with the review environment. No demo account is required.

## TestFlight 実機確認

提出前に、TestFlight上で次の項目を記録してください。購入機能はExpo Goでは確認せず、**TestFlightビルド**で確認します。

| 確認内容 | 期待結果 |
|---|---|
| 新規購入 | App Storeの購入シートに商品名、期間、現地価格、更新条件が表示され、成功後にテーマセット保存が有効になる。 |
| 購入キャンセル | 無料機能は引き続き利用でき、Plus状態は有効化されない。 |
| 購入を復元 | 同一Apple Accountの有効な購入でPlus状態が復元される。 |
| サブスクリプション管理 | 設定の管理導線からAppleの管理画面へ進める。 |
| 無料機能 | 言語・配色・外観・文字サイズ・ウィジェット設定を購入なしで変更・保存できる。 |
| 通知 | 明示的な許可後に、設定した時刻で1日1回の通知が動作する。 |

## アカウント所有者のみが行う最終操作

公開URLのホスティング、実在するサポート連絡先、Apple Developer Programの契約・税務・銀行情報、App Store Connect上の価格・税区分・地域・年齢レーティング・商品メタデータ・スクリーンショット・審査提出は、アカウント所有者の操作が必要です。アプリコードや本書では代行できません。

## References

[1]: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/ "Apple: Manage app privacy"
[2]: https://developer.apple.com/app-store/subscriptions/ "Apple: Auto-renewable subscriptions"
[3]: https://developer.apple.com/app-store/review/guidelines/ "Apple: App Review Guidelines"
[4]: https://developer.apple.com/app-store/app-privacy-details/ "Apple: App privacy details"
[5]: https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-in-app-purchase/ "Apple: Submit an In-App Purchase"

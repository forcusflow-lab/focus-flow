# Focus Flow 早期完了商品のストア登録手順

**対象アプリ名:** Focus Flow  
**対象商品ID:** `focus_flow_early_complete_100`  
**商品種別:** 消費型の1回限り商品  
**日本向け基準価格:** ¥100

## 1. 商品の意味

この商品は、**分を目標にしたTodoまたは習慣を、設定時間の経過前に1回だけ完了する**ための消費型商品です。購入成功後、Focus Flowは購入した項目だけを早期完了にし、Androidでは購入を消費して同じ商品を再購入できる状態にします。消費型商品であるため、購入の復元、端末間同期、サブスクリプション管理の対象にはしません。[1] [2]

| 項目 | 設定値 |
|---|---|
| 表示名（日本語） | 時間前に完了する（1回） |
| 表示名（英語） | Finish early (one time) |
| 説明（日本語） | 時間管理中のTodoまたは習慣を、設定時間の経過前に1回だけ完了します。 |
| 説明（英語） | Finish one timed task or habit before its scheduled time elapses. |
| Product ID | `focus_flow_early_complete_100` |
| 商品種別 | 消費型 / One-time consumable |
| 価格 | 日本は¥100。その他の地域はストアの価格表に従い、アプリ内ではストアが返す実価格を表示。 |
| 復元 | **対象外**。消費型商品のため「購入を復元」に含めない。 |

## 2. Google Play Console

Play Consoleで **収益化 → 商品 → 1回限りの商品** を開き、商品IDに `focus_flow_early_complete_100` を入力します。商品名と説明は上表を使い、日本の価格を¥100にします。購入オプションは繰り返し購入できる消費型として設定します。ライセンステスターを内部テストトラックへ追加し、公開前に購入、キャンセル、保留、消費後の再購入を実機で確認してください。[1] [3]

> Androidでは、権利を付与した後に消費処理を完了します。購入を消費しない場合、同じ商品を再購入できず、購入を3日以内に確定しない場合は自動返金の対象になります。[3]

## 3. App Store Connect

App Store Connectで **アプリ → 収益化 → アプリ内課金 → 追加** を選び、種別に**消費型**を指定します。Reference Nameは「時間前に完了する（1回）」、Product IDは `focus_flow_early_complete_100` とします。日本語と英語のローカライズ、審査用スクリーンショット、審査メモを追加し、日本の価格点を¥100に設定します。Appleの商品情報はサンドボックスへ反映されるまで最大1時間かかる場合があります。[2] [4]

## 4. 審査メモの文例

> Focus Flow is a productivity app. `focus_flow_early_complete_100` is a consumable one-time purchase that lets a customer finish one time-based task or habit before its configured timer expires. The purchase is only shown after the customer intentionally attempts early completion. It is not a subscription, is not restored, and does not unlock the app name or free planning features.

## 5. 実機受入テスト

| テスト | 期待結果 |
|---|---|
| 20分の時間管理Todoを開始する | 開始時刻が保存され、20分前には完了扱いにならない。 |
| 経過前に完了を試す | ストア決済を使う早期完了の案内を表示する。 |
| テスト購入を完了する | 選択した1項目だけが完了し、他の項目は変化しない。 |
| 同じ商品を再購入する | Androidでは消費処理後に再購入できる。 |
| 「購入を復元」を実行する | 消費型の早期完了は復元せず、Plusのみを照会する。 |
| 購入をキャンセルする | 早期完了を付与せず、時間計測を継続する。 |

## References

[1]: https://developer.android.com/google/play/billing/one-time-products "Google Play Billing: One-time products"
[2]: https://developer.apple.com/help/app-store-connect/manage-in-app-purchases/create-consumable-or-non-consumable-in-app-purchases/ "Apple: Create consumable or non-consumable In-App Purchases"
[3]: https://developer.android.com/google/play/billing/lifecycle/one-time "Google Play Billing: One-time purchase lifecycle"
[4]: https://developer.apple.com/in-app-purchase/ "Apple: In-App Purchase"

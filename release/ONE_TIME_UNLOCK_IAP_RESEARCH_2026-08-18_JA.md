# Focus Flow 途中解除用の消費型アプリ内課金 — 公式要件メモ

**確認日:** 2026-08-18  
**対象商品案:** `focus_flow_early_complete_100`（時間経過型Todo・習慣の早期完了を1回だけ許可する消費型商品）

Google Playでは、繰り返し購入でき、使用後に再購入可能にする商品は「消費型の1回限り商品」として扱います。[1] 購入後は、権利を付与してから消費処理を行う必要があります。Googleは購入処理をバックエンドで行うことを推奨し、消費処理をしない場合は再購入できず、3日以内に購入を確定しない場合は自動返金の対象になると案内しています。[2]

App Store Connectでは、同じ用途の商品を「消費型」として作成し、商品IDと表示名を登録します。[3] 日本のApp Storeの価格体系には **¥100** の価格点が含まれていますが、他の国・地域ではストアが表示する現地価格をアプリ内でそのまま提示します。[4]

Focus Flowは運用費を抑える既存方針に沿い、アカウントやサーバーを新設せず、端末上の購入成功イベントを処理して対象の時間管理項目だけを早期完了にします。この方法では消費型商品は復元対象ではないため、商品を再度購入可能にするためにAndroidで消費処理を行います。将来、アカウント同期や不正対策を強化する場合は、ストア購入のサーバー検証へ移行します。

## References

[1]: https://developer.android.com/google/play/billing/one-time-products "Google Play Billing: One-time products"
[2]: https://developer.android.com/google/play/billing/lifecycle/one-time "Google Play Billing: One-time purchase lifecycle"
[3]: https://developer.apple.com/help/app-store-connect/manage-in-app-purchases/create-consumable-or-non-consumable-in-app-purchases/ "Apple: Create consumable or non-consumable In-App Purchases"
[4]: https://developer.apple.com/in-app-purchase/ "Apple: In-App Purchase pricing"

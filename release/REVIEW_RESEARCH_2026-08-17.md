# Focus Flow 公開準備に関する公式要件メモ

**確認日:** 2026-08-17  
**対象:** App Store ConnectおよびFocus Flow Plus

AppleはiOSアプリに公開可能なプライバシーポリシーURLを必須とし、App Store ConnectのApp Privacy回答にはアプリ本体と組み込みSDKの実際のデータ利用を反映するよう求めています。端末内だけで処理され、端末外へ送信されないデータは、Appleの「収集」には当たりません。[1] [2]

Focus Flowでは、計画データ、表示設定、選択アプリの集中ルールは端末内に保持し、広告・行動分析SDKは使わない設計です。ただし、購入は各ストアの決済機能を経由するため、申告は実際のビルド、依存ライブラリ、購入商品の設定を確認したうえで、アカウント所有者が最終確定します。

Appleは自動更新サブスクリプションについて、アプリ内でサービス内容、期間、更新価格を明確に示し、購入の復元・管理の手段を用意するよう案内しています。[3] Focus Flowの設定画面には、ストア提供の価格表示、購入、復元、管理への導線と、Plusが名前付きテーマセットの保存・再利用に限られる説明が実装されています。

## 参照

[1]: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/ "Apple: Manage app privacy"
[2]: https://developer.apple.com/app-store/app-privacy-details/ "Apple: App privacy details"
[3]: https://developer.apple.com/app-store/subscriptions/ "Apple: Auto-renewable subscriptions"

# Focus Flow ストア公開・収益化監査

**監査日:** 2026-08-17  
**対象:** Focus Flow 1.0.0（Expo SDK 54）

## 現状判定

アプリの基本機能、端末内データ削除、通知、Androidの集中制限、プライバシー画面、サポート画面は実装されています。一方で、公開・収益化の観点では、**iOSの課金未実装、公開URLとしてのプライバシーポリシー／連絡先未確定、ストアコンソールでの権限・データ利用・商品設定未完了**が残っています。

| 分類 | 現在の状態 | 対応方針 |
|---|---|---|
| Android課金 | Google Play Billingのネイティブ実装と `focus_flow_plus` SKUは存在 | 共通IAP実装へ置換し、購入・復元・状態更新を両OSで揃える |
| iOS課金 | 未実装 | StoreKitとGoogle Play Billingを両対応するExpo向けIAPモジュールを導入 |
| 基本設定 | 無料化済み | Plusは保存済みテーマセットなど明確な追加価値のみを対象にする |
| プライバシー | アプリ内画面は実装済み | ストア用の公開URLと、正確なデータ利用申告を用意 |
| サポート | アプリ内のFAQ・共有テンプレートは実装済み | 公開サポートURLと連絡先をストア情報に設定 |
| Android権限 | 通知、AccessibilityService、`QUERY_ALL_PACKAGES`を使用 | Play ConsoleでAccessibilityとアプリ可視性の宣言を提出し、データセーフティを正確に回答 |
| iOS対応範囲 | 計画機能は利用可能、他アプリ制限は未提供 | ストア説明とレビュー情報にAndroid限定機能を明記 |

## 公式要件への対応方針

Appleは、アプリ内からアクセス可能なプライバシーポリシーに加えて、App Store ConnectのプライバシーポリシーURL、最新の連絡先を含むサポート導線、機能するアプリ内課金を求めています。[1] [2] [3] 本アプリは公開URLとストアアカウントに紐づく商品設定が必要です。

Google Playでは、インストール済みアプリの一覧、AccessibilityService、Google Play Billingの利用がそれぞれデータセーフティ申告または高リスク権限の宣言に関係します。`QUERY_ALL_PACKAGES`は、より限定した可視性で目的を満たせない場合に限られ、Play Consoleでの申告が必要です。[4] [5] [6]

Expoのアプリ内課金は、Expo Goではなくカスタム開発ビルドを必要とします。iOSとAndroidを一つの実装で扱うため、StoreKitとGoogle Play Billingを両対応するExpo向けIAPモジュールを使い、物理端末・ストアのテスト商品で購入、復元、保留、更新、解約の各状態を検証します。[7] [8]

## ストアコンソールでのみ完了できる事項

以下はアプリコードでは代替できず、アカウント所有者が各コンソールで実施する必要があります。アプリ側の実装と提出資料は準備しますが、実際のアカウント情報、銀行・税務情報、商品価格、プライバシーポリシーの公開URL、スクリーンショット、法的なサポート連絡先は実在する情報で入力する必要があります。

1. Apple Developer Program／App Store Connectの契約、税務、銀行情報、アプリレコード、IAP商品、サンドボックステスター、プライバシー回答、サポートURL、スクリーンショットを設定する。
2. Google Play Consoleのデベロッパーアカウント、支払いプロファイル、アプリレコード、`focus_flow_plus`の定期購入、テストトラック、ライセンステスター、データセーフティ、Accessibility、`QUERY_ALL_PACKAGES`の宣言を設定する。
3. `com.app.focusflow` が両ストアで利用可能な識別子であり、将来も所有・維持できることを確認する。必要なら、最初のアップロード前に組織固有の識別子へ変更する。

## 参照

[1]: https://developer.apple.com/distribute/app-review/ "Apple App Review"
[2]: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/ "Apple: Manage app privacy"
[3]: https://developer.apple.com/in-app-purchase/ "Apple: In-App Purchase"
[4]: https://support.google.com/googleplay/android-developer/answer/16558241?hl=en "Google Play: Permissions and APIs that Access Sensitive Information"
[5]: https://developer.android.com/privacy-and-security/declare-data-use "Android: Declare your app's data use"
[6]: https://developer.android.com/training/package-visibility "Android: Package visibility filtering"
[7]: https://docs.expo.dev/guides/in-app-purchases/ "Expo: Using in-app purchases"
[8]: https://www.openiap.dev/docs/setup/expo "OpenIAP: Expo setup"

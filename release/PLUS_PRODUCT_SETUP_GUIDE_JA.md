# Focus Flow Plus 商品登録ガイド

**対象アプリ:** Focus Flow  
**アプリ識別子:** `com.app.focusflow`  
**アプリ内商品ID:** `focus_flow_plus`  
**商品種別:** 自動更新サブスクリプション  
**提供価値:** 名前付きテーマセットの保存・呼び出し。言語、配色、フォント、文字サイズ、ウィジェットの見た目などの基本設定は無料です。

> **重要:** `focus_flow_plus` はアプリ実装に固定されています。App Store ConnectとGoogle Play Consoleの両方で、文字列を**完全に同じ**にして作成してください。商品IDは作成後に変更しない前提で扱ってください。

## 0. 登録前に決めること

| 項目 | 初回リリースの推奨入力 | 注意点 |
|---|---|---|
| 商品ID | `focus_flow_plus` | アプリコードと一致必須 |
| 商品名（内部用） | `Focus Flow Plus Monthly` | 利用者へはローカライズ名を表示 |
| 提供内容 | 保存済みテーマセット | 無料機能を有料と誤認させない |
| 初回の請求期間 | 1か月 | コード変更なしで年額プランを後から追加可能 |
| 初回の特典 | なし | 購入・復元・失効を確認後に無料トライアルや導入価格を追加 |
| Family Sharing | オフ | 現在のPlus価値は端末内テーマセットであり、共有の説明が難しいため |
| 公開地域 | 事業・税務上、販売できる地域のみ | Apple／Googleの契約・税務・銀行情報が先に必要 |

料金、通貨、無料トライアルの有無は、販売者としての責任を持つアカウント所有者が決めてください。ストアの商品画面、アプリ内の購入画面、利用条件の記載は常に一致させます。

---

## 1. App Store Connect: Focus Flow Plus を登録する

Appleの自動更新サブスクリプションは、**Subscription Group → Subscription** の順に作ります。同じグループ内では利用者が同時に一つのサブスクリプションだけを持てるため、Focus Flow Plusの月額・年額を将来併売する場合も、通常は一つのグループにまとめます。[1]

### 1-1. 事前条件

1. Apple Developer Programのアカウントで、`com.app.focusflow` と一致するApp ID／App Store Connectのアプリレコードを用意します。
2. **Business → Agreements** で **Paid Apps Agreement** を承諾し、銀行情報・税務情報を入力して契約が **Active** であることを確認します。契約が有効でなければSandboxテストもできません。[2]
3. App Store ConnectでFocus Flowを開き、**Monetization → Subscriptions** に進みます。

### 1-2. サブスクリプショングループを作成する

| 画面の項目 | 入力値 |
|---|---|
| Reference Name | `Focus Flow Plus` |
| 日本語表示名 | `Focus Flow Plus` |
| 日本語説明 | `テーマセットを保存して、いつもの見た目をすばやく切り替えます。` |
| 英語表示名 | `Focus Flow Plus` |
| 英語説明 | `Save and reuse your preferred appearance sets.` |

操作は、**Monetization → Subscriptions → ＋ → Reference Name → Create** です。グループのローカライズ名は、利用者が端末上でサブスクリプションを管理するときにも表示されます。[1]

### 1-3. 商品を作成する

グループを開き、**Create**（既存商品がある場合は＋）を押します。

| 画面の項目 | 入力値／選択 |
|---|---|
| Reference Name | `Focus Flow Plus Monthly` |
| Product ID | `focus_flow_plus` |
| Subscription Duration | `1 Month` |
| Subscription Price | 販売者が確定した価格帯 |
| Availability | 販売する国・地域 |
| Subscription Level | 商品が一つだけなら既定の単一レベルで可 |
| Family Sharing | 初回はオフ |
| Tax Category | 販売者の税務状況に合う区分を選択 |

商品を保存したら、**App Store Localizations** に以下を追加します。

| 言語 | Display Name | Description |
|---|---|---|
| 日本語 | Focus Flow Plus | テーマセットを保存して、いつもの見た目をすばやく切り替えます。基本設定はすべて無料です。 |
| English (U.S.) | Focus Flow Plus | Save and reuse your preferred appearance sets. Core settings stay free. |

**Review Information** には、設定画面のPlusカードが見えるスクリーンショットと次の審査メモを入力してください。

> Focus Flow Plus is an optional auto-renewable subscription for saving and reusing named appearance sets. Core planning, language, color, appearance mode, fonts, text size, and widget styling remain free. No separate app account is required. In the app, open Settings → Appearance, then tap “Get Plus.” Restore and subscription management controls are shown in the same section.

Appleでは、**最初の自動更新サブスクリプションは新しいアプリバージョンと同時に審査提出する必要があります**。商品詳細で **Add for Review** を選び、アプリの新バージョンの提出に含めてください。[1] [2]

### 1-4. Appleで確認すること

* 商品メタデータを変更してからSandboxへ反映されるまで、最大約1時間かかる場合があります。[1] [2]
* TestFlightテストでは、サブスクリプションはAppleのSandboxで処理されます。購入、キャンセル、復元、管理画面遷移を実機で確認します。
* 年額プランを追加する場合は、新しいProduct ID（例: `focus_flow_plus_yearly`）を同じグループ・同一レベルへ追加し、アプリ側の商品取得対象も更新してから公開します。**現行アプリは月額の`focus_flow_plus`のみ取得します。**

---

## 2. Google Play Console: Focus Flow Plus を登録する

Google Playのサブスクリプションは、**Subscription → Base plan → Offer（任意）** という構造です。アプリは`expo-iap`を通じてストアの商品とAndroidのオファートークンを取得するため、ベースプランIDやオファートークンをアプリコードに入力する必要はありません。

### 2-1. 事前条件

1. Google Play Consoleに、パッケージ名 **`com.app.focusflow`** のアプリを作成します。
2. **Setup → Payments profile** など、収益受領に必要な決済プロファイル・税務情報を完成させます。
3. **Monetize with Play → Products → Subscriptions** を開きます。画面名称はConsoleの更新で多少変わる場合があります。

### 2-2. サブスクリプションを作成する

**Create subscription** を押し、次を入力します。

| 画面の項目 | 入力値／選択 |
|---|---|
| Product ID | `focus_flow_plus` |
| Name | `Focus Flow Plus` |
| Benefits | `Save and reuse named appearance sets. Core settings remain free.` |
| Default language | 日本語または英語（両方のローカライズを追加） |

保存後、**Base plan** を追加します。

| 画面の項目 | 初回設定 |
|---|---|
| Base plan ID | `monthly` |
| Type | Auto-renewing |
| Billing period | Monthly |
| Price | 販売者が確定した価格 |
| Countries/regions | 販売する国・地域 |
| Grace period / Account hold | 初回はGoogleの既定・推奨値を確認。課金失敗時の利用者体験をテスト後に有効化を判断 |

開始時点では、無料トライアルや導入価格の**Offerは作らなくても構いません**。通常価格のベースプランで、購入・更新・復元・解約の実機検証を先に完了してください。無料トライアル、導入価格、休止、再登録、アップグレード・ダウングレードは、Play Consoleが対応する追加機能です。[3]

### 2-3. Google Playで確認すること

* 商品IDはアプリの`focus_flow_plus`と完全一致させます。
* 商品を有効化した後、**Internal testing** トラックへ対象AABを配布し、テスターがオプトインURLからインストールできる状態にします。
* **Setup → License testing** でテスターのGoogleアカウントを追加します。ライセンステスターには実課金を避けるテスト決済手段が表示されます。[4]
* テスト端末には、ライセンステスターとして登録したGoogleアカウントでPlay Storeへログインし、同アカウントでテストトラックのアプリを入れます。[4]

---

## 3. 実機テストの必須ケース

Expo Goではネイティブ課金を使えません。必ずStore対応のiPhone／Androidビルドを使ってください。

| ケース | Apple | Google Play | 合格条件 |
|---|---|---|---|
| 初回購入 | TestFlight Sandbox | ライセンステスター＋内部テスト | 商品価格を表示し、購入後にPlusが有効になる |
| 購入キャンセル | 購入画面でキャンセル | テスト決済をキャンセル | Plusを有効化しない |
| 復元 | 設定の「購入を復元」 | 設定の「購入を復元」 | 同じストアアカウントでPlusが復元する |
| 再起動 | アプリを終了・再起動 | アプリを終了・再起動 | 購入状態を再照会して正しく反映する |
| 管理／解約 | 設定の管理ボタン | 設定の管理ボタン | 各ストアのサブスクリプション管理画面へ遷移する |
| 更新・失効 | Sandboxの短縮周期で確認 | ライセンステスターの短縮周期／Play Billing Labで確認 | 状態更新後、再確認またはアプリ復帰時にPlus状態を更新する |
| 支払い失敗 | Sandboxの失敗シナリオ | Test instrument, always declines／Play Billing Lab | 不正にPlusを継続付与しない |

Google Playでは、ライセンステスターの月額サブスクリプションは概ね5分で更新され、テスト購入が適切に承認されない場合は払い戻されます。Play Billing Labでは、更新、猶予期間、アカウント保留、導入価格、価格変更の状態を短時間で検証できます。[4]

---

## 4. 提出直前の最終確認

1. App Store Connectで、`focus_flow_plus`をアプリの新バージョンに添付し、**Add for Review** を済ませます。
2. Google Play Consoleで、サブスクリプションとベースプランを**Active**にし、内部テストで実機購入を完了します。
3. アプリ内のPlus説明、App Store／Play Storeの商品名・説明、公開した利用条件・プライバシーポリシーの内容が一致していることを確認します。
4. App Store ConnectのApp PrivacyとGoogle Play ConsoleのData safety／Accessibility／`QUERY_ALL_PACKAGES`申告を、実装内容に沿って完了します。
5. テスト結果と審査メモを保存し、ストアの審査提出へ進みます。

## References

[1]: https://developer.apple.com/help/app-store-connect/manage-subscriptions/offer-auto-renewable-subscriptions/ "Apple: Offer auto-renewable subscriptions"
[2]: https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/overview-for-configuring-in-app-purchases/ "Apple: Overview for configuring In-App Purchases"
[3]: https://play.google.com/console/about/subscriptionsetup/ "Google Play Console: Subscription setup"
[4]: https://developer.android.com/google/play/billing/test "Android Developers: Test your Google Play Billing Library integration"

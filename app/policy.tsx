import { PublicInformationPage } from "@/components/public-information-page";

export default function PublicPrivacyPolicyPage() {
  return (
    <PublicInformationPage
      title="Focus Flow プライバシーポリシー"
      updated
      sections={[
        {
          title: "1. 概要",
          paragraphs: [
            "Focus Flowは、Todo、習慣、メモ、日課、リマインダー、進捗の振り返りを支援するアプリです。本ポリシーは、Focus FlowとFocus Flow Plusの利用時にデータをどのように扱うかを説明します。",
          ],
        },
        {
          title: "2. 端末内に保存されるデータ",
          paragraphs: [
            "あなたが作成したTodo、習慣、メモ、日課ルール、進捗、表示設定、名前付きテーマセットは、あなたの端末上のアプリ保存領域に保管されます。Focus Flowは、これらの計画データを広告、行動追跡、プロファイリングの目的で受け取りません。",
          ],
        },
        {
          title: "3. Androidの集中ルール",
          paragraphs: [
            "Androidでは、あなたが任意で有効にした集中ルールのためにAccessibilityServiceを利用します。この機能は、あなたが選んだアプリが前面に開いたことだけを検知し、未完了の必須項目がある場合に設定したルールを適用します。画面の文字、メッセージ、入力内容、スクリーンショットは読み取りません。",
          ],
        },
        {
          title: "4. 通知",
          paragraphs: [
            "毎日のリマインダーは、あなたが端末の通知許可を与え、アプリ内で有効化した場合にのみ使用します。通知内容は端末上で設定され、広告目的で利用されません。",
          ],
        },
        {
          title: "5. Focus Flow Plusとストア決済",
          paragraphs: [
            "Focus Flow Plusは、名前付きテーマセットの保存・呼び出しを可能にする任意の自動更新サブスクリプションです。支払い、請求、返金、サブスクリプション管理はApple App StoreまたはGoogle Playの決済機能を通じて行われます。Focus Flowは決済カード番号を受け取りません。",
          ],
        },
        {
          title: "6. データの削除",
          paragraphs: [
            "アプリ内の「プライバシーとデータ」から、端末内のTodo、習慣、メモ、日課、進捗、表示設定を削除できます。削除すると、集中ルールはオフになります。ストアの購入履歴・定期購入は、AppleまたはGoogleのアカウント設定で管理してください。",
          ],
        },
        {
          title: "7. 第三者提供・広告・追跡",
          paragraphs: [
            "Focus Flowは、あなたの計画データを広告目的で販売または共有しません。広告SDKおよび行動追跡SDKは使用しません。",
          ],
        },
        {
          title: "8. 本ポリシーの変更",
          paragraphs: [
            "データの取り扱いが変わる場合は、本ページとストア上のプライバシー情報を更新します。",
          ],
        },
      ]}
    />
  );
}

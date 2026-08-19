import { PublicInformationPage } from "@/components/public-information-page";

export default function PublicSupportPage() {
  return (
    <PublicInformationPage
      title="Focus Flow サポート"
      footer="support"
      sections={[
        {
          title: "お問い合わせ",
          paragraphs: [
            "不具合、購入、復元、またはアプリの操作に関するご質問は、forcus.flow@gmail.comまでお送りください。通常、平日3営業日以内を目安に確認します。",
          ],
        },
        {
          title: "ご連絡時に含めてほしい内容",
          paragraphs: [
            "端末の種類、OSバージョン、アプリのバージョン、起きたこと、再現手順をお知らせください。Todo名、メモ本文、スクリーンショット内の個人情報は送らないでください。Androidの集中ルールについては、アクセシビリティが有効か、バッテリー最適化の状態、集中ルールがオンかを記載してください。",
          ],
        },
        {
          title: "よくある質問",
          paragraphs: [
            "Focus Flow Plusを復元するには、同じストアアカウントで購入した端末で、アプリの「設定」から「購入を復元」を選択してください。",
            "定期購入の管理または解約は、アプリの「設定」から「サブスクリプションを管理」を選択し、App StoreまたはGoogle Playの管理画面で手続きしてください。",
            "時間管理のTodo・習慣は、設定時間の経過後に完了します。時間前に完了する場合は、対象項目の画面からストアに表示される1回限りの早期完了商品を利用できます。この商品は消費型で、購入の復元対象ではありません。",
          ],
        },
      ]}
    />
  );
}

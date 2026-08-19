import { PublicInformationPage } from "@/components/public-information-page";

export default function PublicTermsPage() {
  return (
    <PublicInformationPage
      title="Focus Flow 利用条件"
      updated
      sections={[
        {
          title: "1. アプリの利用",
          paragraphs: [
            "Focus Flowは、日々のTodo、習慣、メモ、日課、集中の振り返りを支援する一般的な生産性ツールです。医療、緊急対応、診断サービスではありません。重要な期限や安全に関わる事項については、アプリの通知だけに依存しないでください。",
          ],
        },
        {
          title: "2. 無料機能",
          paragraphs: [
            "無料版ではTodo、習慣、メモを各2件、制限対象アプリを合計5件まで利用できます。日課、リマインダー、言語、配色、外観モード、文字、文字サイズ、カード表示、ウィジェットの見た目は無料です。",
          ],
        },
        {
          title: "3. Focus Flow Plus",
          paragraphs: [
            "Focus Flow Plusは、Todo、習慣、メモ、制限対象アプリの上限を解除し、現在の配色・文字・ウィジェット設定を名前付きテーマセットとして保存・呼び出すための任意の自動更新サブスクリプションです。購入前にApp StoreまたはGoogle Playが価格、請求期間、更新条件を表示します。",
          ],
        },
        {
          title: "4. 時間管理と早期完了",
          paragraphs: [
            "分を目標にしたTodoまたは習慣は、計測を開始して設定時間が経過した後に完了扱いになります。設定時間前に完了する場合は、対象項目ごとにストアが表示する1回限りの早期完了商品を購入できます。この商品は消費型であり、購入の復元やサブスクリプション管理の対象ではありません。",
          ],
        },
        {
          title: "5. 請求、更新、解約、返金",
          paragraphs: [
            "定期購入は、購入したストアアカウントへ請求され、解約しない限り各請求期間の終了時に更新されます。管理または解約は、アプリの「設定」から「サブスクリプションを管理」を選択するか、購入に使用したストアアカウント設定で行えます。返金は各ストアのポリシーに従います。",
          ],
        },
        {
          title: "6. Androidの集中ルール",
          paragraphs: [
            "Androidの集中ルールは任意であり、端末やOSの設定により継続動作が変わることがあります。集中ルールを停止する場合は、Focus Flowの設定でオフにするか、Android設定からAccessibilityServiceを無効にしてください。",
          ],
        },
      ]}
    />
  );
}

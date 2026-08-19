import type { Express } from "express";

const SUPPORT_EMAIL = "forcus.flow@gmail.com";
const EFFECTIVE_DATE = "2026年8月19日";

type PublicPage = {
  title: string;
  description: string;
  body: string;
};

const layout = (page: PublicPage) => `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${page.description}" />
    <title>${page.title}</title>
    <style>
      :root { color-scheme: light dark; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.75; }
      body { margin: 0; background: #f6f8f5; color: #24372f; }
      main { max-width: 760px; margin: 0 auto; padding: 48px 24px 72px; }
      .brand { color: #287a62; font-size: 0.95rem; font-weight: 800; letter-spacing: 0.04em; margin: 0 0 24px; }
      h1, h2 { color: #173f34; line-height: 1.28; }
      h1 { font-size: clamp(1.8rem, 4vw, 2.35rem); margin: 0; }
      h2 { font-size: 1.2rem; margin: 2.3rem 0 0.65rem; }
      p { margin: 0.7rem 0; }
      .updated { color: #66736d; font-size: 0.92rem; margin-top: 0.45rem; }
      .contact { border: 1px solid #c9e2d6; border-radius: 14px; background: #e7f3ee; margin-top: 2.5rem; padding: 18px 20px; }
      a { color: #0d5d9d; font-weight: 700; }
      nav { font-size: 0.92rem; margin-top: 2.2rem; }
      @media (prefers-color-scheme: dark) { body { background: #10231c; color: #e6f0eb; } h1, h2 { color: #c7eadb; } .updated { color: #b6c6be; } .contact { background: #183b2e; border-color: #3c705d; } a { color: #9fd3ff; } }
    </style>
  </head>
  <body>
    <main>
      <p class="brand">FOCUS FLOW</p>
      ${page.body}
      <nav><a href="/policy">プライバシーポリシー</a> ・ <a href="/help">サポート</a> ・ <a href="/terms">利用条件</a></nav>
    </main>
  </body>
</html>`;

const pages: Record<"policy" | "help" | "terms", PublicPage> = {
  policy: {
    title: "Focus Flow プライバシーポリシー",
    description: "Focus Flowのプライバシーポリシーです。",
    body: `
      <h1>Focus Flow プライバシーポリシー</h1>
      <p class="updated">最終更新日: ${EFFECTIVE_DATE}</p>
      <h2>1. 概要</h2><p>Focus Flowは、Todo、習慣、メモ、日課、リマインダー、進捗の振り返りを支援するアプリです。本ポリシーは、Focus FlowとFocus Flow Plusの利用時にデータをどのように扱うかを説明します。</p>
      <h2>2. 端末内に保存されるデータ</h2><p>あなたが作成したTodo、習慣、メモ、日課ルール、進捗、表示設定、名前付きテーマセットは、あなたの端末上のアプリ保存領域に保管されます。Focus Flowは、これらの計画データを広告、行動追跡、プロファイリングの目的で受け取りません。</p>
      <h2>3. Androidの集中ルール</h2><p>Androidでは、あなたが任意で有効にした集中ルールのためにAccessibilityServiceを利用します。この機能は、あなたが選んだアプリが前面に開いたことだけを検知し、未完了の必須項目がある場合に設定したルールを適用します。画面の文字、メッセージ、入力内容、スクリーンショットは読み取りません。</p>
      <h2>4. 通知</h2><p>毎日のリマインダーは、あなたが端末の通知許可を与え、アプリ内で有効化した場合にのみ使用します。通知内容は端末上で設定され、広告目的で利用されません。</p>
      <h2>5. Focus Flow Plusとストア決済</h2><p>Focus Flow Plusは、名前付きテーマセットの保存・呼び出しを可能にする任意の自動更新サブスクリプションです。支払い、請求、返金、サブスクリプション管理はApple App StoreまたはGoogle Playの決済機能を通じて行われます。Focus Flowは決済カード番号を受け取りません。</p>
      <h2>6. データの削除</h2><p>アプリ内の「プライバシーとデータ」から、端末内のTodo、習慣、メモ、日課、進捗、表示設定を削除できます。削除すると、集中ルールはオフになります。ストアの購入履歴・定期購入は、AppleまたはGoogleのアカウント設定で管理してください。</p>
      <h2>7. 第三者提供・広告・追跡</h2><p>Focus Flowは、あなたの計画データを広告目的で販売または共有しません。広告SDKおよび行動追跡SDKは使用しません。</p>
      <h2>8. 本ポリシーの変更</h2><p>データの取り扱いが変わる場合は、本ページとストア上のプライバシー情報を更新します。</p>
      <section class="contact"><strong>お問い合わせ</strong><p>本ポリシーに関するお問い合わせは、<a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>までご連絡ください。</p></section>`,
  },
  help: {
    title: "Focus Flow サポート",
    description: "Focus Flowのサポート窓口とよくある質問です。",
    body: `
      <h1>Focus Flow サポート</h1>
      <h2>お問い合わせ</h2><p>不具合、購入、復元、またはアプリの操作に関するご質問は、<a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>までお送りください。通常、平日3営業日以内を目安に確認します。</p>
      <h2>ご連絡時に含めてほしい内容</h2><p>端末の種類、OSバージョン、アプリのバージョン、起きたこと、再現手順をお知らせください。Todo名、メモ本文、スクリーンショット内の個人情報は送らないでください。Androidの集中ルールについては、アクセシビリティが有効か、バッテリー最適化の状態、集中ルールがオンかを記載してください。</p>
      <h2>よくある質問</h2><p><strong>Focus Flow Plusを復元するには？</strong><br />同じストアアカウントで購入した端末で、アプリの「設定」から「購入を復元」を選択してください。</p><p><strong>定期購入を解約するには？</strong><br />アプリの「設定」から「サブスクリプションを管理」を選択し、App StoreまたはGoogle Playの管理画面で手続きしてください。</p><p><strong>時間管理のTodo・習慣を早く完了したい場合は？</strong><br />設定時間の経過後に完了します。時間前に完了する場合は、対象項目の画面からストアに表示される1回限りの早期完了商品を利用できます。この商品は消費型で、購入の復元対象ではありません。</p>`,
  },
  terms: {
    title: "Focus Flow 利用条件",
    description: "Focus Flowの利用条件と購入に関する情報です。",
    body: `
      <h1>Focus Flow 利用条件</h1>
      <p class="updated">最終更新日: ${EFFECTIVE_DATE}</p>
      <h2>1. アプリの利用</h2><p>Focus Flowは、日々のTodo、習慣、メモ、日課、集中の振り返りを支援する一般的な生産性ツールです。医療、緊急対応、診断サービスではありません。重要な期限や安全に関わる事項については、アプリの通知だけに依存しないでください。</p>
      <h2>2. 無料機能</h2><p>無料版ではTodo、習慣、メモを各2件、制限対象アプリを合計5件まで利用できます。日課、リマインダー、言語、配色、外観モード、文字、文字サイズ、カード表示、ウィジェットの見た目は無料です。</p>
      <h2>3. Focus Flow Plus</h2><p>Focus Flow Plusは、Todo、習慣、メモ、制限対象アプリの上限を解除し、現在の配色・文字・ウィジェット設定を名前付きテーマセットとして保存・呼び出すための任意の自動更新サブスクリプションです。購入前にApp StoreまたはGoogle Playが価格、請求期間、更新条件を表示します。</p>
      <h2>4. 時間管理と早期完了</h2><p>分を目標にしたTodoまたは習慣は、計測を開始して設定時間が経過した後に完了扱いになります。設定時間前に完了する場合は、対象項目ごとにストアが表示する1回限りの早期完了商品を購入できます。この商品は消費型であり、購入の復元やサブスクリプション管理の対象ではありません。</p>
      <h2>5. 請求、更新、解約、返金</h2><p>定期購入は、購入したストアアカウントへ請求され、解約しない限り各請求期間の終了時に更新されます。管理または解約は、アプリの「設定」から「サブスクリプションを管理」を選択するか、購入に使用したストアアカウント設定で行えます。返金は各ストアのポリシーに従います。</p>
      <h2>6. Androidの集中ルール</h2><p>Androidの集中ルールは任意であり、端末やOSの設定により継続動作が変わることがあります。集中ルールを停止する場合は、Focus Flowの設定でオフにするか、Android設定からAccessibilityServiceを無効にしてください。</p>
      <section class="contact"><strong>お問い合わせ</strong><p>利用条件に関するお問い合わせは、<a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>までご連絡ください。</p></section>`,
  },
};

export function renderPublicPage(name: keyof typeof pages) {
  return layout(pages[name]);
}

export function registerPublicPages(app: Express) {
  (Object.keys(pages) as Array<keyof typeof pages>).forEach((name) => {
    app.get(`/${name}`, (_req, res) => {
      res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.type("html").send(renderPublicPage(name));
    });
  });
}

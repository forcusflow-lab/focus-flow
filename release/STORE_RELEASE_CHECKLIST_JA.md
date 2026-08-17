# Focus Flow 最終公開チェックリスト

**更新日:** 2026-08-17  
**対象:** Focus Flow 1.0.0  
**コード公開判定:** 条件付きで準備完了  
**ストア提出判定:** アカウント情報・実機ストア試験・公開URLの入力待ち

## 実装・検証済み

| 項目 | 状態 | 確認内容 |
|---|---|---|
| 基本機能とレイアウト | 完了 | Todo、習慣、メモ、日課、リマインダー、設定、管理画面、セーフエリアと長文モーダルを確認済み |
| 無料プランの保護 | 完了 | Todo・習慣・メモは各2件、制限対象アプリは合計5件まで。言語、外観、配色、フォント、文字サイズ、カード表示、ウィジェット文字サイズは無料 |
| Plusの価値 | 完了 | Todo・習慣・メモ・制限対象アプリの上限解除と保存済みテーマセット。基本機能やアクセシビリティは課金対象から除外 |
| iOS・Android IAP | 実装済み | `focus_flow_plus` の定期購入と、`focus_flow_early_complete_100` の消費型早期完了をExpo IAPで共通化 |
| 課金UX | 完了 | 商品未設定、Expo Go、購入待ち、復元、ストア管理への案内を設定画面に実装 |
| 法務・サポート導線 | 完了 | アプリ内のプライバシー、FAQ・不具合報告、利用条件・サブスクリプション画面を追加 |
| Androidの権限最小化 | 完了 | 未使用の音声・動画依存を除外し、外部ストレージ権限をブロック。通知、Accessibility、アプリ可視性のみを申告対象に整理 |
| Android集中制限 | 完了 | 任意のAccessibility同意、端末診断、設定またはAndroid設定での停止、選択アプリの前面化のみを扱う説明を実装 |
| バンドル検証 | 完了 | iOS／Android Hermesバンドルを生成し、両方とも成功 |
| 静的品質 | 完了 | TypeScript、Vitest（19件成功・1件既存スキップ）、Lint、iOS/Androidバンドル生成が通過 |
| 直接依存の高重大度修正 | 完了 | tRPCを11.8.0へ更新し、既知の高重大度の直接脆弱性を解消 |

## アカウント所有者の必須作業

以下は、アプリコードやビルドでは代替できません。AppleおよびGoogleの契約・提出プロセスでは、実在する法人／個人情報、支払先、税務情報、審査申告、商品設定が必要です。

| 優先度 | 作業 | 完了基準 |
|---|---|---|
| 必須 | 公開HTTPSのプライバシーポリシーURLとサポートURLを設置 | 実在する連絡先・保持／削除方針・課金サポートを掲載。App StoreのプライバシーポリシーURLは必須 [1] |
| 必須 | Apple Developer／Google Playの契約・税務・銀行情報を登録 | 両コンソールで有料アプリ契約が有効 |
| 必須 | `focus_flow_plus` と `focus_flow_early_complete_100` を両ストアで設定 | Plusの価格・請求期間・販売地域と、早期完了の消費型設定・日本価格¥100を確定 |
| 必須 | プライバシー・権限申告を提出 | App Privacy、Data safety、Accessibility、`QUERY_ALL_PACKAGES`を実装内容に合わせて回答 [2] [3] |
| 必須 | 実機ストア試験 | TestFlight SandboxとPlay内部テストでPlusの購入・キャンセル・復元・更新・解約満了、および早期完了の購入・キャンセル・消費後再購入を確認 [4] [5] |
| 必須 | 提出素材・レビュー情報を入力 | 実画面のスクリーンショット、年齢レーティング、ストア説明、審査メモ、サポート連絡先を入力 |

> **公開判定:** ストア用のアプリコードとバンドルは準備済みです。ただし、上表の必須作業が未完了のままでは、審査に必要な商品・URL・申告・実機のストア課金試験を満たせません。これらはアカウント所有者の実在情報を要するため、代理で確定・送信することはできません。

## セキュリティ上の注記

本番依存関係監査ではcriticalは0件です。残る110件（high 62、moderate 42、low 6）は、主にExpo CLI、Metro、開発用ツール、またはテンプレートに同梱される推移依存の監査結果です。モバイルのiOS／Android Hermesバンドルは生成済みですが、SDK更新時には監査を再実行し、Expo互換性を保ったまま更新可能な修正版を採用してください。

## 公開操作

このチェックリストの必須項目が完了した後、最新版のチェックポイントを選び、管理画面の **Publish** ボタンからストア向けビルドを作成してください。コード側から公開操作を自動実行することはしません。

## References

[1]: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/ "Apple: Manage app privacy"
[2]: https://developer.apple.com/distribute/app-review/ "Apple: App Review"
[3]: https://support.google.com/googleplay/android-developer/answer/16558241?hl=en "Google Play: Permissions and APIs that Access Sensitive Information"
[4]: https://developer.apple.com/in-app-purchase/ "Apple: In-App Purchase"
[5]: https://developer.android.com/google/play/billing/test "Google Play Billing testing"

# Focus Flow ストア掲載素材の公式要件メモ

**確認日:** 2026-08-18  
**対象:** Google Play Main Store Listing / App Store Connect

Google Playは、ストア掲載の機能グラフィック、スクリーンショット、短い説明、動画を、ストアページおよびGoogleの販促面で利用する場合があります。掲載する素材はテストトラックにも表示されるため、実際のビルド・機能・価格表示と一貫させます。[1]

AppleはiPhoneアプリについて、1〜10枚のJPEG/JPG/PNGスクリーンショットを受け付け、透過を含めないよう求めています。UIが端末サイズ・ローカライズ間で同じ場合、必要な最高解像度のスクリーンショットを提出すると、小さい端末サイズへ自動的にスケールされます。[2] [3]

## Focus Flowの提出仕様

| ストア | 提出素材 | 実行方針 |
|---|---|---|
| Google Play | Feature graphic、短い説明、詳細説明、実機スクリーンショット | 既存のfeature graphicを1024×500pxのPNG/JPEGへ書き出し、実端末の画面から5枚のスクリーンショットを撮影する。 |
| App Store | 1〜10枚のスクリーンショット、任意のApp Preview | iPhoneの6.9インチ用の最高解像度スクリーンショットを優先し、UIが同じなら小さいサイズには自動スケールを利用する。App Previewは任意のため、初回公開では静止画を優先する。 |

## 推奨する5枚の構成

1. **Today:** 今日の必須項目と集中ルールの状態。
2. **Todo:** 必須・通常の区別、期限、サブタスク、時間管理。
3. **Habit:** 週間進捗と時間管理。
4. **Settings:** 無料の言語・外観設定と、ユーザー設定の集中ルール。
5. **Notes / Review:** メモからTodoへの変換または週の振り返り。

実際に利用できない機能、ストア未設定の商品価格、未実装のiPhoneアプリ制限を素材に含めません。消費型早期完了の商品画面は、内部テストで商品が有効になった後、必要な場合のみ追加のスクリーンショットまたは審査用資料として使います。

## References

[1]: https://support.google.com/googleplay/android-developer/answer/9866151?hl=en "Google Play: Add preview assets to showcase your app"
[2]: https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/ "Apple: Screenshot specifications"
[3]: https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots/ "Apple: Upload app previews and screenshots"

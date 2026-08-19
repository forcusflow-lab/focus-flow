# Google Play Console 進捗記録

最終更新: 2026-08-19（JST）

| 項目 | 状態 | 確認内容 |
|---|---|---|
| デベロッパーアカウント | 完了 | 個人用アカウントでPlay Consoleへログイン済み。 |
| アプリ登録 | 完了 | Focus Flow、パッケージ名 `com.app.focusflow`、日本語、無料アプリとして作成済み。 |
| 初回作成時の同意 | 完了 | ポリシー遵守、Play App Signing、米国輸出法についてアカウント所有者の承認を得て同意済み。 |
| 日本語ストア文 | 下書き再入力が必要 | アプリ名、短い説明、詳細説明を入力したが、画面遷移前に下書き保存していなかったため、再入力後に下書き保存する。 |
| アイコン・フィーチャーグラフィック | 準備中 | アプリアイコンはプロジェクト内にあり、Google Play用フィーチャーグラフィックを生成中。 |
| スクリーンショット | 未作成 | 実機のストア用ビルドで撮影する。 |
| お支払いプロファイル | 完了 | 公開名称をFocus Flow、サポートメールをforcus.flow@gmail.com、カード明細表記をFOCUS FLOWとしてGoogle Paymentsの販売者プロフィールを送信済み。 |
| 収益化商品 | App Bundle待ち | 定期購入画面・1回限りアイテム画面は開けるが、新しいAPK／Android App Bundleのアップロードが必要と表示され、サブスクリプション `focus_flow_plus` と消費型商品 `focus_flow_early_complete_100` の登録はビルド後に進める。 |
| Expo Androidビルド | 再試行準備完了 | Expoアカウント `force-flow` の `focus-flow` プロジェクトへAndroid Play Storeビルドが作成された。初回は古い `package-lock.json` によりEASがnpmを選択し、`npm ci --include=dev` が依存関係不整合で失敗した。package-lock.jsonを除去し、現行のpnpm-lock.yamlを検証済み。20件のVitest成功、TypeScript型検査成功後に再試行可能。 |
| 公開・テスト | 未設定 | 新規個人アカウントのため、製品版アクセスには12人以上・14日以上のクローズドテストが必要と表示されている。 |

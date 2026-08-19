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
| Expo Androidビルド | Kotlin修正・再検証中 | Expoアカウント `force-flow` の `focus-flow` プロジェクトで、依存関係修正後の再試行はGradle工程まで到達。最初に確定したR未解決参照はテンプレートへ`import $PACKAGE_NAME.R`を追加して解消済み。次の詳細ログから、公開されたWidget Providerが`internal`な基底クラス`FocusFlowBaseWidgetProvider`を公開しているためKotlinがコンパイルを拒否したと確定。基底クラスをpublic（既定）へ修正し、再発防止テストを更新した。 |
| Play用AAB出力 | 設定済み・再ビルド待ち | 成功済みのEAS成果物はAPKだったため、Google Playの新規アプリ提出には使用しない。Publishが使用した`production-apk`プロファイルを`eas.json`で明示し、Android出力を`app-bundle`（AAB）へ変更した。 |
| AAB再生成の追加対策 | 設定済み・再ビルド待ち | AAB設定後もPublishが`gradlew :app:assembleRelease`を実行してAPKを出力した。EASログで実行タスクを確認し、`production-apk`プロファイルへ`:app:bundleRelease`を明示指定してAAB生成を強制した。 |
| 公開・テスト | 未設定 | 新規個人アカウントのため、製品版アクセスには12人以上・14日以上のクローズドテストが必要と表示されている。 |

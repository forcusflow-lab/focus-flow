# Google Play Console 進捗記録

最終更新: 2026-08-19（JST）

| 項目 | 状態 | 確認内容 |
|---|---|---|
| デベロッパーアカウント | 完了 | 個人用アカウントでPlay Consoleへログイン済み。 |
| アプリ登録 | 完了 | Focus Flow、パッケージ名 `com.app.focusflow`、日本語、無料アプリとして作成済み。 |
| 初回作成時の同意 | 完了 | ポリシー遵守、Play App Signing、米国輸出法についてアカウント所有者の承認を得て同意済み。 |
| 日本語ストア文 | 下書き再入力が必要 | アプリ名、短い説明、詳細説明を入力したが、画面遷移前に下書き保存していなかったため、再入力後に下書き保存する。 |
| アイコン・フィーチャーグラフィック | 準備完了 | アプリアイコンは `assets/images/icon.png`（PNG、512×512px）、Google Play用フィーチャーグラフィックは `release/store-assets/focus-flow-feature-graphic-1024x500.png`（PNG、1024×500px、RGB）に保存済み。 |
| スクリーンショット | 未作成 | 実機のストア用ビルドで撮影する。 |
| お支払いプロファイル | 完了 | 公開名称をFocus Flow、サポートメールをforcus.flow@gmail.com、カード明細表記をFOCUS FLOWとしてGoogle Paymentsの販売者プロフィールを送信済み。 |
| 収益化商品 | App Bundle待ち | 定期購入画面・1回限りアイテム画面は開けるが、新しいAPK／Android App Bundleのアップロードが必要と表示され、サブスクリプション `focus_flow_plus` と消費型商品 `focus_flow_early_complete_100` の登録はビルド後に進める。 |
| Expo Androidビルド | Kotlin修正・再検証中 | Expoアカウント `force-flow` の `focus-flow` プロジェクトで、依存関係修正後の再試行はGradle工程まで到達。最初に確定したR未解決参照はテンプレートへ`import $PACKAGE_NAME.R`を追加して解消済み。次の詳細ログから、公開されたWidget Providerが`internal`な基底クラス`FocusFlowBaseWidgetProvider`を公開しているためKotlinがコンパイルを拒否したと確定。基底クラスをpublic（既定）へ修正し、再発防止テストを更新した。 |
| Play用AAB出力 | 設定済み・再ビルド待ち | 成功済みのEAS成果物はAPKだったため、Google Playの新規アプリ提出には使用しない。Publishが使用した`production-apk`プロファイルを`eas.json`で明示し、Android出力を`app-bundle`（AAB）へ変更した。 |
| AAB再生成の追加対策 | 設定済み・再ビルド待ち | AAB設定後もPublishが`gradlew :app:assembleRelease`を実行してAPKを出力した。EASログで実行タスクを確認し、`production-apk`プロファイルへ`:app:bundleRelease`を明示指定してAAB生成を強制した。 |
| EAS直接AABビルド | 完了 | EASビルドID `b0ecdc68-03d6-4557-873b-435aca8db4c1` が完了。`1.0.0 (1)`、パッケージ名 `com.app.focusflow` のAABを生成し、`/home/ubuntu/Downloads/Focus-Flow-1.0.0-1.aab` に取得済み。 |
| 内部テストリリース | 公開開始済み | バージョンコード `2` のApp Bundle `2 (1.0.0)`、新規インストール21.9MB、リリースノートを確認済み。アカウント所有者の承認を得て「保存して公開」を実行し、Play Consoleで最新リリース `1.0.0 (2) internal` が「内部テスターに公開」と表示されることを確認。次はテスターを追加してオプトインURLを取得する。 |
| 内部テスター | 設定完了 | `Focus Flow Internal Testers` メーリングリストに1ユーザーが登録され、内部テストトラックへ保存済み。Play Consoleで最新リリースが「有効」と表示されることを確認。ウェブ参加リンクは `https://play.google.com/apps/internaltest/4701206931464809469`。次にライセンステストを設定する。 |
| ライセンステスト | 設定完了 | デベロッパーアカウント設定の「ライセンス テスト」で、`Focus Flow Internal Testers`（1ユーザー）を選択。ライセンス応答は `RESPOND_NORMALLY` とし、最終確認を経て保存済み。Play Consoleに「変更を保存しました」と表示されることを確認した。 |
| 公開ポリシーURL | 準備完了 | サーバールート `/policy` 等は現在の公開ドメインで反映待ちのため、HTTPSストレージへ実ページを公開して外部表示を確認した。Google PlayのプライバシーポリシーURLには `https://focusapp-dmnamiyd.manus.space/manus-storage/focus-flow/public-pages/privacy_a9a9d4ef.html` を入力する。サポートURLは `https://focusapp-dmnamiyd.manus.space/manus-storage/focus-flow/public-pages/support_69ce6fd6.html`、利用条件URLは `https://focusapp-dmnamiyd.manus.space/manus-storage/focus-flow/public-pages/terms_c26afde2.html`。 |
| ストア掲載画像 | 一部準備完了 | Google Play用フィーチャーグラフィックを `release/store-assets/focus-flow-feature-graphic-1024x500.png`（PNG、1024×500px、RGB）として生成。アプリアイコンは `assets/images/icon.png`（PNG、512×512px）。実機の実際の機能を示す電話用スクリーンショット5枚は、内部テスト端末での動作確認時に撮影する。 |
| 公開・テスト | 未設定 | 新規個人アカウントのため、製品版アクセスには12人以上・14日以上のクローズドテストが必要と表示されている。 |
| 内部テスト参加エラー | 配信反映待ちの可能性が高い | 内部テスターが参加リンクで「アイテムは見つかりませんでした」と表示された。Play Consoleでは内部テストトラックが「有効」、最新リリース `1.0.0 (2) internal` と表示され、メーリングリスト `Focus Flow Internal Testers` には `forcus.flow@gmail.com` が1ユーザーとして登録済みであることを編集画面で確認した。参加ページに「あなたはテスターです」と表示されるため、アカウント認証も成功している。Google公式ヘルプは、テストトラックの初回公開後と更新公開後にはテスターがリンクを使えるまで数時間かかる場合があると案内している。現時点では配信反映待ちが最も考えられるため、数時間後に同じ参加リンクから再試行する。 |

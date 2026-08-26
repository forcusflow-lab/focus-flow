# Focus Flow v13 — レイアウト・操作導線修正版の署名ビルド記録

## 1. 対象コミットと目的

本記録は、実機で報告された統合Widgetのカード・チェック領域・本文・余白の崩れ、完了チェックによる不要な画面遷移、Todayからの一覧経由遷移を修正した再受入候補を対象とする。対象GitHubコミットは`631a6c6e1b21ed27d78b6298c10e20b8f0d75bac`である。

| 配布区分 | パッケージ | versionCode | GitHub Actions Run | 結果 |
|---|---|---:|---:|---|
| 通常のGoogle Play候補 | `com.app.focusflow` | 13 | [32911153481](https://github.com/forcusflow-lab/focus-flow/actions/runs/32911153481) | 成功 |
| 本人用・制限なしAPK | `com.app.focusflow.personal` | 3 | [32912478673](https://github.com/forcusflow-lab/focus-flow/actions/runs/32912478673) | 成功 |

## 2. 自動品質ゲート

コード変更後に`pnpm check`、`pnpm lint`、`pnpm test`を実行し、Vitestは**18ファイル・57件成功、1件スキップ**だった。通常版versionCode 13と本人用versionCode 3について、`expo prebuild --platform android --clean --no-install`をそれぞれ実行した。通常版の生成物では`manusfocusflow:///`とversionCode 13、本人用では`manusfocusflowpersonal:///`とversionCode 3を確認した。

## 3. 通常版AABの成果物検証

GitHub Actionsから取得した`app-release.aab`は38,567,877 bytesだった。ZIP整合性を検証し、AAB内の署名証明書からSHA-1を直接取得した。

| 検証項目 | 結果 |
|---|---|
| ZIP整合性 | 成功 |
| SHA-256 | `79b955816bef647af3cc9ed70618c57fd0f0d7016bdd8fb744a19bf827c7f957` |
| Google Play upload certificate SHA-1 | `0D:A5:A7:0E:14:A2:A4:3A:DB:A8:F8:04:40:81:C5:B2:18:86:B5:BC` |
| 期待する登録済みSHA-1との照合 | 一致 |

## 4. 本人用APKの成果物検証

GitHub Actionsから取得した`app-release.apk`は51,734,204 bytesだった。ZIP整合性とSHA-256を確認した。別パッケージ、versionCode、専用Deep Linkは同一コミットの本人用クリーンAndroid生成でも確認している。

| 検証項目 | 結果 |
|---|---|
| ZIP整合性 | 成功 |
| SHA-256 | `4c3c633d9d932116f34ad5a88cf344d52e9811dc92607ad4662b7ac2214086f6` |
| 別パッケージ | `com.app.focusflow.personal` |
| versionCode | 3 |
| 専用Deep Link | `manusfocusflowpersonal:///` |

## 5. 実機受入の残項目

この記録はビルド・署名・静的検証の結果であり、実機合格を意味しない。再受入では、Widgetの小・標準・拡大サイズ、短文・長文、必須・通常、完了・未完了、透明度、スクロール、チェック／復元、本文からの詳細、ヘッダーからのTodayを確認する。さらにTodayで、チェックが画面遷移を起こさないこと、本文・矢印が直接詳細を開くこと、閉じる・戻るでTodayへ復帰することを確認する。設定詳細のAndroid戻る、遮断画面のToday遷移、通常版・本人用版のDeep Linkも対象に含める。

Google Play内部テストへのアップロード・公開は実施していない。所有者による実機受入と明示確認の後にのみ行う。

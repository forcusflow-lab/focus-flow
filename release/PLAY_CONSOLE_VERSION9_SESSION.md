# Google Play 内部テスト — versionCode 9 配布記録

- **対象アプリ**: Focus Flow（`com.app.focusflow`）
- **トラック**: 内部テスト
- **リリース状態**: 未公開のリリース作成画面（リリースID 8）を開いた状態
- **配布ファイル**: `/home/ubuntu/Downloads/focus-flow-v9-aab/app-release.aab`
- **ファイル検証**: ZIP整合性を確認済み。Google Playアップロード証明書SHA-1は `0D:A5:A7:0E:14:A2:A4:3A:DB:A8:F8:04:40:81:C5:B2:18:86:B5:BC` と一致。
- **画面確認**: App Bundleのアップロード領域が表示され、既存リリースのversionCode 8のみが一覧にある。次の操作はversionCode 9 AABのアップロード。
- **操作補足**: 画面のアップロード領域は表示されているが、ブラウザの通常要素一覧にはファイル入力欄が公開されていない。HTMLを確認してファイル入力に紐づく操作対象を特定する。

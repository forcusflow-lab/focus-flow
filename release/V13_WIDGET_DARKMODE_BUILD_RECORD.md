# Focus Flow v13 高密度Widget・ダークモード修正版 ビルド記録

**記録日:** 2026-08-26  
**対象コミット:** `1b31dfd5ece41cfb65c2a0e8b8d4aeeefda55987`  
**目的:** Widgetの過大カード・余白・文字サイズ不一致、およびアプリ全体のダークモード可読性を改修した成果物を署名ビルドし、実機受入へ渡す。

## 1. 自動品質ゲート

| 検証 | 結果 | 記録 |
|---|---|---|
| TypeScript型検査 | 成功 | `pnpm check` |
| ESLint | 成功 | `pnpm lint` |
| Vitest | 成功 | 19 files / 60 passed / 1 skipped |
| 通常版Androidクリーン生成 | 成功 | `CI=1 npx expo prebuild --platform android --clean --no-install` |
| 本人用Androidクリーン生成 | 成功 | `FOCUS_FLOW_PERSONAL_UNLIMITED=1 CI=1 npx expo prebuild --platform android --clean --no-install` |

> 外部Expo認証テストは一度だけ5秒の既定時間を超えたため、当該テストに20秒の明示的タイムアウトを設定した。以後の全スイートでは正常に完了している。

## 2. 通常版 Google Play 用 AAB

| 項目 | 値 |
|---|---|
| GitHub Actions | [Build signed Android App Bundle run 32921720964](https://github.com/forcusflow-lab/focus-flow/actions/runs/32921720964) |
| 結果 | 成功 |
| パッケージ | `com.app.focusflow` |
| versionCode | `13` |
| AAB容量 | 38,573,979 bytes |
| SHA-256 | `d360e65d12679d7f5af3cac0c0885f807c0d508719886628a5b859373eb5f099` |
| ZIP整合性 | 成功 |
| Google Play upload certificate SHA-1 | `0D:A5:A7:0E:14:A2:A4:3A:DB:A8:F8:04:40:81:C5:B2:18:86:B5:BC` |

署名証明書SHA-1は、既存のGoogle Playアップロード証明書の期待値と一致した。**Google Play内部テストへのアップロード・公開は実行していない。**

## 3. 本人用・制限なし APK

| 項目 | 値 |
|---|---|
| GitHub Actions | [Build Focus Flow personal unlimited APK run 32921738375](https://github.com/forcusflow-lab/focus-flow/actions/runs/32921738375) |
| 結果 | 成功 |
| パッケージ | `com.app.focusflow.personal` |
| versionCode | `3` |
| 専用Deep Link | `manusfocusflowpersonal:///` |
| APK容量 | 51,742,968 bytes |
| SHA-256 | `8abf84d9f30e1af25b05bf1ffc6608971ab2cd9744ed9236e2a45cbb2b00810a` |
| ZIP整合性 | 成功 |

本人用APKは通常のPlay版とは別パッケージであり、通常版の無料制限・購入処理・Google Play配布には影響しない。

## 4. 未完了のAndroid実機受入

署名ビルドの成功は、端末上でのレイアウト・タップ判定・テーマ可読性の合格を意味しない。以下は実機で確認が必要である。

1. Widgetを小・標準・大にリサイズし、48dp高密度行で複数項目が表示され、切れ・重なり・大きな空白がないこと。
2. `コンパクト`・`標準`・`大きめ`の文字サイズで、Todo・習慣・必須・時間帯ラベルが同じ倍率規則で読めること。
3. Widgetのチェックが行中央の48dp領域で完了／復元だけを実行し、本文タップは該当詳細、余白タップはTodayを開くこと。
4. 全テーマのダークモードで、Today、Todo、習慣、メモ、振り返り、その他、設定、Plus、法務、サポート、モーダル、遮断画面、Widgetの文字・入力・境界が読めること。
5. Todayでのチェックは遷移せず、本文は直接詳細を開き、閉じる・戻るでTodayへ戻ること。

実機受入に合格し、アカウント所有者が明示確認した後にのみ、通常版AABをGoogle Play内部テストへアップロード／公開する。

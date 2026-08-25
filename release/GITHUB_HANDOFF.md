# Focus Flow — GitHub引継ぎ・署名ビルド運用

## 1. 目的と原則

GitHubリポジトリは、Focus Flowのソース、設計書、テスト計画、署名ビルド定義を共有する唯一の開発履歴である。複数のAIまたは開発者が作業するときは、`main`を直接推測で書き換えず、最新状態を確認してから小さな目的単位で変更する。競合した要件や判断できないリリース可否は、所有者へ確認する。

## 2. GitHub Actions

| ワークフロー | 用途 | 成果物 | 公開操作 |
|---|---|---|---|
| `.github/workflows/android-build.yml` | 通常版の署名済みGoogle Play候補AAB | `app-release.aab` | Google Playへのアップロードは行わない |
| `.github/workflows/personal-unlimited-apk.yml` | 本人用の別パッケージ・制限なしPlus APK | `Focus-Flow-Personal-Unlimited.apk` | Google Playへ使用しない |

通常版の署名ワークフローは、クリーンExpo prebuild、release bundle、アップロード証明書照合、成果物保存を実行する。GitHub上のワークフロー成功は、Android実機でのWidgetやアクセシビリティ遮断の動作保証ではない。実機受入は必須である。

## 3. 必要なGitHub Secrets

秘密値そのものはリポジトリ、Issue、ログ、チャットへ記録しない。

| Secret | 用途 |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Google Playアップロード用キーストア |
| `ANDROID_KEY_ALIAS` | キー別名 |
| `ANDROID_KEY_PASSWORD` | キーパスワード |
| `ANDROID_KEYSTORE_PASSWORD` | キーストアパスワード |

既存のGoogle Playアップロード証明書SHA-1は、ビルド後に期待値と照合する。証明書の変更や新規アップロードキーの登録は、Google Play Console上の外部確定操作であり、所有者確認を要する。

## 4. AI／開発者の標準フロー

1. `main`の最新コミット、`todo-btb3aesl.md`、`release/`の設計書・テスト計画を確認する。
2. 変更する機能について、仕様・状態遷移・受入基準を追記し、未完了Todoを作る。
3. 実装後に回帰テストを追加または更新する。Androidテンプレート変更時はExpoプラグインも更新する。
4. `pnpm check && pnpm lint && pnpm test`を実行する。
5. 通常版と本人用版の両方でクリーンAndroid生成を行い、パッケージ、versionCode、Deep Link、Receiverを確認する。
6. 変更・検証結果をコミットしてGitHubへ反映する。
7. 署名ビルドが必要なときだけActionsを手動実行し、成果物・署名・ZIP整合性を確認する。
8. 実機受入が未完了なら、未検証として明確に残す。Google Play内部テストへの公開は所有者確認後だけに行う。

## 5. 配布区分

| 区分 | パッケージ | versionCode | 用途 | 注意 |
|---|---|---:|---|---|
| 通常版 | `com.app.focusflow` | 12 | Google Play内部テスト・将来のストア配布 | Google Playでは既存アップロード証明書で署名する |
| 本人用Plus版 | `com.app.focusflow.personal` | 2 | 所有者だけの制限なしAPK | 通常版とは共存する。更新にはversionCode増分が必要 |

## 6. Deep Linkとネイティブ注意点

Widget、遮断オーバーレイ、`FocusGateActivity`のURIは`scheme:///path`形式で統一する。Expo Routerはauthority形式を画面名として解釈しないため、`scheme://today`を生成してはならない。生成済みAndroidコードだけを直接修正しても次回prebuildで失われるため、必ず`plugins/native/android/`と`plugins/with-focus-flow-android.js`を更新する。

## 7. リリース前の最終確認

- GitHub Actionsで署名済みAABまたはAPKが成功している。
- アップロード証明書、ZIP整合性、versionCodeを確認している。
- Android実機で起動、時間帯必須、遮断→Today、Widget完了・復元・詳細遷移、戻る、設定、通知、Plus導線を確認している。
- `release/V12_TEST_PLAN.md`の未確認項目を残していない。
- 内部テスト公開または一般公開は、所有者が確認した後にだけ実行する。

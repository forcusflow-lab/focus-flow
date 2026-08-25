# Focus Flow v12 — 署名ビルド記録

## 1. 対象

本記録は、通常版Focus Flow v12のGoogle Play内部テスト候補について、GitHub Actionsでの署名済みAndroid App Bundle生成結果を残すものである。実機受入結果は含まない。署名ビルドの成功は、Widget、アクセシビリティ遮断、起動、戻る、Deep Linkの端末上の動作を保証するものではない。

| 項目 | 結果 |
|---|---|
| 実行日時 | 2026-08-25（GitHub Actions表示時刻） |
| GitHubリポジトリ | `forcusflow-lab/focus-flow` |
| 対象コミット | `fefb97392e6f4df7ece33c9d8ff7908801c12fdf` |
| ワークフロー | `Build signed Android App Bundle` |
| Run | [#12 / 32903734112](https://github.com/forcusflow-lab/focus-flow/actions/runs/32903734112) |
| 結果 | **成功** |
| 所要時間 | 28分17秒 |
| 生成物 | `app-release.aab`（artifact: `focus-flow-v7-aab`） |
| Android package | `com.app.focusflow` |
| versionCode | `12` |

## 2. 成果物の独立確認

GitHub Actionsが復元したGoogle Playアップロード用キーストアで生成したAABを一時領域へ取得し、圧縮データと署名を再確認した。

| 検証 | 実測結果 | 判定 |
|---|---|---|
| AABサイズ | 38,567,802 bytes | 取得完了 |
| ZIP整合性 | `No errors detected in compressed data` | 合格 |
| upload certificate SHA-1 | `0D:A5:A7:0E:14:A2:A4:3A:DB:A8:F8:04:40:81:C5:B2:18:86:B5:BC` | 期待値と一致 |
| AAB SHA-256 | `5ad371266d64a4e887c8c8102cb3f546324e88a7d30d01506722f5e4526be55f` | 記録済み |

## 3. ワークフロー上の注意

ワークフローは成功し、成果物を保存した。GitHub Actionsの画面には、`actions/checkout@v4`、`actions/setup-node@v4`、`actions/upload-artifact@v4`、`pnpm/action-setup@v4`がNode.js 20を対象とし、実行基盤でNode.js 24へ強制移行された旨の警告が1件表示された。署名、AAB生成、証明書照合はすべて成功しており、今回のリリース候補を阻害する警告ではない。次回の保守で、各ActionのNode.js 24対応版を確認して更新可否を検討する。

## 4. 次の品質ゲート

通常版については、Android実機受入が残っている。`V12_TEST_PLAN.md`のDEV-01からDEV-10を、実機・OS・ビルド番号とともに記録する。本人用制限なしPlus APKは、WidgetのUnmatched Route修正とversionCode 2を含む更新版を別ワークフローで生成し、通常版とは混在させない。内部テストへのアップロード・公開は、全実機受入が終わり、所有者の明示確認を得た後にだけ行う。

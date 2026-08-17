# Focus Flow 依存関係監査の対応状況

**確認日:** 2026-08-17  
**対象:** Focus Flow 1.0.0 / Expo SDK 54  
**実行コマンド:** `pnpm audit --prod --audit-level=high`

## 結論

`fast-uri` は 3.1.0 から、公開済みの修正版 **3.1.3** に固定しました。これは `expo-build-properties` → `ajv` の経路で利用されていました。[1]

一方、残存する高重大度アラートは、Expo SDK 54の `@expo/metro-config@54.0.17` が固定する **PostCSS 8.4.49** の経路です。PostCSSの該当修正版は 8.5.18 以降ですが、Expo SDK 54側の依存範囲は `~8.4.32` です。[2] [3] pnpmの強制オーバーライドおよび最小パッチを試行しましたが、ロック済みのExpo SDK 54ツリーには安全に適用されませんでした。審査中のバイナリとExpo SDK 54の互換性を壊す可能性があるため、**現在の提出物に対する強制的なフレームワーク更新は行いません**。

## 監査結果の分類

| 項目 | 状態 | 判断 |
|---|---|---|
| `fast-uri` のhost confusion / IDN canonicalization | 修正済み | `pnpm-workspace.yaml` のオーバーライドにより 3.1.3 を使用。 |
| `shell-quote` | 修正済み | 既存の修正版 1.8.4 固定を維持。 |
| `tar` | 修正済み | 既存の修正版 7.5.19 固定を維持。 |
| PostCSS 8.4.49 | 保留 | Expo CLI / Metro構成のビルド時依存。Expo SDK 54の互換パッチが提供されるか、審査完了後にSDK更新を行う際に再評価。 |

## 残件のリスクと運用

PostCSSのアラートは、外部から持ち込んだCSSとsource map参照を処理するビルド環境に関係します。Focus Flowはアプリ利用者のTodo、メモ、アクセシビリティ情報をPostCSSに渡さず、アプリ内で任意のCSSをアップロード・実行する機能も提供しません。それでも、開発・ビルド環境では未知の第三者ソースを取り込まず、依存関係を固定し、Expo SDKの互換更新が公開された時点で再監査します。[2]

監査コマンドの集計では、高重大度アラートが複数経路として数えられます。これは同じPostCSSパッケージがExpo CLIとMetro構成から複数回参照されるためで、個別のアプリ機能が多数の独立した脆弱性を持つことを意味しません。最終的な公開判断は、ストア審査結果、Expo側の互換更新、実機テスト、利用するビルド環境の運用に基づきます。

## 次回メンテナンス時の手順

1. Google Playの審査結果が確定した後、Expo SDK 54の最終パッチまたは次の対応SDKで `@expo/metro-config` がPostCSS 8.5.18以上を採用しているか確認します。
2. `expo install --fix` 相当の互換更新を、別ブランチまたは新しいビルド番号で実施します。
3. iOS・Androidのバンドル生成、型検査、ユニットテスト、Lint、`pnpm audit --prod --audit-level=high` を再実行します。
4. Play内部テストおよびTestFlightで、通知、集中ルール、Plus購入・復元・管理、無料設定を再確認します。

## References

[1]: https://github.com/advisories/GHSA-4c8g-83qw-93j6 "GitHub Advisory: fast-uri"
[2]: https://github.com/advisories/GHSA-r28c-9q8g-f849 "GitHub Advisory: PostCSS"
[3]: https://pnpm.io/settings/dependency-resolution "pnpm: Dependency resolution settings"

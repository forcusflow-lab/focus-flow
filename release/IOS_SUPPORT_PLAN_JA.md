# Focus Flow iPhone対応計画

## 現状の結論

現行のFocus Flowは、Todo、習慣、メモ、日課、表示設定、FAQ、不具合報告を含むReact Native画面をiPhoneで提供できる構成です。一方で、必須項目を完了するまで選択アプリを制限する中核機能は、Androidのアクセシビリティサービスとウィジェットに依存しており、iPhoneでは利用できません。

| 機能領域 | 現行iPhone対応 | 必要な対応 |
| --- | --- | --- |
| Todo・習慣・メモ・日課・FAQ | 対応可能 | iOSビルドと実機QA |
| 端末内保存・言語・テーマ | 対応可能 | iOS実機での永続化確認 |
| アプリ制限・解除条件 | 未対応 | Screen Time APIのネイティブ実装 |
| アプリ選択・制限画面 | 未対応 | FamilyControls、ManagedSettings、Shield拡張 |
| 時間帯ごとの自動制限 | 未対応 | DeviceActivity Monitor拡張 |
| ホーム画面ウィジェット | 未対応 | WidgetKit拡張（第2段階） |

## 推奨する段階的な進め方

### 第1段階：iPhone基本機能版

ExpoでiOS開発ビルドを作成し、Todo・習慣・メモ・日課・英語化・FAQをiPhone実機で検証します。この段階では、iOS版の「App limits」は未提供であることを明確に表示し、Android版との機能差を隠しません。

### 第2段階：Apple Screen Time方式の試作

AppleのFamily Controls、Managed Settings、Device ActivityをSwiftで実装します。React Native/Expoからは専用のネイティブモジュールとConfig Pluginで呼び出し、利用者が選んだアプリ・カテゴリ・WebドメインをSystem UI経由で扱います。Androidのアクセシビリティ方式はiOSへ移植せず、OS標準のScreen Time方式を使います。

### 第3段階：配布権限とTestFlight

Apple Developer ProgramのAccount Holderが、メインアプリと全Screen Time拡張についてFamily Controls distribution entitlementを申請します。承認後に各ターゲットの署名・プロビジョニングを更新し、TestFlightの少人数テストでApp limits、解除、安全停止相当の設計を確認します。

## 実装・公開の前提条件

Family ControlsはiOS 15以降で利用できますが、App Store配布前にはFamily Controls entitlementの配布許可が必要です。Screen Time APIを使う場合、アプリ本体に加え、Device Activity MonitorやShield Configurationなど必要な拡張ごとに権限・署名を設定します。[1] [2] [3]

> iOSのアプリ制限は、Androidのアクセシビリティサービスと同じ挙動を保証するものではありません。利用者の選択、Appleの権限承認、OSのScreen Time APIの制約を尊重した別設計として提供します。

## 次の実行順序

1. Apple Developer Programの組織・Account Holder・iOS Bundle IDを確定する。
2. iPhone実機向けの基本機能版をビルドし、Todo・習慣・メモの使用感を確認する。
3. Family Controls distribution entitlementを申請する。
4. 承認後にSwift拡張、Expo Config Plugin、Screen Timeのアプリ選択・シールドを実装する。
5. TestFlightで端末・iOSバージョン別の制限と解除フローを検証する。

## 参考資料

[1] [Apple Developer: Family Controls](https://developer.apple.com/documentation/familycontrols)

[2] [Apple Developer: Configuring Family Controls](https://developer.apple.com/documentation/xcode/configuring-family-controls)

[3] [Apple Developer: Requesting the Family Controls entitlement](https://developer.apple.com/documentation/familycontrols/requesting-the-family-controls-entitlement)

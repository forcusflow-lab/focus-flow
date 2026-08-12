# 添付APKの静的分析とFocus Flow再構築方針

## 分析範囲

本書は、ユーザー提供の `AppBlockv7.9.1(Premium).apk` を**実行せず**に、ZIP/APK構造、復元済みマニフェスト、リソース文字列、DEXに含まれる可読な識別子を確認した結果である。動的挙動、ネットワーク通信、実際の遮断精度、課金状態、端末への影響は検証していない。そのため、本書では静的に確認できる事項と、名称から推定できる事項を区別して扱う。

| 項目 | 観測結果 |
|---|---|
| 分析対象SHA-256 | `e4e1eacdb5bd73544f012c6d1be2a329b5d5c5f1ba14a6dcb10490fc74503294` |
| APK構成 | 3,641エントリ、展開前合計174,944,492バイト |
| 実装形態 | `classes.dex` から `classes8.dex` までの8個のDEXを確認 |
| 復元済みパッケージ識別子 | `cz.mobilesoft.appblock` を含む独自アクティビティ・サービス・プロバイダを確認 |
| 署名上の注意 | 証明書のSubjectは `CN=youarefinished`、SHA-1/RSA 1024-bitの警告を確認。提供APKの完全性・正規配布元・課金状態は本分析では保証しない。 |

## 静的に確認できた機能領域

復元した文字列とクラス名には、`QuickBlockRepository`、`StrictModeRepository`、`ScheduleRepository`、`PomodoroDto`、`UsageLimit`、`Profile`、`WebsiteProfileRelation` が含まれていた。マニフェストにはロック画面系アクティビティ、アクセシビリティサービス、オーバーレイサービス、通知リスナー、起動完了レシーバーが含まれる。これらの痕跡から、主な機能領域は以下のように整理できる。

| 機能領域 | 静的根拠 | 解釈 |
|---|---|---|
| アプリ・サイト遮断 | `LockActivity`、`LockService`、`OverlayService`、`WebsiteProfileRelation` | ルールに該当したアプリまたはサイトを遮断する構成が示唆される。 |
| 即時の集中開始 | `QuickBlockRepository`、`QuickBlockWidgetState`、`QuickBlockTileService` | 時間指定なし／短時間で開始する集中ブロックとショートカットの存在が示唆される。 |
| スケジュール・プロファイル | `ScheduleRepository`、`ProfileBroadcastReceiver`、`ScheduleSelectScreen` | 時刻や条件に応じて遮断ルールを切り替える構成が示唆される。 |
| 強制モード | `StrictModeRepository`、`strict_mode_cannot_edit_blockings` などの文字列 | 設定の変更や遮断停止を制限するモードの存在が示唆される。 |
| 利用時間制限 | `UsageLimitDao`、`UsageLimitTimer`、`PACKAGE_USAGE_STATS` | アプリ利用時間を基に制限する機能の存在が示唆される。 |
| 集中補助 | `PomodoroDto(focusTime=...)` | ポモドーロ型の集中時間設定が示唆される。 |

## 高権限と安全上の観点

復元済みマニフェストには、`PACKAGE_USAGE_STATS`、`SYSTEM_ALERT_WINDOW`、`BIND_ACCESSIBILITY_SERVICE`、`BIND_NOTIFICATION_LISTENER_SERVICE`、`RECEIVE_BOOT_COMPLETED`、`FOREGROUND_SERVICE_SPECIAL_USE` などが確認できた。これらはアプリ遮断や利用時間監視に関連し得る一方、端末上での影響範囲が広い。提供ファイル名に「Premium」を含むこと、および確認された署名情報を踏まえ、提供APKを再配布・改変・権限を伴う実行の対象にはしない。

> 本プロジェクトは、元APKのコード・画面・ブランド・ライセンス回避を複製しない**クリーンルーム再構築**である。静的に得た抽象的な製品要件のみを参照し、新しいコードと独自の情報設計で実装している。

## Focus Flowでの再構築判断

Focus Flowは、集中を妨げる対象を端末レベルで遮断するのではなく、今日の行動を選び、終了し、振り返るためのローカルファーストの生産性アプリとして設計した。ユーザーが求めたTodo管理と習慣化を中心にし、端末の他アプリやブラウザ履歴にアクセスしない。

| 構成要素 | Focus Flowでの実装 | 判断理由 |
|---|---|---|
| 集中セッション | 25分タイマー、完了時の集中記録、週次集計 | 高権限なしで集中行動を記録できるため。 |
| Todo | 追加、編集、優先度、期限、完了、削除 | 日々の意図を具体的な行動へ落とすため。 |
| 習慣 | 週目標、日別記録、連続日数、週間進捗 | 継続を可視化し、再開しやすくするため。 |
| 振り返り | 直近7日間の集中、完了Todo、習慣進捗 | 小さな前進を確認して次週の調整につなげるため。 |
| データ保存 | AsyncStorageによる端末内保存 | アカウントやクラウド同期を前提にしないため。 |
| 端末レベル遮断 | 未実装 | アクセシビリティ、オーバーレイ、利用状況アクセスを要求しない安全な初期範囲とするため。 |

## 今後の拡張候補

将来的に通知、クラウド同期、アプリ遮断を追加する場合は、各機能を独立した同意フローと権限説明の下で検討する必要がある。特に端末上の他アプリを扱う機能は、OS・ストアポリシー・アクセシビリティ利用規約・最小権限設計を満たしていることを別途検証する。初期版のFocus Flowは、端末内のTodo、習慣、集中記録のみを扱う。

# Focus Flow 本人用 v11 署名APKビルド記録

## 判定

本人用 `com.app.focusflow.personal` / `versionCode 11` を、**実機受入専用の暫定検証APK**として生成・独立検証した。実機画像では、Habit／Todayの必須Pillが`必`に切れ、Widgetも目標とするコンパクトな単一リストカードの情報密度・Pill可読性に達していないことを確認した。そのためv11は**実機不合格**であり、正式配布およびGoogle Play配布の対象ではない。

| 項目 | 検証結果 |
|---|---|
| GitHub Actions | run `33019053821`、成功 |
| ソース | `60480030e5509d2bf402afe63491bad354460e53` |
| APK | `app-release.apk`、51,773,853 bytes |
| SHA-256 | `841aeb88e4a6a25a10b4921535ffffd6ab7d440c72965c8106ccf2cc6ba34292` |
| ZIP整合性 | `unzip -t` 成功 |
| package / versionCode | `com.app.focusflow.personal` / `11` |
| 署名 | APK Signature Scheme v2、有効。証明書SHA-1 `0D:A5:A7:0E:14:A2:A4:3A:DB:A8:F8:04:40:81:C5:B2:18:86:B5:BC` |
| Manifest | 専用scheme `manusfocusflowpersonal`、Widget Provider、initial-info metadataを確認 |
| Widget資産 | 3行ID、丸角必須Pill、丸形チェック、light/darkカードdrawableをresources.arscで確認 |
| 旧経路 | `FocusFlowWidgetItemsService`、`setRemoteAdapter`、`BIND_REMOTEVIEWS` がDEXに不在 |

## 実機受入ケース

| ID | 操作 | 合格条件 |
|---|---|---|
| R11-01 | Widgetを小・標準・大へ連続変更 | 外形と内容が1/2/3行に追従し、古いサイズの表示が残らない |
| R11-02 | Todo/習慣を混在させてWidgetを表示 | 単一のリストカード、日付/見出し、控えめな区切り、左の丸形完了操作、最大3行が確認できる |
| R11-03 | 必須Todo・必須Habit、文字サイズ小/標準/大 | Widget・習慣・Todayの全てで`必須`が完全に読める |
| R11-04 | ライト/ダーク、背景濃さ0/50/100% | surface、本文、補足、必須Pill、丸形チェックが判読できる |
| R11-05 | 本文・丸形完了操作をタップ | 対象だけが完了/復元し、本文は該当詳細、見出しはTodayを開く |

> 上表のいずれかが不合格なら、v11を正式版として扱わず、Google Playへアップロードしない。

## 実機結果（不合格）

| ID | 実機で確認した状態 | 判定 | 次の修正方針 |
|---|---|---|---|
| R11-02 | Widgetが参考のコンパクトな単一リストカードより大きく、情報密度・補助要素の見え方が不適切 | 不合格 | ランチャーのサイズ別RemoteViewsとカード面・行構造を再分離する |
| R11-03 | 本体のHabit／Todayで必須Pillが`必`に切れる | 不合格 | Pill自身と親コンテナの縮小・クリップを実端末幅で排除する |
| R11-04 | WidgetのPill／補足の可読性が受入基準に届かない | 不合格 | surface・本文・Pillのコントラスト契約をサイズ別に強化する |

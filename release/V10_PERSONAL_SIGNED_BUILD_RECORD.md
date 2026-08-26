# Focus Flow 本人用 v10 署名APKビルド記録

## 判定

本人用 `com.app.focusflow.personal` / `versionCode 10` の署名APKを、**暫定実機検証専用**として用意した。WidgetとToday習慣カードの実機スクリーンショット受入は未完了であり、正式配布およびGoogle Play配布の対象ではない。

| 項目 | 検証結果 |
|---|---|
| GitHub Actions | run `33011759907`、成功 |
| ソース | `0e707c1a65e3935ed33b0d1807e16bbe9a56f9e8` |
| APK | `app-release.apk`、51,773,203 bytes |
| SHA-256 | `283ce05b253b3ba5c42546c2b87bbaae57e0cefafe104594452c390f6683e51b` |
| ZIP整合性 | `unzip -t` 成功 |
| package / versionCode | `com.app.focusflow.personal` / `10` |
| 署名 | APK Signature Scheme v2、有効。証明書SHA-1 `0D:A5:A7:0E:14:A2:A4:3A:DB:A8:F8:04:40:81:C5:B2:18:86:B5:BC` |
| Manifest | 専用scheme `manusfocusflowpersonal` とWidget Providerを確認 |
| Widget資産 | 4行識別子、light/dark × 0/25/50/75/100%カードdrawable、チェック資産をresources.arscで確認 |
| 禁止経路 | `FocusFlowWidgetItemsService`、`setRemoteAdapter`、`BIND_REMOTEVIEWS`がDEXに不在 |

## v10実機受入

| ID | 実機操作 | 合格条件 |
|---|---|---|
| W10-01 | 小・標準・大へWidgetを変更 | 1/2/4行へ情報密度が変わり、切れ・空白・重なりがない |
| W10-02 | テーマを各種ライト/ダークへ変更 | ヘッダー、本文、必須タグ、操作面が本体テーマと同じ色系統で読める |
| W10-03 | 必須Todo/習慣を表示 | `必須`が一文字に切れず、正方形チェックが見える |
| W10-04 | 回数習慣の−/＋を操作 | 対象行だけが増減し、進捗と完了状態が一致する |
| W10-05 | 時間習慣の開始を操作 | `開始`から`計測中`へ変わり、アプリ復帰後の計測状態と一致する |
| A10-01 | Todo/習慣/Todayを文字サイズ3段階、ライト/ダークで確認 | 必須Pillが完全に読み取れ、Today習慣が習慣タブと同じ週次・進捗・完了・詳細導線を持つ |

> 不合格が1件でもあれば、このAPKを正式版として扱わず、Google Playへアップロードしない。

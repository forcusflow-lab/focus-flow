# 前面アプリ再開時の集中制限診断

2026-08-20

## 確認結果

最近使ったアプリ一覧から制限対象アプリを再開した場合、アクセシビリティサービスは `TYPE_WINDOWS_CHANGED` を受け取ることがあります。このイベントの `packageName` は再開対象ではなく、最近使ったアプリ画面などのシステムUIになる場合があります。既存実装はイベントの `packageName` をアクティブウィンドウより優先していたため、再開対象アプリを評価できず、遮断が漏れる経路がありました。

Android公式ドキュメントでは、ウィンドウ変更の把握に `TYPE_WINDOWS_CHANGED` を使い、サービスがウィンドウ内容を取得できる場合はアクティブウィンドウのルートを取得できることが示されています。[1][2]

## 修正方針

`FocusGateService` は、アクティブまたはフォーカス中のウィンドウのパッケージを優先して判定し、イベント発生直後と短い遅延後の双方で評価します。さらに `TYPE_VIEW_FOCUSED` を監視対象へ追加し、既存アクティビティへの復帰時も判定契機を増やします。遅延評価は最近使ったアプリの切替アニメーション後に実際の前面アプリを再取得するためのもので、継続的な監視やバックグラウンドポーリングは行いません。

## 参照

[1] [Android Developers: 独自のユーザー補助サービスを作成する](https://developer.android.com/guide/topics/ui/accessibility/views/service)

[2] [Android Developers: AccessibilityService.getRootInActiveWindow](https://developer.android.com/reference/android/accessibilityservice/AccessibilityService#getWindows())

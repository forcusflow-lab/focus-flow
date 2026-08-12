# Androidネイティブ機能の実装判断メモ

## アクセシビリティサービス

Android公式ドキュメントでは、アクセシビリティサービスは `AccessibilityService` を継承してマニフェストに登録し、システムのみがバインドできる `BIND_ACCESSIBILITY_SERVICE` を厳格に宣言することが求められている。また、イベント種別は必要最小限に絞るべきであり、全イベントを受け取る設定はリソース負荷が高いと説明されている。[1]

Focus Flowでは、任意のアプリ監視ではなく、ユーザーが明示的に選んだパッケージのウィンドウ状態変化だけを判定対象にする。必須Todoまたは必須習慣が未完了のとき、対象アプリが前面化したことを検出したら、Focus Flowの制限画面を表示して元のアプリへ戻す。これはOSレベルでアプリをアンインストール不可にしたり、端末全体をロックしたりする機能ではない。初回利用時には、アプリ内の説明画面からAndroid設定のアクセシビリティ有効化へ遷移し、ユーザー自身の操作で有効にする。

## ホーム画面ウィジェット

Android公式ドキュメントでは、アプリウィジェットはホーム画面上で重要な情報と頻繁な操作を一目で提供する小型ビューであり、ユーザーは移動や、対応ランチャーではサイズ変更を行えると説明されている。利用できるジェスチャーはタップと縦方向スワイプに限られるため、Focus Flowのウィジェットは「今日の完了率」「未完了の必須項目数」「集中制限の状態」を読み取り専用で表示し、タップ時にアプリの今日画面または設定画面を開く構成にする。[2]

## Expoプロジェクトへの組み込み

Expoの公式ドキュメントでは、ネイティブモジュールと設定プラグインを用いることで、生成されるAndroidプロジェクトのマニフェストやネイティブコードを拡張できる。設定プラグインはネイティブプロジェクトの生成時に実行され、マニフェスト変更やネイティブ資産の配置に利用できる。[3] Focus Flowでは、この仕組みでアクセシビリティサービス、制限画面アクティビティ、AppWidgetProvider、ウィジェット用リソースをAndroidビルドへ組み込む。

## 参照

[1] [Create an accessibility service — Android Developers](https://developer.android.com/guide/topics/ui/accessibility/service)

[2] [App widgets overview — Android Developers](https://developer.android.com/develop/ui/views/appwidgets/overview)

[3] [Create a module with a config plugin — Expo Documentation](https://docs.expo.dev/modules/config-plugin-and-native-module-tutorial/)

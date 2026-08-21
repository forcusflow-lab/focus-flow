# UX・ネイティブ実装の参照メモ

更新日: 2026-08-22（JST）

## 厳格モード

AppBlockの公開ヘルプでは、Strict Modeの解除を通常操作から切り離し、あらかじめ定めたアクセス方法または待機条件に依存させる設計が紹介されている。[1] Focus Flowでは、Androidのシステム設定・強制停止・アプリ削除を通常アプリが防止できない技術的境界を維持しつつ、**Focus Flow内の通常トグルでは解除不可**、**厳格モードを終了する意思を明確に確認する専用導線**、**遮断画面では設定逃避につながるアプリ情報導線を表示しない**構成とする。

## 統合ウィジェット

Android公式の`RemoteViews`は別プロセスで表示するレイアウトを記述する仕組みで、使用できるレイアウト・ウィジェットに制限がある。一方、固定数の行は`RemoteViews`の子ビューとして構成でき、各行に`PendingIntent`を設定できる。[2] Focus Flowの統合ウィジェットは、**必須・通常を明記したTodo／習慣の最大4行**、**行ごとの完了操作**、**透明度・背景・アクセント・文字サイズ**を一つの提供元に集約する。時間管理中の項目は誤完了を防ぐため、ウィジェットから完了操作を無効化する。

## 参照

[1] [AppBlock: I’m blocked by Strict Mode. How can I turn it off?](https://appblock.app/blocked-by-strict-mode-extension/)

[2] [Android Developers: RemoteViews API reference](https://developer.android.com/reference/android/widget/RemoteViews)

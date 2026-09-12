# Focus Flow 機能仕様書 (SPEC.md)

**バージョン:** 1.2.0 (Todo・習慣ロジック最適化＆UI/UX刷新版)  
**更新日:** 2026年9月9日  
**対象プラットフォーム:** Android (主対象) / iOS・Web (補助対応)

---

## 1. アプリ概要

**Focus Flow** は、Todo・習慣（Habit）・メモ・集中制限（Focus Gate）・Androidホーム画面ウィジェットを一体で統合した、日本語優先のモバイル生産性・集中支援アプリケーションです。

「**今日の自分との約束（必須Todo・必須習慣）を果たすまで、指定した誘惑アプリへのアクセスを制限する**」を行動設計の中核とし、オフライン・完全ローカルファーストで動作します。

---

## 2. コア機能仕様

### 2.1. Todo機能仕様
* **単発完了タスク特化:**
  * Todo機能は単発完了型タスクに特化（繰り返しルールやルーティン管理は習慣機能へ完全集約）。一度のチェックで達成・完了を記録。
* **タスク作成・編集:**
  * タイトル、詳細メモ、期限日（カレンダー選択）、優先度（高・中・低）、アプリ制限（必須 / 通常）、実行時間帯（常時 / 指定時間帯）の設定。
  * CTAボタン文言は「**Todoを作成**」（編集時は「変更を保存」）に統一。
* **解除判定ロジック（案2採用）:**
  * **アプリ制限の解除対象条件:** 【重要度が「必須」(`isRequired: true`)】かつ【期限が「今日まで（期限切れ含む）」または「期限なしで今日作成」】。
  * **通常タスクの独立性:** 重要度が「通常/任意」のタスクは、期限切れになっても集中制限のブロッカー（必須）には昇格せず、リスト上での警告表示（赤色テキスト等）に留まる。
* **メモ有無アイコン表示:**
  * タスクにメモが入力されている場合、カード上に `📝` ノートアイコンを表示。詳細を開く前にメモの存在を一目で把握可能。
* **インタラクション制御 & サブタスク展開アコーディオン:**
  * **サブタスク保持タスクのタップ挙動:**
    * チェックボックス以外の本文領域をタップした際、画面遷移せずその場でサブタスク一覧をアコーディオン展開/折りたたみ。
    * スムーズなレイアウトアニメーション（`LayoutAnimation`）および Chevron アイコンの 180度回転アニメーションを適用。
  * **詳細画面への遷移ルール:**
    * サブタスクが存在しないタスク: カード本文タップで従来どおり即座に詳細・編集画面へ遷移。
    * サブタスクを保持するタスク: 展開時に表示される詳細アイコン（`edit`）のタップ、またはカードの長押し（`Long Press` 350ms）で詳細・編集画面を開く。
  * **誤操作防止とタッチ領域:**
    * チェックボックス判定領域は **最小 48x48dp**（`hitSlop` 拡張付き）を確保し、完了操作と展開・詳細操作の誤タップを完全に防止。
* **サブタスク機能 & 親タスク自動完了連動:**
  * タスクごとに任意の件数のサブタスクを追加・編集・削除可能。
  * カード上で階層インデント表示され、個別のチェックボックスから即座に完了/未完了を切り替え（触覚フィードバック連動）。
  * **自動連動ロジック:** 最後の未完了サブタスクを完了して「全サブタスクが完了」した際、親Todoも自動的に完了状態へ移行（チェックマーク付与・完了日時記録）。
  * 逆に完了済みTodoのサブタスクのチェックを解除した場合、親Todoも自動的に未完了状態へ復帰。

### 2.2. 習慣（Habit）機能仕様
* **習慣作成・編集:**
  * 習慣名、頻度・実行曜日、達成基準タイプ、目標値、アプリの制限（必須 / 通常）、テーマカラー。
  * CTAボタン文言は「**習慣を作成**」（編集時は「変更を保存」）に統一（「作る」表記の廃止）。
* **頻度設定（曜日指定トグル & プリセット）:**
  * 実行する曜日を直感的に選択できる円形トグルボタン（月・火・水・木・金・土・日）を配置。
  * 上部にクイック選択チップを用意：
    * **毎日（デフォルト）:** 月〜日の全7日を選択。
    * **平日のみ:** 月〜金の5日を選択。
    * **週末のみ:** 土・日の2日を選択。
  * **曜日連動判定:** 該当曜日に設定されていない習慣は、当日の「今日の予定」画面および集中制限（Gate）の判定対象から自動的に除外。
* **達成基準タイプ & 時間目標UI:**
  1. **完了チェック（Check）:** 1日1回の達成をワンタップで記録。
  2. **回数管理（Count）:** 「今日 %1$d/%2$d 回」のように1日の目標回数を設定し、カード内の `+` / `-` ボタンから直接インクリメント/デクリメント（触覚フィードバック連動）。目標回数到達で達成。
  3. **時間管理（Timer）:** 
     * **目標時間UI刷新:** 入力欄に「**10分**」「**15分**」「**30分**」「**60分**」「**カスタム（手動入力）**」のクイック選択チップを導入。
     * 開始・一時停止ボタンによるリアルタイム計測（Chronometer）と、バックグラウンド復帰時の経過時間自動計算。目標時間到達で達成。
* **カラー選択の整理:**
  * 新規作成時はデフォルトカラーを自動選択。
  * カラーパレットは「詳細設定（テーマカラー）」アコーディオン内に集約し、初期表示の視覚的ノイズを低減。
* **継続日数（ストリーク）カウント:**
  * 過去の達成履歴から、連続達成日数（例: `3日連続`）を自動算出してバッジ表示。
  * `flexShrink: 0` と親の折り返し（Wrap）により、端末のフォントサイズを大にしても「0日連」のような末尾文字切れが絶対に発生しない堅牢なレイアウト。
  * 曜日ドット（月〜日）による直近1週間の達成状況グラフィカル表示。

### 2.3. ホーム画面ウィジェット仕様 (Android App Widget)
* **表示対象 & 件数ルール:**
  * ウィジェットサイズ（縦幅・横幅）に応じたレスポンシブな行数バケット（1行〜最大5行）を自動適用。
  * 上部に固定ヘッダー（日付、Today導線、タスク追加ボタン `+`）、下部にTodoおよび習慣の優先度順アイテム行を配置。
  * ウィジェット専用の「完了済みを表示」トグルにより、アプリを開かずウィジェット内だけで完了済みアイテムの表示/非表示を切り替え可能。
* **透過率調整（二層独立コントロール）:**
  * **背景透過率（0%〜100%）:** ウィジェット全体の枠組み・ヘッダーの透過度。
  * **カード/行透過率（0%〜100%）:** Todo・習慣のアイテム行個別の透過度。
  * 設定画面のスライダーにより1%単位で滑らかにプレビュー・調整可能。
* **インタラクティブ直接操作:**
  * Todoのチェック完了 / 復元。
  * 習慣の回数 `+` / `-` 操作（本文タップと混線しない独立タッチターゲット）。
  * 習慣タイマーの開始 / 一時停止。
* **タップ起動 (Deep Link):**
  * アイテム本文タップで該当Todo/習慣の詳細・編集画面へ直接遷移（`manusfocusflow:///todos?open=<id>` / `manusfocusflow:///habits?open=<id>`）。

### 2.4. アプリ制限ロジック (Focus Gate)
* **制限判定フロー:**
  1. ユーザーが指定した制限対象アプリ（パッケージ名）が前面（フォアグラウンド）に起動したことを `AccessibilityService`（`FocusGateService`）が検知。
  2. 「現在の時刻が有効な実行時間帯内か」「未完了の必須Todoまたは必須習慣が存在するか」を即時評価。
  3. 未完了項目が存在する場合、入力を遮断する `TYPE_ACCESSIBILITY_OVERLAY` を前面にオーバーレイ描画し、アプリの利用をブロック。
  4. 遮断画面上から「今日の項目を確認する」（Focus Flowへの復帰）または「アプリ情報」への安全な導線を提供。
* **厳格モード (Strict Mode):**
  * 有効化時、必須項目が完了するまでアプリ内から集中制限を無効化できない保護機能。
* **耐障害性 & 省電力対策:**
  * イベント・ノード取得（`rootInActiveWindow`, `event.source`）の即時解放（`recycle()`）によりメモリリークとサービス切断を防止。
  * バッテリー最適化無効化（`REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`）の要求導線により、OSによるバックグラウンドキルを防止。

---

## 3. UXライティング規約 & 文言集約仕様

開発者目線の説明調や直訳風の表現を廃止し、市販アプリ水準のユーザー中心の文言へ統一。すべてのUI文字列は `res/values/strings.xml` および `lib/focus-flow/strings.ts` に集約・管理します。

| 画面 / コンポーネント | 項目 | 統一文言（日本語） | 統一文言（英語） |
|---|---|---|---|
| **今日画面** | 状態バナー（終日制限中） | `アプリ制限中（残り %d 件）` | `App limits active (%d remaining)` |
| | 状態バナー（時間帯制限中） | `時間帯制限中（%s〜%s）` | `Scheduled limit active (%s–%s)` |
| | 状態バナー（解除中） | `すべての制限を解除中` | `All app limits unlocked` |
| | 状態バナー（オフ） | `集中制限はオフです` | `App limits are off` |
| | 状態バナー説明 | `今日の必須タスクを完了すると制限が解除されます` | `Limits unlock when all must-dos for today are complete.` |
| | 進捗見出し | `進捗` | `Progress` |
| | リスト見出し（終日タスク） | `今日のタスク` | `Today’s tasks` |
| | リスト見出し（指定時間帯タスク） | `指定時間帯のタスク` | `Scheduled tasks` |
| **遮断オーバーレイ** | ヘッダータイトル | `集中タイムです` | `Focus time` |
| | 解除案内（終日） | `今日のタスクを達成すると制限が解除されます` | `Complete today's tasks to unlock.` |
| | 解除案内（時間帯） | `この時間帯（%s〜%s）の対象タスクを完了すると解除されます` | `Complete the tasks for this time window (%s–%s) to unlock.` |
| **制限タイミング** | セクション見出し | `制限するタイミング` | `When to limit` |
| | 終日 | `終日`（今日の達成までアプリを制限） | `All day` (Limit apps until completed today) |
| | 指定の時間帯 | `指定の時間帯`（設定した時間帯の間だけブロック） | `Specific time window` (Block only during selected time windows) |
| | 時間帯追加 | `+ 新しい時間帯を作成` | `+ Create new time window` |
| **ウィジェット** | ヘッダー大見出し | `今日の目標` | `TODAY'S GOALS` |
| | ヘッダー状態（終日） | `残り %d 件` | `%d remaining` |
| | ヘッダー状態（時間帯） | `制限中（%s〜%s）` | `Limited (%s–%s)` |
| | ヘッダー状態（解除中） | `制限解除中` | `Limits unlocked` |
| | ヘッダー状態（オフ） | `集中制限はオフです` | `App limits off` |
| | アイテムバッジ（右上固定） | `必須` または `06:00〜09:00` | `MUST` or `06:00–09:00` |
| **習慣画面** | 習慣カード回数表記 | `今日 %1$d/%2$d 回` | `Today %1$d/%2$d times` |
| | 習慣カードストリーク | `%d日連続` | `%d-day streak` |
| **設定画面** | セクション見出し | `3. 時間帯制限の設定` | `3. Time window limit settings` |
| | 一覧導線タイトル | `集中制限と時間帯制限` | `Focus limits & time windows` |
| | ステップ案内 | `1. 権限許可 → 2. アプリ選択 → 3. 時間帯設定。時間帯を選ばない場合はいつでも有効です。` | `1. Permission → 2. Choose apps → 3. Time windows. Without a window, limits apply anytime.` |
| | スイッチ名 | `タスク完了までアプリを制限` | `Limit apps until tasks are done` |
| | 厳格モード説明 | `制限中の設定変更やアプリ削除を防止し、うっかり解除を防ぎます。` | `Prevents changing settings or deleting apps while limits are active.` |

---

## 4. プラン & 課金仕様（マネタイズ・ロードマップ）

| 機能・項目 | 無料プラン (Free) | Focus Flow Plus (有料プラン) |
|---|---|---|
| **Todo登録件数** | 最大 2件 | **無制限** |
| **習慣登録件数** | 最大 2件 | **無制限** |
| **メモ登録件数** | 最大 2件 | **無制限** |
| **制限対象アプリ数** | 最大 5アプリ | **無制限** |
| **外観・テーマ設定** | プリセット選択可能 | プリセット選択可能 |
| **名前付きテーマセット保存** | 不可 | **無制限に保存・切替可能** |
| **ウィジェット機能** | 全機能利用可能（透過調整含む） | 全機能利用可能 |
| **早期完了商品 (IAP)** | 都度購入可能 (消費型) | 都度購入可能 (消費型) |

---

## 5. セキュリティ & プライバシー方針

1. **完全ローカル保存:** タスク名、メモ、習慣、制限アプリ一覧などのユーザーデータはすべて端末内のローカルストレージ（AsyncStorage / SharedPreferences）に安全に保持され、外部サーバーへ無断送信されません。
2. **アクセシビリティサービスの目的外利用の禁止:** 画面内容、入力テキスト、通知内容の読み取りは一切行わず、ユーザーが明示的に設定したアプリの前面化検知のみに権限を使用します。

---

## 6. Material 3 操作面 & スクロール耐性仕様 (v26)

### 6.1 回数カウンターのモダン化（アプリ本体＆ウィジェット完全統一）
- **コンテナデザイン:** 平坦なグレー枠線を廃止し、淡いコンテナカラー（`surfaceVariant` / `elevated`）を背景に適用した角丸カプセル形状（`borderRadius: 999` / `focus_flow_widget_pill_container.xml`）に刷新。
- **テキストコントラスト:** 現在値を太字（`FontWeight.BOLD` / `Typeface.BOLD`）かつ高コントラスト色、目標値を控えめなミュート色（`mutedColor`）で表示し、視認性を向上。
- **タップ操作性:** ±ボタンはマージン・ヒットスロップを拡張し、48x48dp以上の有効タッチ領域を確保。軽快な触覚フィードバック（`safeHaptic("light")`）を伴う。

### 6.2 タイマー操作ボタンの統一と視認性保証
- **ボタンデザイン:** テーマのPrimary塗りつぶしピルボタン（`borderRadius: 999`）に白文字・白アイコン（`#FFFFFF`）を適用。
- **背景透過対応:** ウィジェットが二層透過設定下にあっても、半透明背景に同化・退色せず、高いコントラストと視認性を維持。
- **統一ラベル:** 状態に応じて「▶ 開始」「❚❚ 一時停止」「▶ 再開」（英語: `▶ Start` / `❚❚ Pause` / `▶ Resume`）を表示。ウィジェットからのPendingIntentも確実に連動。

### 6.3 詳細編集画面のスクロールフリーズ防止
- **仮想化クリップ競合の排除:** `task-form.tsx` および `habit-form.tsx` のScrollViewからAndroid特有のフリーズ原因となっていた `removeClippedSubviews` を撤廃。
- **キーボード回避の適正化:** Androidにおける `KeyboardAvoidingView` の `behavior="height"` によるレイアウト圧縮・タッチ不可問題を解消（`behavior={Platform.OS === "ios" ? "padding" : undefined}`）。
- **必須トグル連動スクロール:** 「必須」トグルをONにして解除制限時間帯セクションが下部に展開された際、`requestAnimationFrame` を介してスムーズに最下部へ追従スクロール（`scrollToEnd({ animated: true })`）。
- **ネイティブ保存処理の非同期退避:** `FocusGateModule.kt` の `saveGateState` におけるSharedPreferences書き込みおよびウィジェット全体更新（`refreshAll`）を `Executors.newSingleThreadExecutor` でバックグラウンド実行し、UI/JSスレッドのブロッキングを完全防止。

---

## 7. 制限タイミングの概念統一・タイマートーン調和・TimePicker連携仕様 (v27)

### 7.1 タイマー操作ボタンのトーン調和（本体＆ウィジェット）
- **通常・待機時の淡いトーン:** 回数カウンターと視覚的ウェイトを揃えるため、待機・一時停止中のタイマーボタン背景には淡いコンテナカラー（`palette.elevated` / `focus_flow_widget_pill_container.xml`）を適用し、テキストおよび再生/再開アイコンにPrimaryカラーを適用。
- **計測中（アクティブ時）のPrimary反転:** タイマー実行中（`timer.running == true`）のみ、背景をPrimary塗りつぶし、テキストおよび一時停止アイコンを白色（`#FFFFFF`）へ反転させ、動作中であることを直感的に伝達。
- **形状・寸法の完全共通化:** 高さ36dp（タッチターゲット38dp）、ピル形状（`borderRadius: 999`）、統一フォントサイズ（13sp）で回数カウンターと同一のリズム・グリッドを形成。

### 7.2 タイミング概念の統一とインライン作成
- **「終日」と「指定の時間帯」の二元論:** タスクおよび習慣の制限設定における二者択一を、`mode: "always"` = 「終日（今日の達成までアプリを制限）」、`mode: "scheduled"` = 「指定の時間帯（設定した時間帯（朝・夜など）の間だけブロック）」として明確に言語化・UI統一。
- **インライン時間帯作成モーダル:** 編集画面（`task-form.tsx` / `habit-form.tsx`）から画面遷移することなく、その場で新しい制限時間帯を作成・登録できる `+ 新しい時間帯を作成` インラインモーダルダイアログを搭載。

### 7.3 画面横断・遮断オーバーレイ・ウィジェットの概念＆文言統一
- **今日画面:** 
  - バナー表示: 終日制限中は `アプリ制限中（残り %d 件）`、時間帯制限中は `時間帯制限中（%s〜%s）`、全完了時は `すべての制限を解除中`。
  - タスク見出し: 終日タスクを `今日のタスク`、時間帯タスクを `指定時間帯のタスク` として明確にグループ分け。
- **遮断オーバーレイ (`FocusGateService` / `FocusGateActivity`):**
  - ヘッダー文言を「集中タイムです」（`Focus time`）に統一。
  - 解除案内メッセージを終日（「今日のタスクを達成すると制限が解除されます」）と時間帯（「この時間帯（%s〜%s）の対象タスクを完了すると解除されます」）で動的切り替え。
  - 残りタスク一覧パネル（最大3件 + 残件数表示）を遮断画面内に配置し、ユーザーがアプリを開けなくても何を完了すべきか瞬時に把握可能に。
- **ホーム画面ウィジェット (`FocusFlowWidgetProvider`):**
  - ヘッダー状態表示: `残り %d 件` / `制限中（%s〜%s）` / `制限解除中` に統一。
  - アイテムバッジ表示: 終日タスクには「終日」、時間帯タスクには「06:00〜09:00」等の時刻範囲バッジをコンパクトに表示。

### 7.4 設定画面のTimePicker連携と15分刻みステッパー
- **ネイティブTimePickerDialogブリッジ:** `FocusGateModule.kt` に `@ReactMethod fun openTimePicker` を実装し、Android標準の時計ピッカーを直接呼び出し。
- **時刻タップ操作:** 設定画面の開始/終了時刻テキストをタップすることで、直感的にTimePickerを開いて任意の時刻を設定可能。
- **15分単位のクイックステッパー:** `[-]` `[+]` ボタンの増減単位を従来の1分/5分から実用的な「15分単位」に変更し、素早い時間枠調整を実現。

### 7.5 文字列リソースの集約
- 全UIコンポーネント・ネイティブサービス・ウィジェットで表示される文言を `res/values/strings.xml`（Androidネイティブ）および `lib/focus-flow/strings.ts`（React Native）に完全同期集約。

---

## 8. 今日画面の統合ダッシュボードカード & フラット見出し仕様 (v28)

### 8.1 タイトルおよび見出しの文言整理 & 階層明確化
- **画面大見出し（動的日付）:**
  - `今日`（サブヘッダー）および `今日の予定`（大見出し）の固定重複表記を廃止。
  - 大見出しを現在の動的な日付表記（例: `9月9日 (水)` / 英語: `Wed, Sep 9`、フォントサイズ: 22sp, 太字: 900）に改修。
- **進捗ダッシュボードカード内（進捗ラベル）:**
  - 旧 `本日のタスク` ラベルを `進捗`（英語: `Progress`、`today_progress_label`）へ刷新。
  - 右側の `0 / 2 完了` カウント表示および全幅プログレスバーの組み合わせを維持。
- **リスト見出し（今日のタスク）:**
  - リスト見出しは `今日のタスク`（英語: `Today’s tasks`）を維持。
  - **明確な視覚的階層の確立:** `日付（22sp, 900）` ＞ `リスト見出し: 今日のタスク（16sp, 800）` ＞ `カード内: 進捗（14sp, 800）` の構造により、同一画面内での「今日/本日」の過剰重複を完全解消。

### 8.2 ヘッダー情報の統合（2枚のカードを1枚に集約）
- **単一コンテナ化:** 旧来の「アプリ制限中バナー」と「本日の進捗カード」の2枚分割・重複表示を解消し、1枚の洗練されたダッシュボードカード（`dashboardCard`）に統合。
- **カード上部（制限状態 & 設定遷移）:**
  - ロックアイコンと現在の制限状態（`🔒 アプリ制限中` / `🔓 すべての制限を解除中` / `時間帯制限中（%s〜%s）` / `集中制限はオフです`）をすっきり配置。
  - 右端に設定画面への遷移を示す `設定 >` 導線を配置（タップで `/(tabs)/settings` へシームレスに遷移）。
- **カード中央（シンプル進捗 & プログレスバー）:**
  - 左に `進捗`（`today_progress_label`）、右に `X / Y 完了`（視認性の高い強調数字）をベースライン揃えで配置。
  - 下部にカード全幅のモダンなプログレスバー（高さ6dpの角丸ピル形状）を配置。
- **カード下部（内訳行）:**
  - ヘアライン区切り線の下に、`☑ Todo X件` と `⟳ 習慣 Y件` を中央ドット区切りで水平にスマートに整列。
  - 重複していた「残り○件」表記を整理し、画面上部の専有面積を大幅に削減。

### 8.3 フラット見出しとファーストビュー最適化
- **見出しのフラット化:** 「今日のタスク」セクションの背景色・枠線付きコンテナボックスを撤廃し、シンプルなテキスト見出し（`sectionHeaderFlat` / `sectionTitleFlat`）へ変更。
- **冗長な補足文撤廃とマージン圧縮:** 不要な注釈テキストを削除し、上下マージンを詰めることで、アプリ起動直後のファーストビュー内にタスクカードが即座に見える快適な情報設計を実現。

### 8.4 リソース集約
- `today_date_format`（`%1$d月%2$d日 (%3$s)` / `%3$s, %1$s %2$d`）および `today_progress_label`（`進捗` / `Progress`）を `res/values/strings.xml` および `lib/focus-flow/strings.ts` に集約・管理。

---

## 9. ウィジェット パターンA（右端固定バッジ & 2行目右側コントロール）およびUXライティング完全統一仕様 (v30)

### 9.1 全画面のUXライティング＆概念統一
- **終日枠の統一:**
  - 過去の「常時」「いつでも」「ノルマ」等の表記バラつきを完全撤廃。
  - 設定の選択肢は「**終日**」（補足: 「今日の達成までアプリを制限」）、目標管理の文脈は「**今日の目標**」（ウィジェット英語: `TODAY'S GOALS`）に統一。
- **時間帯枠の統一:**
  - 「特定の時間」「時間帯」等の表記を「**指定の時間帯**」（設定項目・タイミング選択）および「**時間帯制限**」（ステータスバナー・セクション見出し「3. 時間帯制限の設定」）に完全統一。
- **今日画面:**
  - 動的日付ヘッダー（例: `9月9日 (水)`）と1枚に統合されたダッシュボードカード。
  - バナー状態表示: `集中制限はオフです` / `アプリ制限中（残り %d 件）` / `時間帯制限中（%s〜%s）` / `すべての制限を解除中`。
  - カード内見出し: `進捗`（`today_progress_label`）。
  - リスト見出し: `今日のタスク`（フラットテキスト）。
- **タスク・習慣作成・編集フォーム:**
  - タイミング選択セクション: `制限するタイミング`
  - 選択肢1: `終日`（説明: `今日の達成までアプリを制限`）
  - 選択肢2: `指定の時間帯`（説明: `設定した時間帯（朝・夜など）の間だけブロック`）
  - インライン作成導線: `+ 新しい時間帯を作成`
- **遮断オーバーレイ:**
  - ヘッダー: `集中タイムです`（`Focus time`）
  - 終日条件: `今日のタスクを達成すると制限が解除されます`
  - 時間帯条件: `この時間帯（%s〜%s）の対象タスクを完了すると解除されます`

### 9.2 ホーム画面ウィジェット パターンA配置（右上固定バッジ & 2行目右側コントロール）
- **パターンA レイアウト構造:**
  - **1行目右端固定バッジ（Row 1 Right）:**
    - タイトル行インラインでのバッジ配置（パターンB）を廃止し、アイテム枠の右上端に独立したバッジコンテナ（`focus_flow_widget_item_badge_container`）を配置。
    - `layout_gravity="top|end"`, `layout_width="wrap_content"`, `layout_height="18dp"`, `layout_marginTop="3dp"`, `layout_marginEnd="6dp"`, `minWidth="32dp"`。
    - バッジ文字（`必須` / `06:00〜09:00`）は `singleLine="true"`、`ellipsize="none"`、`paddingStart="5dp"`, `paddingEnd="5dp"` により、「...」などの省略欠損なく確実に1行で全文表示。
  - **タイトル行（Row 1 Left〜Center）:**
    - コンテンツコンテナに `layout_marginStart="50dp"`, `layout_marginEnd="88dp"` を設定。
    - タイトルテキスト（`focus_flow_widget_item_title`）は `layout_width="match_parent"` を確保し、右側のバッジや操作コントロールと物理的に絶対に衝突・重なり合わない安全設計。
  - **2行目右側操作コントロール（Row 2 Right）:**
    - 習慣カウンター（`[- 1/5 +]`）および習慣タイマー（`▶ 開始` / `❚❚ 一時停止`）を、右上の必須バッジの直下となる2行目右端に配置。
    - `layout_gravity="bottom|end"`, `layout_width="82dp"`, `layout_height="22dp"`, `layout_marginBottom="3dp"`, `layout_marginEnd="6dp"`。
    - 右上のバッジ領域と縦のグリッドラインが完璧に揃い、視覚的に極めて整然としたUIを実現。
- **タイマー操作ボタンのトーン調和:**
  - ウィジェット待機中のタイマーボタンに角丸カプセルコンテナ（`@drawable/focus_flow_widget_pill_container`）を適用。
  - 左右対称パディング（`paddingStart="4dp"`, `paddingEnd="4dp"`）、中央揃え（`gravity="center"`, `textAlignment="center"`）により、テキスト「▶ 開始」が中央にバランス良く配置され、回数カウンターと同一の視覚的トーン・ウェイトを実現。

---

## 10. Todo・習慣のカラー決定ロジック & 色選択UI統一 & カード情報スリム化 & トップ3画面ダッシュボード完全統一 (v31)

### 10.1 Material 3トーンのカラーパレット統一と決定ロジック
- **Material 3トーンのパレット刷新:**
  - `HABIT_COLORS`: 原色・高彩度を抑えた落ち着いたM3トーンに刷新。
    - ミントグリーン: `#388E77`
    - ソフトブルー: `#3D6E9B`
    - ウォームアンバー: `#BA7238`
    - ダスティパープル: `#7E5E94`
    - ディープローズ: `#A65E68`
  - 優先度（Priority）カラーのM3調和:
    - 高（High）: `#C05746`（深みのあるテラコッタレッド）
    - 中（Medium）: `#BA7238`（ウォームアンバー）
    - 低（Low）: `#3D6E9B`（ソフトブルー）
- **左端インジケーターバー（Accent Color）の決定ロジック (`getTodoAccentColor`):**
  - Todoに個別カラー（`todo.color`）が指定されている場合はそれを最優先で採用。
  - 未指定時は従来の優先度カラー（High: `#C05746`, Medium: `#BA7238`, Low: `#3D6E9B`）にフォールバック。
  - 習慣は個別選択されたテーマカラー（`habit.color`）を採用。
  - ホーム画面ウィジェット連携（`android-gate.ts`）においても、`item.accentColor` に上記ロジックを同期。

### 10.2 カラー選択UIおよびUIガイドの統一
- **タスク作成・編集フォーム（`TaskForm`）:**
  - 習慣フォームと同様のテーマカラー選択アコーディオン（`テーマカラー`）を新設。
  - 選択ボタンは34dp角丸円形、白チェックアイコン（16dp）で選択状態を表示。
  - UIガイドテキスト: `カード左端の識別カラーとして表示されます`（未選択時は優先度カラーが適用される旨を担保）。
- **習慣作成・編集フォーム（`HabitForm`）:**
  - カラー選択セクションの見出し直下にUIガイドテキスト `カード左端の識別カラーとして表示されます` を追加。
  - `TaskForm` と完全に同一のサイズ感（34dp）、アイコン表示、アニメーションで統一。

### 10.3 カード内情報密度のスリム化（一覧性の向上）
- **必須バッジ（`RequiredLabel`）のマイクロインジケーター化:**
  - 従来の主張の強いベタ塗り・厚みのあるバッジから、極めて控えめな軽量フェザー級インジケーター（高さ16dp、背景 `${color}14`、フォント9.5sp、4dpカラードット）へと刷新。
  - スクリーンリーダー対応およびアクセシビリティ要件（44dpタッチターゲット基準）を維持。
- **習慣カード（`HabitItemCard`）の折りたたみ時情報削減:**
  - 折りたたみ（閉じた状態）時は「タイトル」と「当日の達成状況ピル（例: `0/1 完了` または `0/10 分`）」のみの最小構成に集約。
  - 週の達成状況（`週 0/7`）および継続日数（`0日連続`）は、カードタップで展開される詳細領域（`expandedStatsRow`）内に移動し、日常的な一覧性を大幅に改善。

### 10.4 トップ3画面（今日・Todo・習慣）ダッシュボードデザインの完全統一
- **ダッシュボード/サマリーカードの統一仕様:**
  - 今日画面（`app/(tabs)/index.tsx`）、Todo画面（`app/(tabs)/todos.tsx`）、習慣画面（`app/(tabs)/habits.tsx`）の画面上部サマリーカードを共通のトーン・マナーに統一。
  - 背景色: `palette.elevated`
  - 枠線: `palette.border`（幅1px）
  - 角丸: `borderRadius: 18`
  - 内側パディング: `paddingHorizontal: 14`, `paddingVertical: 11`
  - プログレスバー: 高さ `6dp`、トラック `palette.surface`、角丸 `999`（完全カプセル）

---

## 11. 「必須」テキストバッジの完全撤去 & 極小ロックアイコン化 & ウィジェット習慣サブテキストスリム化 (v32)

### 11.1 「必須」テキストバッジの完全撤去 ＆ 極小ロックアイコン化（本体＆ウィジェット共通）
- **テキストバッジ・背景ピルの完全廃止:**
  - アプリ全体（今日画面、Todo一覧、習慣一覧、ウィジェット）のカード内から「必須」「・必須」「MUST」のテキスト表記およびカプセル枠（背景ピル）を完全撤去。
  - 重要度・識別は左端のカラーバー（Accent Color）に集約。
- **極小ロックアイコン（🔒）の導入:**
  - **React Native本体 (`item-cards.tsx`):**
    - アプリ制限の対象（必須アイテム）である場合のみ、タイトルの直後に14dpの極小ロックアイコン（`MaterialIcons name="lock" size={14}`）を1つ配置。
    - カラーは主張しすぎない控えめな色（`palette.muted`、M3の `onSurfaceVariant` / `outline` 相当）を適用。
    - アクセシビリティ（スクリーンリーダー読み上げ `accessibilityLabel="必須"` / `accessibilityRole="image"`）を維持。
  - **ホーム画面ウィジェット (`FocusFlowWidgetProvider.kt`):**
    - `compactBadge` における必須タグ（`MUST` / `必須`）の返却を廃止（時間帯制限 `windowLabel` のみバッジ表示）。
    - 必須アイテムである場合、タイトルの直後に ` 🔒` を付与して表示（例: `$title 🔒`）。

### 11.2 カードごとの自然なレイアウト整理（本体）
- **Todoカード (`TodoItemCard`):**
  - 1行目にタイトル＋🔒アイコン（必須時のみ）を主役として配置。
  - 期限・メモ・サブタスクが存在する場合のみ、下部にスマートにメタ情報行を表示。
- **習慣カード (`HabitItemCard`):**
  - 1行目にタイトル＋🔒アイコン（必須時のみ）＋展開Chevron（▼/▲）を配置。
  - サブ行には本日の実績（例: `今日 0/5回`、`今日 00:00 / 15:00`）のみを表示。
  - 折りたたみ時は長期統計（週・ストリーク）を完全に隠し、タップ展開時のみ詳細領域（`expandedStatsRow`）に表示。

### 11.3 ウィジェットの情報スリム化（本体と完全同期）
- **長期統計テキストの排除:**
  - `lib/focus-flow/android-gate.ts` の `habitWidgetMeta` から `週 0/7 · 0日連続` などの長期統計を削除。
- **当日の進捗への特化:**
  - 回数習慣: `0/5回`（英語: `0/5`）のみを表示。
  - タイマー習慣: `00:00 / 15:00`（計測中は `計測中 00:00 / 15:00`、一時停止時は `一時停止 00:00 / 15:00`）のみを表示。
  - チェック習慣: サブテキストを省略（完了時のみ「完了」）。
  - 右端のカウンター（`[-] 0/5 [+]`）およびタイマーボタンとのテキスト衝突・窮屈感を解消。

### 11.4 デザイン確認用Roborazziスクショ自動更新タスク & ダミーデータ検証
- **`android/app/build.gradle`:**
  - `recordRoborazziDebug` タスクを Gradle に登録。
- **自動単体・契約テスト (`tests/focus-flow-v32-lock-icon-and-widget-slimming.test.ts`):**
  - ダミーデータ（Todo、回数習慣、タイマー習慣）を用いた今日画面およびウィジェットのレンダリングデータ整合性を網羅的に検証。

---

## 12. ホーム画面ウィジェット レイアウト再調整（余白解消・文字切れ防止・上下センタリング）(v33)

### 12.1 下部の過剰な空白の解消 ＆ 表示件数最適化
- **WidgetBucket階層の拡充 (1〜5行):**
  - `WidgetBucket` に4行表示（`WidgetBucket(4, true, false)`）を追加し、1行から5行までの全スロットを細かくサポート。
  - 高さ閾値の数学的再設計:
    - `height < 149f`: 1行バケット (`WidgetBucket(1, false, true)`)
    - `height < 198f`: 2行バケット (`WidgetBucket(2, true, false)`)
    - `height < 247f`: 3行バケット (`WidgetBucket(3, true, false)`)
    - `height < 296f`: 4行バケット (`WidgetBucket(4, true, false)`)
    - `else`: 5行バケット (`WidgetBucket(5, true, false)`)
  - 247dp〜295dpの中小ウィジェットサイズでも余白を残さず4件が収まり、296dp以上で5件フル表示。

### 12.2 ヘッダー文字切れの解消（動的パディング制御）
- **デフォルトXMLパディング最適化:**
  - ヘッダーテキスト領域（`LinearLayout`）に `android:id="@+id/focus_flow_widget_header_text"` を付与。
  - XML上のデフォルト `android:paddingEnd` を `160dp` から `48dp`（Todo追加ボタン分の最小余白）に削減。
- **Provider動的パディング制御:**
  - `bindHeader` において、完了トグル（`completedToggle`）が非表示（`completedCount == 0`）の場合は `48dp`、表示時のみ `120dp` のパディングを動的設定。
  - これにより、「集中制限はオフです」等のステータステキストが不必要に途中で省略（`…`）されることなく、フル幅で鮮明に表示される。

### 12.3 回数カウンターおよびタイマー操作領域の上下センタリング
- **垂直中央揃えへの変更:**
  - ウィジェット全行（row 1〜5）のコントロールコンテナ（`focus_flow_widget_static_row_*_controls`）の `android:layout_gravity` を `bottom|end` から `center_vertical|end` に統一。
  - 以前の下部寄せ用 `android:layout_marginBottom="3dp"` を撤去し、`android:layout_marginEnd="6dp"` を維持。
  - 回数習慣の `[-] 0/5 [+]` ピルおよびタイマー習慣の `00:00 / 15:00` ボタンが、行の高さに対して完全な上下中央に配置される。

### 12.4 ネイティブ・プラグインの完全同期 & 契約テスト
- **同期対象:**
  - `plugins/native/android/res/layout/focus_flow_widget_initial.xml` と `android/app/src/main/res/layout/focus_flow_widget_initial.xml`
  - `plugins/native/android/kotlin/FocusFlowWidgetProvider.kt` と `android/app/src/main/java/com/app/focusflow/focusflow/FocusFlowWidgetProvider.kt`
- **契約テスト (`tests/focus-flow-v33-widget-layout-and-centering.test.ts`):**
  - ヘッダーパディング最適化（48dp/120dp）
  - コントロール上下センタリング（`center_vertical|end`）
  - 1〜5行のWidgetBucket閾値
  - プラグインとAndroidネイティブ実装の完全一致

## 13. 端末再起動時データ永続化保証 & ウィジェットカウンター上下センタリング仕様

### 13.1 端末再起動時のデータ全消失バグの根本原因と恒久対策
- **現象と根本原因の特定:**
  - 端末再起動時、Room/SQLite等のDB初期化処理ではなく、アプリ起動時ライフサイクルにおけるJavaScriptと非同期ストレージの**レースコンディション**が主因。
  - `FocusFlowProvider` のマウント時、`AsyncStorage.getItem(STORAGE_KEY)` による非同期ロードの完了前（メモリ上の `data` が空配列の状態）に、`useEffect` 内の `PERSONAL_UNLIMITED_BUILD` 判定により `applyPlusStatus()` が呼ばれ、`commit()` が発火していた。
  - 従来の `commit()` では `isReady` 状態の判定を行わずに `persistData(next)` をキューイングしていたため、既存データがロードされる前にメモリ上の空配列（`todos: []`, `habits: []`）でストレージが不可逆的に上書きされていた。
  - さらに、ネイティブ層の `FocusGateModule` および `FocusFlowWidgetProvider` において `SharedPreferences.Editor.apply()`（メモリ書き込み先行の非同期ディスク同期）が使われており、端末再起動やプロセス急死時にディスクへのフラッシュが完了しないリスクが存在していた。
- **恒久対策（二重永続化 ＆ 起動レースコンディション防止）:**
  1. **`isReadyRef` ガードによる初期化前の書き込み完全遮断:**
     - `FocusFlowProvider` 内に `isReadyRef`（MutableRefObject）を導入。初期データロードが完全に完了するまで、いかなる `commit()` や `applyPlusStatus()` からの `persistData` 呼び出しも完全に無視・遮断。
  2. **ネイティブ即時ディスク同期（`commit()` 徹底）:**
     - `FocusGateModule.kt` および `FocusFlowWidgetProvider.kt` の全 `SharedPreferences` 保存処理を `.apply()` から `.commit()`（同期ディスク `fsync` 書き込み）に変更。
  3. **ネイティブバックアップ層（`saveAppDataBackup` / `getAppDataBackup`）の導入:**
     - `FocusGateModule` に `saveAppDataBackup(serialized)` および `getAppDataBackup()` を追加。
     - アプリデータ変更時には `AsyncStorage` だけでなくネイティブ側の同期 `commit()` 領域（`appDataBackup`）にも常時バックアップを書き込み。
     - アプリ起動時、万一 `AsyncStorage` が空または破損していた場合でも、ネイティブの `appDataBackup` から自動復元し、`AsyncStorage` へ再シードする自動復旧機構を確立。

### 13.2 ウィジェット回数カウンター（[-] 2/5 [+]）の上下センタリング
- **現状の課題:**
  - カウンターの数字や `−` `+` がカード上下中央よりわずかに下方に沈んで見えていた。
- **改善内容:**
  - `focus_flow_widget_initial.xml` の全行（row 1〜5）のカウンター内 `LinearLayout` に `android:layout_gravity="center"` を明示追加。
  - 減算ボタン（`decrement`）、数値表示（`progress`）、加算ボタン（`increment`）の各 TextView に `android:textAlignment="center"` および `android:includeFontPadding="false"` を追加。フォントパディングによるフォントベースラインの沈み込みを排除し、タイマーボタン（`▶ 開始`）のピルと完全に一致した上下中央整列を実現。

### 13.3 プラグインとAndroidネイティブ実装の完全同期 & 契約テスト
- **同期対象:**
  - `plugins/native/android/res/layout/focus_flow_widget_initial.xml` と `android/app/src/main/res/layout/focus_flow_widget_initial.xml`
  - `plugins/native/android/kotlin/FocusGateModule.kt` と `android/app/src/main/java/com/app/focusflow/focusflow/FocusGateModule.kt`
  - `plugins/native/android/kotlin/FocusFlowWidgetProvider.kt` と `android/app/src/main/java/com/app/focusflow/focusflow/FocusFlowWidgetProvider.kt`
- **契約テスト (`tests/focus-flow-v34-persistence-and-counter-centering.test.ts`):**
  - `isReadyRef` ガードおよび `getAppDataBackup` による自動復元
  - ネイティブ層の `.commit()` ディスク書き込みの徹底
  - カウンターの上下センタリング属性（`layout_gravity="center"`, `includeFontPadding="false"`, `textAlignment="center"`）
  - 全ネイティブファイルとプラグインコードの完全一致


## 14. ウィジェット透過率リアルタイム・ミニプレビュー (v35)

### 14.1 インラインプレビュー (`WidgetMiniPreview`)
- **配置:** 設定画面 > 表示・文字・Widget > ウィジェットセクション内、「本体のテーマを使用」行の直下・スライダーの直上に配置。
- **背景:** 壁紙を想起させるソフトな2色グラデーション球（`widgetPreviewGradA` / `widgetPreviewGradB`）を配置し、透け感を直感的に確認可能。ダーク/ライトモードで適切な色調に切り替え。
- **モック構成:**
  - ヘッダー行: 「今日の目標」+ 「終日」バッジ（`widget_title` 文言と同期）
  - Todo行: 左端カラーバー（`palette.primary`）+ チェック枠 + 「朝のストレッチ」+ 「終日」バッジ
  - 習慣行: 左端カラーバー（`#7AADCF`）+ チェック枠 + 「読書」+ 「1/3」カウンター
- **透過率の適用ルール:**
  - ヘッダー背景・ウィジェット外枠の背景色 → `backgroundOpacity`（0〜100）を `rgba()` の `alpha` として適用
  - 各アイテム行の背景色 → `cardOpacity`（0〜100）を `rgba()` の `alpha` として適用
  - テキスト・アイコンは常に不透明（100%）— 実ウィジェットと同じ設計思想
- **ヘルパー関数:**
  - `withAlpha(hex, alpha)`: 16進数カラーを `rgba()` 文字列に変換
  - `blendHex(base, blend, ratio)`: 2色をブレンドしてヘッダー背景色を生成（`FocusFlowWidgetProvider.kt` の `blendColors` と同等ロジック）

### 14.2 リアルタイム連動とパフォーマンス最適化
- **ローカルドラッグ状態:**
  - `WidgetsPanel` 内に `dragBgOpacity` / `dragCardOpacity`（`useState<number>`）を導入。
  - `OpacitySlider` に `onDrag` コールバックを追加し、ドラッグ中の値を `WidgetsPanel` のローカル状態に伝達。
  - プレビューは `previewBg = dragBgOpacity ?? bgValue`、`previewCard = dragCardOpacity ?? cardValue` を参照し、ドラッグ中はローカル値、静止時は永続値でレンダリング。
- **永続化のタイミング:**
  - ドラッグ中（`onPanResponderMove`）: `setDragValue` + `onDrag` でローカルUIのみ更新。Preference保存やウィジェット更新ブロードキャストは一切発生しない。
  - フィンガーリフト（`onPanResponderRelease`）: `onChange` を呼び出し、親コンポーネント経由で `setDisplaySettings` → `persistData` → AsyncStorage + ネイティブバックアップ → ウィジェット更新。
  - これにより60fps相当のドラッグ中でもIPC通信ゼロ、端末負荷ゼロを保証。

### 14.3 UIテキスト整理
- **冗長なヒントテキストの削除:**
  - `OpacitySlider` 末尾の「タップ・スライドとも1%単位で反映されます」を完全削除。スライダー下の余白をスッキリ整理。
  - 1%刻みの動作仕様自体は変更なし（`Math.round` による整数丸め + `0〜100` のクランプは維持）。

### 14.4 契約テスト
- **`tests/focus-flow-v35-widget-preview.test.ts`:**
  - `WidgetMiniPreview` コンポーネントの存在と壁紙・ヘッダー・行の構成要素
  - `onDrag` コールバックの存在と `onDragRef` パターン
  - `dragBgOpacity` / `dragCardOpacity` ローカル状態とプレビューへの接続
  - `withAlpha` / `blendHex` ヘルパー関数の存在
  - ヒントテキスト `"タップ・スライドとも1%単位で反映されます"` の不在
  - リリースのみ永続化パターン（`onPanResponderRelease` + `onChange`）

---

## 15. ウィジェット背景スタイル（無地／幾何学模様）仕様 (v36)

### 15.1 背景スタイル概要
- **スタイル種別 (`WidgetBackgroundStyle`):**
  - `solid`（無地）: 従来の単色テーマ背景色 + 透過率適用。
  - `geometric`（幾何学模様）: プレビューで好評だった大きな丸（右上と左下の2つの円）が重なるグラフィックデザイン + 透過率適用。
- **Vector Drawable リソース:**
  - `res/drawable/widget_bg_geometric.xml`（ライトモード用: `#F7F8F5` ベース、右上 `#B8D4E8`、左下 `#D4C4E0`、16dp角丸clip-path）
  - `res/drawable/widget_bg_geometric_dark.xml` / `res/drawable-night/widget_bg_geometric.xml`（ダークモード用: `#14231F` ベース、右上 `#2A4060`、左下 `#3D2D50`、16dp角丸clip-path）
  - ベクター定義により描画負荷とメモリ消費を極小化。

### 15.2 設定画面 UI & リアルタイムミニプレビュー連動
- **UI 配置:** 設定画面 > 表示・文字・Widget > ウィジェットセクション内、ミニプレビューの直下に「背景スタイル」選択 Segmented コントロールを配置（`無地` / `幾何学模様`）。
- **リアルタイム反映:** セグメント切り替え時に即座にプレビューへ反映。
  - `geometric` 選択時: `WidgetMiniPreview` 内のウィジェット本体に幾何学模様レイヤーをオーバーレイし、設定された `widgetBackgroundOpacity`（アルファ値）を適用。
  - `solid` 選択時: ウィジェット本体は単色背景 + アルファ値でレンダリング。
- **スライダー操作の安定性（引き戻り解消）:**
  - `OpacitySlider` に `committedValue` を導入。指を離した瞬間に `finalVal` を `committedValue` に保持することで、親コンポーネントの非同期State反映待ちによるスライダー位置の巻き戻り（勝手に右や元の値に戻るバグ）を恒久解消。

### 15.3 ホーム画面ウィジェット（RemoteViews）実体への適用
- **状態伝達:**
  - `displaySettings.widgetBackgroundStyle` を `FocusGateModule.saveGateState()` 経由で native SharedPreferences へ保存。
- **Provider 実装 (`FocusFlowWidgetProvider.kt`):**
  - `bindTheme()` にて `widgetBackgroundStyle` を判定。
  - `geometric` の場合: `focus_flow_widget_bg_geometric`（ImageView）を VISIBLE にし、ダーク/ライトに応じた `widget_bg_geometric` をセット。`setImageAlpha(opacity * 255 / 100)` により透過率を適用。`focus_flow_widget_card` は透明背景にし、ヘッダー背景は幾何学模様が柔らかく透ける濃度（`opacity * 0.45`）で混色。
  - `solid` の場合: `focus_flow_widget_bg_geometric` を GONE にし、従来通り `focus_flow_widget_card` に `colorWithOpacity(background, opacity)` を適用。
- **レイアウト (`focus_flow_widget_initial.xml`):**
  - `focus_flow_widget_root`（FrameLayout）直下に `<ImageView android:id="@+id/focus_flow_widget_bg_geometric" android:scaleType="fitXY" android:visibility="gone" />` を配置。

### 15.4 多言語リソース集約
- `widget_bg_style_title`（背景スタイル / Background style）
- `widget_bg_style_solid`（無地 / Solid）
- `widget_bg_style_geometric`（幾何学模様 / Geometric）
- `strings.xml` および `strings.ts` に集約・管理。

---

## 16. 透過率スライダーState管理 & ドラッグ競合解消 (v37)

### 16.1 不具合原因の分析
- **PanResponder インスタンス再生成の競合:**
  - `useMemo` の依存配列に `normalized` や `onChange` などの再レンダリング毎に変化する変数が含まれていたため、ドラッグ中にスライダーのジェスチャーハンドラが破棄・再生成され、`onPanResponderTerminate` が発火して初期値へ巻き戻る現象が発生していた。
- **外部State同期とローカル更新の競合:**
  - 親コンポーネント経由の再描画時に、外部から渡される保存値がドラッグ中のローカルStateを上書きしてしまっていた。
- **スクロールビューによるジェスチャー横取り:**
  - 親の `ScrollView` がドラッグ中の横スワイプジェスチャーをスクロールと誤認識して割り込み、スライダー操作が中断されていた。

### 16.2 根本修正設計
1. **ドラッグ中フラグ (`isDragging` & `isDraggingRef`):**
   - ローカルState `const [isDragging, setIsDragging] = useState(false)` と Ref `isDraggingRef` を導入。
   - タッチ開始（`onPanResponderGrant`）および移動（`onPanResponderMove`）で `true`、終了（`onPanResponderRelease` / `onPanResponderTerminate`）で `false` に切り替え。
2. **外部State同期ガード (`if (!isDragging)`):**
   - `useEffect(() => { if (!isDragging) { setSliderValue(normalized); setCommittedValue(undefined); } }, [normalized, isDragging])`
   - ドラッグ中は外部からの更新を完全に遮断し、ユーザーの指による操作値（`sliderValue`）を保護。
3. **`PanResponder` の不変安定化:**
   - 依存配列を `[thumbRadius]`（定数）のみに限定し、コンポーネントのライフサイクル中にインスタンスが再生成されないように設計。
   - 動的値（`usableTrackWidth`, `trackWidth`, `normalized`, `onChange`, `onDrag`）はすべて最新の Ref を経由して参照。
   - `onPanResponderTerminationRequest: () => false` を明示し、親 `ScrollView` によるタッチ横取り・中断を防止。
4. **ドラッグ処理の完全軽量化と保存限定:**
   - ドラッグ中（`onPanResponderMove`）は `setSliderValue(next)` と `onDragRef` によるプレビュー通知のみを行い、保存（`onChange`）やIPC・IO処理は一切行わない。
   - 指を離した時（`onPanResponderRelease`）にのみ確定値で `onChange(finalVal)` を呼び出し、永続化とウィジェット更新を実行。

---

## 17. カスタム背景システム & Pro（Plus）機能連携 (v38)

### 17.1 背景スタイルのラインナップ
Things 3、Craft、Fabulous等のモダンアプリをベンチマークとした洗練された4つの背景スタイルを提供。
1. **無地 (`solid` / Free):**
   - プレーンでクリーンなソリッド背景。
   - ミニプレビューにおいて壁紙の装飾サークルを非表示にし、純粋な無地カードの透過性を正確に再現。
2. **幾何学模様 (`geometric` / Pro):**
   - 大きな円が重なり合う有機的で幾何学的なグラフィック。
   - Light: `#B8D4E8` / `#D4C4E0`, Dark: `#2A4060` / `#3D2D50`。
3. **オーロラ (`aurora` / Pro):**
   - 幻想的なグラデーションと波打つ曲線のオーロラパターン。
   - Light: `#BCE3DB` / `#D5C8E8` / `#F0D4DC`, Dark: `#1D3F38` / `#2D2545` / `#382035`。
4. **ミニマルグリッド (`grid` / Pro):**
   - 秩序と集中を高める精密なグリッド線（方眼調）パターン。
   - Light: `#DCE5E0`（線幅0.8dp, アルファ0.65）, Dark: `#233830`。

### 17.2 アプリ全体およびウィジェットへの適用設計
1. **アプリ全体（`ScreenContainer` / `AppBackground`）:**
   - 全ての主要画面（「今日」、Todos、Habits、設定、分析等）の最背面レイヤーとして `AppBackground` を描画。
   - `pointerEvents="none"` および `StyleSheet.absoluteFill` により、操作への干渉と再描画負荷を完全に排除。
   - カードの背景コントラストを維持し、Material 3 の可読性ガイドラインを遵守。
2. **ホーム画面ウィジェット（`FocusFlowWidgetProvider.kt` / RemoteViews）:**
   - `widget_bg_geometric`、`widget_bg_aurora`、`widget_bg_grid` の Vector Drawable（Light/Dark）を `R.id.focus_flow_widget_bg_geometric` に動的バインド。
   - 設定された透過率（`widgetBackgroundOpacity`）に応じた `setImageAlpha` 制御を継承。

### 17.3 Pro（Plus）課金連携
1. **UI表現:**
   - 選択オプション（幾何学模様、オーロラ、ミニマルグリッド）に 👑 Pro バッジを明示。
2. **アクセス制御 & ガード:**
   - 無料ユーザーが Pro 背景を選択した場合、Paywallダイアログ（`Alert.alert`）を表示し、Plus確認（`setPanel("plus")`）へスムーズに誘導。
   - 設定値は保存されず、無償プランの範囲（`solid`）を保護。
3. **Plusユーザー保護:**
   - Plus契約中またはアンリミテッドビルド（`isPlus === true`）のユーザーのみ選択・永続化・ウィジェット反映が可能。

### 17.4 多言語リソース集約
- `widget_bg_style_aurora`（オーロラ / Aurora）
- `widget_bg_style_grid`（ミニマルグリッド / Minimal Grid）
- `bg_theme_title`（背景テーマ / Background theme）
- `bg_theme_detail`（アプリ全体とホーム画面ウィジェットに共通で反映されます。 / Applies to the entire app and home screen widgets.）
- `pro_badge`（👑 Pro）
- `plus_feature_bg_style_message`（カスタム背景テーマ（幾何学模様・オーロラ・ミニマルグリッド）はPlus限定です。…）

---

## 18. 統一Pro課金アーキテクチャ & 標準Paywall体験 (v39)

### 18.1 有料機能（Plus / Pro）の体系化マトリクス
著名なTodoアプリ・習慣アプリ（Todoist、TickTick、Things 3、Craft等）をベンチマークとし、無料版と有料版（Plus）の境界を明確化。

| 機能カテゴリ | 無料プラン（Free） | Plus / Pro プラン（サブスクリプション） | 画面上のバッジ表示 |
|---|---|---|---|
| **Todo・習慣・メモ** | 各2件まで（未完了ベース） | **完全無制限** | 上限到達時にPlus案内 |
| **制限対象アプリ** | 最大5件まで | **完全無制限** | 上限到達時にPlus案内 |
| **フォント（文字）** | 標準（システム）のみ | **標準 + 3種の厳選フォント**<br>（リーディング、ノート、フォーカス） | `👑 Pro` バッジ |
| **背景テーマ** | 無地（ソリッド）のみ | **無地 + 3種のカスタム背景**<br>（幾何学模様、オーロラ、ミニマルグリッド） | `👑 Pro` バッジ |
| **ウィジェット背景** | 無地のみ | **全カスタム背景対応** | `👑 Pro` バッジ |
| **テーマセット** | 保存不可 | **お気に入りの見た目を無制限に保存・復元** | `👑 Pro` バッジ |

※ 早期完了（Early Completion）は特定タスクを設定時間前に即時完了させる1回限りの消費型商品（In-App Purchase）であり、月額サブスクリプションとは明確に区別。

### 18.2 統一された `👑 Pro` バッジの導入
- **表示箇所:**
  - フォント選択（`FontChoice`）: リーディング、ノート、フォーカス
  - 背景スタイル選択（`BackgroundStyleSelector`）: 幾何学模様、オーロラ、ミニマルグリッド
  - 設定パネル内テーマセット: セクション見出し `テーマセット（👑 Pro）`
- **デザイン仕様:**
  - 無料ユーザー時: ゴールド/アンバー基調（`#B87A10`, `#FFF4E3`, `#E5A93C`）で「アップグレード対象」を品よく提示。
  - Plus加入者時: アクティブテーマのアクセント（`palette.primary`, `palette.primarySoft`）で「アンロック済み」のステータス感を演出。

### 18.3 標準的で親切なPaywall / アップグレード案内体験
1. **行き止まり（Dead-end）アラートの排除:**
   - Todo・習慣・メモ・アプリ制限の上限到達時、およびProフォント・Pro背景のタップ時に、常に「Plusを確認」(`View Plus`) ボタンを備えたアラートを表示。
2. **スムーズな画面遷移（Deep Linking / URLパラメータ連動）:**
   - 各画面から `router.push({ pathname: "/(tabs)/settings", params: { panel: "plus" } })` を実行することで、設定画面のPlus購入パネル（`PlusPanel`）へ即座にダイレクト遷移。
3. **プラン比較表（Plan Comparison）の強化:**
   - `PlusPanel` 内で「無料 vs Plus」の全5大特典（アイテム無制限、制限アプリ無制限、厳選フォント、カスタム背景、テーマセット保存）を明確に対比表示。

### 18.4 多言語リソース集約
- `plus_feature_font_title`（Plus限定のフォント / Plus Typography）
- `plus_feature_font_message`（プレミアムフォント（リーディング・ノート・フォーカス）はPlus限定です。…）
- `free_limit_todo_message`（Todoは無料版では未完了2件までです。Plusに登録すると…）
- `free_limit_habit_message`（習慣は無料版では2件までです。Plusに登録すると…）
- `free_limit_app_message`（無料版では制限対象アプリを5件まで選べます。Plusに登録すると…）
- `plan_feature_*`（比較表各項目）

---

## 19. Pro専用Paywall（アップグレード案内画面）アーキテクチャ (v41)

### 19.1 設計方針
既存の課金基盤（`lib/focus-flow/billing.ts`, `lib/focus-flow/iap-bridge.ts`, `lib/focus-flow/provider.tsx`）に完全準拠し、Things 3やCraftなどの著名アプリと同等の品格と安心感を提供する専用Paywallモーダル（`components/focus-flow/paywall-modal.tsx`）を構築。

### 19.2 UI・UX構成
1. **Heroエリア:**
   - 幾何学グラデーションサークル（`heroCircleA`, `heroCircleB`）のやわらかな透け感。
   - ゴールドクラウンバッジ（`workspace-premium`）、大見出し「Focus Flow Pro」、洗練されたタグライン。
2. **4大Pro機能バリュー提示:**
   - `wallpaper`: カスタム背景テーマ（幾何学模様・オーロラ・グリッドでアプリとウィジェットを彩る）
   - `tune`: ウィジェット透過率の微調整（壁紙に馴染む透け感やカードの透明度をミリ単位で調整）
   - `all-inclusive`: Todo・習慣・メモが無制限（無料枠上限を全撤廃）
   - `lock-clock`: 制限アプリ無制限＆テーマセット保存（集中制限を無限に拡張し、現在の見た目を保存）
3. **プランセレクター:**
   - **年額プラン（おすすめ / ベストバリュー）:** ¥3,800/年（約¥316/月・34%お得）
   - **月額プラン:** ¥480/月（いつでも解約可能）
   - ラジオ選択による直感的なプラン選択。
4. **CTAボタン & 購入フィードバック:**
   - 「7日間の無料体験を開始」または「Proを開始する」
   - 購入処理中は `ActivityIndicator` を表示して重複タップを防止。
   - 既存の `purchasePlus()` を呼び出し、購入完了・Pro化検知時に `safeHaptic("success")` と共にモーダルを自動閉幕。
5. **Google Play ガイドライン & 法的要件:**
   - 上部および下部に「購入を復元」(`restorePlus()`) ボタンを常設。
   - 「Google Play の定期購入設定からいつでも解約できます」の明記。
   - 利用規約（`/terms`）およびプライバシーポリシー（`/privacy`）への直接リンク。
   - 閉じるボタン（`×`）を配置。

### 19.3 各Pro導線との接続
- **ウィジェット透過率スライダー（`OpacitySlider`）:**
  - 非Pro時は `👑 Pro` バッジを表示。
  - スライダードラッグ/タップ操作時に即座にPaywallモーダルを開き、無料ユーザーによる変更を安全にガード。
- **背景スタイル選択（`BackgroundStyleSelector`）:**
  - 幾何学模様等のPro背景タップ時にPaywallモーダルを開く。
- **Plusパネル（`PlusPanel`）:**
  - 「👑 Proアップグレード詳細を見る」ボタンを追加し、Paywallモーダルを直接呼び出し可能。
- **グローバルコンテキスト & ルートレイアウト:**
  - `FocusFlowProvider` に `paywallVisible`, `openPaywall`, `closePaywall` を提供し、`app/_layout.tsx` のルートシェルに `<PaywallModal />` をマウント。アプリ内のあらゆる場所からワンコールでPaywallをトリガー可能。

---

## 20. ストア品質・クラッシュ防止・堅牢化アーキテクチャ (v42 - Phase 3)

### 20.1 端末再起動・プロセス破棄への完全耐性 (Reboot & Memory-Kill Resilience)
1. **デュアル永続化（AsyncStorage + Native SharedPreferences バックアップ）:**
   - JS側の AsyncStorage への非同期保存と同時に、ネイティブ側の SharedPreferences（`FocusGateModule.GATE_PREFS`）へ完全な JSON データを `commit()` により即時ディスク同期。
   - OS によるプロセスキル、バッテリー切れ、端末強制終了直前でもトランザクションの破損や未コミットによるデータ消失を完全に防止。
   - ネイティブモジュール経由で `saveAppDataBackup` / `getAppDataBackup` を備え、万一の AsyncStorage 破損時にもネイティブストレージから自動復旧可能。
2. **再起動後のウィジェット（Glance / RemoteViews）安全復帰:**
   - 端末起動時（`ACTION_BOOT_COMPLETED`）およびアプリ更新時（`ACTION_MY_PACKAGE_REPLACED`）に `FocusFlowWidgetProvider.refreshAll()` をトリガー。
   - `safeUpdateWidget` / `updateFallbackWidget` 機構により、未ロード状態でも「Focus Flow」のヘッダーおよび「タスクを読み込み中...」のフォールバック表示を即座にレンダリングし、白画面・透明化・ANRを完全に根絶。

### 20.2 AccessibilityService 安全機構・フェイルセーフ (Fail-Safe Whitelist)
1. **システム必須パッケージの完全保護（Lockout Prevention）:**
   - OS 設定（`com.android.settings`）、Google Play ストア（`com.android.vending`）、パッケージインストーラー（`com.google.android.packageinstaller`, `com.android.packageinstaller`）、電話・通話（`com.android.dialer`, `com.google.android.dialer`, `com.android.server.telecom`, `com.android.phone`）、SystemUI 等をハードコードされた `isProtectedSystemPackage` で厳格に除外。
   - ユーザーが誤ってこれらのパッケージをブロックリストに登録した場合や、画面遷移の一過性状態であっても、`ruleBlocking()` が常に `null` を返却してオーバーレイ表示を無効化。設定アプリや緊急通話、ストアでの更新操作がブロックされる重大トラブルを100%防止。
2. **オーバーレイ WindowManager 安全カプセル化:**
   - `windowManager().addView()` および `windowManager().removeViewImmediate()` を `try-catch` ブロックで完全に保護。
   - ライフサイクル中断時（`onInterrupt` / `onDestroy`）にも `gateOverlay = null` / `gateOverlayPackage = null` のクリーンアップを徹底し、オーバーレイのゴースト表示やリークを排除。

### 20.3 オフラインファースト設計 & 課金ネットワーク耐性 (Offline Resilience)
1. **100% ローカル完結のコア機能:**
   - Todo管理、習慣記録、タイマー、集中制限判定、ウィジェット描画は一切の外部ネットワーク通信を必要とせず、完全オフラインで動作を保証。
2. **ネットワーク不通時の課金エラー安全ハンドリング:**
   - Paywall モーダル（`components/focus-flow/paywall-modal.tsx`）における購入（`handlePurchase`）および復元（`handleRestore`）の実行時、ネットワーク未接続や Google Play ストア通信失敗による未捕捉の例外（Unhandled Promise Rejection）をキャッチ。
   - ローカライズされた親切なダイアログ（`paywall_offline_title`:「インターネットに接続されていません」、`paywall_offline_message`:「定期購入や復元を行うには、ネットワーク接続が必要です。通信環境をご確認のうえ、再度お試しください。」）を表示して安全に復帰。



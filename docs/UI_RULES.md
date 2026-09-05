# Focus Flow UI Rules

このドキュメントは、Focus Flow アプリのUIデザインシステムおよび画面設計の統一基準を定義したものです。

---

## 最重要原則：TodoカードをUIのマスターコンポーネントとする

アプリ内に登場するすべてのカード型UI（Habitカード、設定項目、ホーム画面Widgetなど）は、**Todoカード（`components/focus-flow/item-cards.tsx` 内の `TodoItemCard`）の実装仕様・ビジュアル言語を絶対的な基準（マスター）** とします。

新機能の追加やUI改善を行う際は、勝手に新しいマージンや角丸、カラーパターンを発明せず、Todoカードの仕様を踏襲してください。

---

## デザイン原則

1. **情報階層の明確化**:
   - 1. アイテム名（タイトル）
   - 2. 達成・完了ステータス
   - 3. 必須判定（アプリ制限対象かどうか）
   - 4. サブタスク・進捗・付加情報
   の優先度順でレイアウトを構成する。
2. **同じ意味のUIは同じデザイン**:
   - チェックボックス、必須バッジ、展開矢印、タグなどは画面をまたいでも同一のコンポーネント・トークンを使用する。
3. **余白ルールの統一**:
   - コンパクトでありながら指で押しやすい最小44dpのタッチターゲットを確保する。
4. **操作領域の完全分離**:
   - カード本体のタップ（編集・詳細画面への遷移）と、完了チェック・展開矢印などのインライン操作は必ず分離し、誤タップによる画面遷移を防ぐ。
5. **過度な情報詰め込みの防止**:
   - 二次的な情報はメタ行や折りたたみ領域にまとめ、メインリストの視認性を高く保つ。

---

## Todo Card 実装仕様（マスター基準）

`components/focus-flow/item-cards.tsx` の実装に基づく数値定義：

### 1. Card Rules（外枠・基本寸法）
- **角丸 (`borderRadius`)**: `14dp`
- **枠線 (`borderWidth`)**: `1dp`（`borderColor: palette.border`）
- **背景色 (`backgroundColor`)**:
  - 未完了時: `palette.surface`
  - 完了時: `palette.elevated`（トーンを落として控えめに表示）
- **最小高さ (`minHeight`)**: `66dp`
- **パディング**:
  - `paddingVertical: 7dp`
  - `paddingLeft: 12dp`
  - `paddingRight: 3dp`
- **マージン**: `marginBottom: 5dp`
- **左端カラーレール (`styles.rail`)**:
  - 幅: `4dp`（左端絶対配置: `position: "absolute"`, `left: 0`, `top: 0`, `bottom: 0`）
  - 色: `palette.primary`（Todo）または `habit.color`（習慣）

### 2. Checkbox（完了チェックUI）
- **タッチターゲット領域 (`styles.todoCheckTouchTarget`)**:
  - 幅 `44dp` × 高さ `44dp`（アクセシビリティ標準）
  - 配置調整: `marginLeft: -8dp`, `marginTop: -5dp`, `marginRight: 2dp`
- **チェックボックス本体 (`styles.todoCheck`)**:
  - 外寸: 幅 `24dp` × 高さ `24dp`
  - 角丸: `6dp`
  - 枠線: `1.5dp`（`borderColor: palette.border`）
  - 未完了時: 背景透明、枠線のみ
  - 完了時: `backgroundColor: palette.primary`, `borderColor: palette.primary`、白チェックアイコン（MaterialIcons "check", サイズ `15dp`）

### 3. Required Badge（必須バッジ）
- **コンポーネント**: `Pill`（`components/focus-flow/ui.tsx`）
- **ラベル**: `必須`（英語: `Must-do`）
- **寸法・スタイル**:
  - `paddingHorizontal: 6dp`, `paddingVertical: 2dp`, `borderRadius: 6dp`
  - 文字サイズ: `10dp`, `fontWeight: "800"`
  - カラー: 文字色 `palette.primary`, 背景色 `palette.primarySoft`

### 4. Expand / Collapse & Actions（右端・補助操作）
- **詳細・削除ボタン (`styles.trailing`)**:
  - サイズ: 幅 `32dp` × 高さ `34dp`
  - アイコン: `chevron-right`（通常時、サイズ `20dp`、`palette.muted`）または `delete-outline`（削除可能時、サイズ `19dp`）
  - `hitSlop: 8dp`
- **サブタスク階層インジケータ (`styles.subtaskIndicator`)**:
  - サイズ: 幅 `28dp` × 高さ `38dp`
  - アイコン: `subdirectory-arrow-right`（サイズ `17dp`、`palette.primary`）

### 5. Detail Area（サブタスク階層構造）
Todoの子要素であるサブタスクは、親カード内で以下のツリーガイドライン構造で表現する：
- **親カード進捗バッジ (`styles.subtaskBadge`)**:
  - 背景色: `palette.primarySoft`, 角丸: `6dp`
  - アイコン: `account-tree`（サイズ `11dp`、`palette.primary`）
  - テキスト: `サブタスク 0/3`（サイズ `10dp`, `fontWeight: "800"`）
- **ツリー接続ガイド (`styles.treeGuide`)**:
  - 寸法: 幅 `14dp` × 高さ `20dp`
  - 縦線 (`styles.treeLineVertical`): `left: 3dp`, `width: 1.5dp`, `backgroundColor: palette.border`
  - 横線 (`styles.treeLineHorizontal`): `left: 3dp`, `top: 10dp`, `width: 8dp`, `height: 1.5dp`, `backgroundColor: palette.border`
- **サブタスク用ミニチェック (`styles.miniCheck`)**:
  - 外寸: 幅 `14dp` × 高さ `14dp`
  - 角丸: `4dp`, 枠線: `1dp`
  - 親チェックと明確にサイズ・重み付けを変えることで階層関係を一目で伝える。
- **サブタスクテキスト (`styles.subtaskPreviewText`)**:
  - 文字サイズ: `11dp`, `lineHeight: 15dp`, `fontWeight: "600"`
  - 完了時: `textDecorationLine: "line-through"`

### 6. Typography（タイポグラフィ標準）
- **カードタイトル (`styles.todoTitle`)**:
  - `fontSize: 14dp`, `lineHeight: 19dp`, `fontWeight: "800"`
  - 色: `palette.text`（未完了時）、`palette.muted` + 取消線（完了時）
  - `numberOfLines: 2`
- **メモ・補助テキスト (`styles.todoMemo`)**:
  - `fontSize: 10dp`, `lineHeight: 14dp`, `color: palette.muted`, `marginTop: 1dp`
- **期限表示 (`styles.todoDue`)**:
  - `fontSize: 10dp`, `lineHeight: 15dp`, `fontWeight: "800"`
  - 通常時: `palette.muted`
  - 期限超過時: `COLORS.error`（`#D65A4A`）

### 7. Spacing（共通スペーシングルール）
- **カード間マージン**: `5dp`
- **セクション見出し下マージン**: `6dp`
- **画面左右パディング**: `20dp`（`className="px-5"`）
- **メタ情報要素間ギャップ**: `gap: 5dp`
- **インラインアイコンと文字のギャップ**: `gap: 3dp` 〜 `4dp`

---

## 習慣（Habit）カードへの適用ルール

Habitカード（`HabitItemCard`）は、Todoカードの兄弟コンポーネントとして以下の通り同一のビジュアル言語を維持します：

1. **外枠・レール**:
   - Todoカードと同一の角丸（14dp）、枠線（1dp）、パディング、左端レール（幅4dp、色は習慣のカスタムカラー）を保持。
2. **完了チェック**:
   - 外寸28dp（角丸6dp、枠線1.5dp）。44dpのタッチターゲットを確保し、左側に配置。
3. **メタ情報**:
   - 必須バッジ（`Pill`）に加え、進捗ピル（例: `今日 0/10回`、背景色: `habit.color + "1A"`）を左寄せで配置。
4. **展開操作の分離（再発防止最重要ルール）**:
   - カード本体タップ（`styles.habitSummary`）は「詳細・編集モーダルを開く」。
   - 右端の曜日展開矢印（`styles.expandButton`）は `event.stopPropagation()` を呼び出し、曜日ドットの開閉のみを行う。絶対にこれらを混同・結合してはならない。

---

## Android Widget への適用ルール

Android RemoteViews によるホーム画面Widgetは、システムの制限（利用可能なViewやCSSの制約）がありますが、可能な限りTodoカードのデザイン言語を反映します：

1. **角丸・カード背景**:
   - 半透明またはソリッドのカード背景（14dp〜16dp相当のドローアブル角丸）。
2. **情報階層**:
   - 左端にチェックUI（またはカテゴリバー）、中央にタイトル・メタ情報（必須バッジ）、右側にアクション。
3. **必須バッジの表現**:
   - 「必須」表記をアプリ本体と同様に強調し、集中制限の解除対象であることが一目でわかるようにする。
4. **タイポグラフィ**:
   - タイトルを太字、補助テキスト（期限・進捗）を小さく控えめなカラーにして階層を維持する。

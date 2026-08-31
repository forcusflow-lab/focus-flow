# Todoist参考メモ

調査日: 2026-08-31

Todoist公式のサブタスク仕様では、サブタスクは親タスクを完了するための手順として扱い、親子階層・順序・完了済み表示・未完了への戻し・削除・既存タスクのサブタスク化を提供している。Focus Flowでは、まず1階層の親Todoと子Todoを採用し、親Todo詳細から追加・編集・完了・未完了化できる設計を基本とする。

Todoist公式のQuick Add仕様では、タスク名を主入力とし、追加操作の補助情報を説明欄へ分離している。Focus Flowでは自然言語解析などを追加せず、Todo名とメモ欄を明確に分離し、メモからTodoへ移植する場合はメモ本文をTodoのメモ欄へそのまま引き継ぐ。

参照URL:
- https://www.todoist.com/help/todoist/features/use-sub-tasks-in-todoist-kMamDo
- https://www.todoist.com/help/todoist/features/use-task-quick-add-in-todoist-va4Lhpzz

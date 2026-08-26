export type WidgetItemIdentity = {
  id: string;
  kind: string;
};

/**
 * Widgetは限られた行へ同じ対象を二度描画してはならない。入力順を保ち、
 * Todoと習慣は同じID文字列でも別種別として扱う。
 */
export function uniqueWidgetItems<T extends WidgetItemIdentity>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const id = item.id.trim();
    const kind = item.kind.trim();
    if (!id || !kind) return false;
    const key = `${kind}:${id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function widgetRowActionKey({ widgetId, row, operation, kind, itemId }: { widgetId: number; row: number; operation: "complete" | "restore" | "increment" | "decrement" | "timer_start"; kind: string; itemId: string }) {
  return `${widgetId}:${row}:${operation}:${kind}:${itemId}`;
}

export function transactionOperations(operation: unknown) {
  const entries: { operation: Record<string, unknown>; position: string }[] = [];
  const pending = [{ operation, position: 'operation', depth: 0 }];
  let visited = 0;
  let truncated = false;
  while (pending.length && visited < 1000) {
    const item = pending.pop()!;
    visited++;
    if (!item.operation || typeof item.operation !== 'object' || Array.isArray(item.operation)) continue;
    const current = item.operation as Record<string, unknown>;
    entries.push({ operation: current, position: item.position });
    if (current.type !== 'SET' || !Array.isArray(current.op_list)) continue;
    if (item.depth >= 32) {
      truncated ||= current.op_list.length > 0;
      continue;
    }
    const count = Math.min(current.op_list.length, 1000 - visited - pending.length);
    truncated ||= count < current.op_list.length;
    for (let index = count - 1; index >= 0; index--) {
      pending.push({ operation: current.op_list[index], position: `${item.position}.op_list[${index}]`, depth: item.depth + 1 });
    }
  }
  return { entries, truncated: truncated || pending.length > 0 };
}

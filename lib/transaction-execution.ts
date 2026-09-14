function executionCode(receipt: unknown): number | null {
  const pending: unknown[] = [receipt];
  let inspected = 0;
  let incomplete = false;
  while (pending.length && inspected < 1000) {
    const entry = pending.pop();
    inspected++;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      incomplete = true;
      continue;
    }
    const result = entry as Record<string, unknown>;
    const validCode = typeof result.code === 'number' && Number.isSafeInteger(result.code) && result.code >= 0;
    if (validCode && (result.code as number) > 0) return result.code as number;
    if (result.code !== undefined && !validCode) incomplete = true;
    if (result.result_list !== undefined) {
      const list = result.result_list;
      if (!list || typeof list !== 'object' || Array.isArray(list)) {
        incomplete = true;
        continue;
      }
      const keys = Object.keys(list);
      if (!keys.length || keys.some((key, index) => key !== String(index))) incomplete = true;
      const remaining = 1000 - inspected - pending.length;
      if (keys.length > remaining) incomplete = true;
      for (const key of keys.slice(0, remaining).reverse()) pending.push((list as Record<string, unknown>)[key]);
    } else if (!validCode) {
      incomplete = true;
    }
  }
  return incomplete || pending.length ? null : 0;
}

export function transactionExecution(transaction: unknown): { status: string; finalization: string } {
  const value = transaction && typeof transaction === 'object' ? transaction as Record<string, unknown> : {};
  const code = executionCode(value.receipt);
  const status = value.is_executed === false ? 'Not executed'
    : value.is_executed !== true || code === null ? 'Unknown'
    : code === 0 ? 'Succeeded' : `Failed (code ${code})`;
  return { status, finalization: value.is_finalized === true ? 'Finalized'
    : value.is_finalized === false ? 'Not finalized' : 'Unknown' };
}

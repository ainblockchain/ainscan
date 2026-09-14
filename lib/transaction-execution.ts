export function transactionExecution(transaction: unknown): { status: string; finalization: string } {
  const value = transaction && typeof transaction === 'object' ? transaction as Record<string, unknown> : {};
  const receipt = value.receipt && typeof value.receipt === 'object' ? value.receipt as Record<string, unknown> : {};
  const code = typeof receipt.code === 'number' && Number.isSafeInteger(receipt.code) && receipt.code >= 0 ? receipt.code : null;
  const status = value.is_executed === false ? 'Not executed'
    : value.is_executed !== true || code === null ? 'Unknown'
    : code === 0 ? 'Succeeded' : `Failed (code ${code})`;
  return { status, finalization: value.is_finalized === true ? 'Finalized'
    : value.is_finalized === false ? 'Not finalized' : 'Unknown' };
}

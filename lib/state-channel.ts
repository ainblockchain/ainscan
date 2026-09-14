export function transactionChannels(operation: unknown): string[] {
  const channels = new Set<string>();
  const pending: unknown[] = [operation];
  let visited = 0;
  while (pending.length && visited < 1000) {
    const candidate = pending.pop();
    visited++;
    if (!candidate || typeof candidate !== 'object') continue;
    const input = candidate as Record<string, unknown>;
    if (input.type === 'SET' && Array.isArray(input.op_list)) pending.push(...input.op_list.slice(0, 1000 - visited));
    if (input.type !== 'SET_VALUE' && input.type !== undefined) continue;
    if (typeof input.ref !== 'string') continue;
    const match = /^\/state_channels\/([A-Za-z0-9._:-]{1,128})(?:\/|$)/.exec(input.ref);
    if (match) channels.add(match[1]);
  }
  return Array.from(channels);
}

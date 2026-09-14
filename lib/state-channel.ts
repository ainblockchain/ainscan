export function transactionPaths(operation: unknown): string[] {
  const paths = new Set<string>();
  const pending: unknown[] = [operation];
  let visited = 0;
  while (pending.length && visited < 1000) {
    const candidate = pending.pop();
    visited++;
    if (!candidate || typeof candidate !== 'object') continue;
    const input = candidate as Record<string, unknown>;
    if (input.type === 'SET' && Array.isArray(input.op_list)) pending.push(...input.op_list.slice(0, 1000 - visited));
    if (typeof input.ref !== 'string') continue;
    paths.add(input.ref);
  }
  return Array.from(paths);
}

export function transactionChannels(operation: unknown): string[] {
  const channels = new Set<string>();
  for (const path of transactionPaths(operation)) {
    const match = /^\/state_channels\/([A-Za-z0-9._:-]{1,128})(?:\/|$)/.exec(path);
    if (match) channels.add(match[1]);
  }
  return Array.from(channels);
}

export interface EscrowReference {
  root: string;
  source: string;
  target: string;
  key: string;
}

export function transactionEscrows(operation: unknown): EscrowReference[] {
  const references = new Map<string, EscrowReference>();
  const address = '0x[a-fA-F0-9]{40}';
  const rootPattern = new RegExp(`^/escrow/(${address})/(${address})/([A-Za-z0-9_-]{1,100})(?:/|$)`);
  const servicePattern = new RegExp(`^escrow\\|escrow\\|(${address}):(${address}):([A-Za-z0-9_-]{1,100})$`);
  const balancePattern = new RegExp(`^/service_accounts/escrow/escrow/(${address}):(${address}):([A-Za-z0-9_-]{1,100})/balance$`);
  for (const path of transactionPaths(operation)) {
    const labels = path.split('/');
    const matches = [rootPattern.exec(path), balancePattern.exec(path)];
    if (labels[1] === 'transfer') matches.push(servicePattern.exec(labels[2] ?? ''), servicePattern.exec(labels[3] ?? ''));
    for (const match of matches) {
      if (!match) continue;
      const root = `/escrow/${match[1]}/${match[2]}/${match[3]}`;
      references.set(root, { root, source: match[1], target: match[2], key: match[3] });
    }
  }
  return Array.from(references.values());
}

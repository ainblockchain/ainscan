import { transactionOperations } from './transaction-operations';

export function transactionPaths(operation: unknown): string[] {
  return Array.from(new Set(transactionOperations(operation).entries
    .map(entry => entry.operation.ref).filter((ref): ref is string => typeof ref === 'string')));
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

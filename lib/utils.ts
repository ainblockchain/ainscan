export function truncateHash(hash: string, chars = 8): string {
  if (!hash) return '';
  if (hash.length <= chars * 2 + 2) return hash;
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

export function truncateAddress(address: string, chars = 6): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatTimestamp(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function timeAgo(timestamp: number): string {
  if (!timestamp) return '';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatNumber(n: number): string {
  if (n == null) return '';
  return n.toLocaleString('en-US');
}

export function formatAIN(value: number): string {
  if (value == null) return '0';
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 6 })} AIN`;
}

export function isBlockNumber(input: string): boolean {
  return /^\d+$/.test(input.trim());
}

export function isTxHash(input: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(input.trim());
}

export function isAddress(input: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(input.trim());
}

export function getOperationType(tx: any): string {
  if (!tx?.operation) return 'TRANSFER';
  return tx.operation.type || 'UNKNOWN';
}

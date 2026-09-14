export interface ThroughputBlock {
  number: number;
  hash: string;
  last_hash: string;
  timestamp: number;
  transactions: unknown[];
}

export function chainThroughput(input: ThroughputBlock[]) {
  if (!Array.isArray(input) || input.length < 2) return null;
  const blocks = [...input].sort((left, right) => left.number - right.number);
  for (let index = 0; index < blocks.length; index++) {
    const block = blocks[index];
    if (!Number.isSafeInteger(block.number) || block.number < 0 || !Number.isSafeInteger(block.timestamp)
      || block.timestamp <= 0 || typeof block.hash !== 'string' || !Array.isArray(block.transactions)) return null;
    if (index > 0 && (block.number !== blocks[index - 1].number + 1
      || block.last_hash !== blocks[index - 1].hash || block.timestamp <= blocks[index - 1].timestamp)) return null;
  }
  const first = blocks[0];
  const last = blocks[blocks.length - 1];
  const transactions = blocks.slice(1).reduce((total, block) => total + block.transactions.length, 0);
  const elapsedMs = last.timestamp - first.timestamp;
  return { tps: transactions * 1000 / elapsedMs, transactions, elapsedMs,
    blocks: blocks.length - 1, from: first.number, to: last.number, timestamp: last.timestamp };
}

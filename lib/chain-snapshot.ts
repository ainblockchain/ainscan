import { chainThroughput, type ThroughputBlock } from './chain-throughput';

export function genesisHash(block: unknown): string | null {
  if (!block || typeof block !== 'object') return null;
  const value = block as Record<string, unknown>;
  return value.number === 0 && typeof value.hash === 'string' && /^0x[a-fA-F0-9]{64}$/.test(value.hash) ? value.hash : null;
}

export async function chainSnapshot(read: {
  genesis: () => Promise<unknown>;
  height: () => Promise<number>;
  blocks: (from: number, to: number) => Promise<ThroughputBlock[]>;
}) {
  const before = genesisHash(await read.genesis());
  if (!before) throw new Error('Genesis identity unavailable');
  const latest = await read.height();
  if (!Number.isSafeInteger(latest) || latest < 0) throw new Error('Invalid block height');
  const throughput = latest === 0 ? null : chainThroughput(await read.blocks(Math.max(0, latest - 10), latest + 1));
  if (latest > 0 && (!throughput || throughput.to !== latest)) throw new Error('Incomplete block window');
  if (genesisHash(await read.genesis()) !== before) throw new Error('Connected chain changed during observation');
  return { genesisHash: before, height: latest, throughput };
}

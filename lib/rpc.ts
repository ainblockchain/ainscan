import { rpcEndpoint } from './rpc-config';
import type { Network } from './network';

export type { Network } from './network';

let requestId = 0;

const MAX_RETRIES = 3;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function rpc(network: Network, method: string, params: Record<string, any> = {}): Promise<any> {
  params = { layer: 'L1', ...params };
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const browser = typeof window !== 'undefined';
    const res = await fetch(browser ? '/api/rpc' : rpcEndpoint(network), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(browser ? { network, method, params } : {
        jsonrpc: '2.0',
        id: ++requestId,
        method,
        params: { protoVer: '1.0.0', ...params },
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    // Retry on rate limit or non-JSON responses
    let json: any;
    try { json = JSON.parse(text); } catch {
      if (attempt < MAX_RETRIES) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      throw new Error(`RPC non-JSON response: ${text.slice(0, 100)}`);
    }
    if (!res.ok) {
      if (res.status === 429 && attempt < MAX_RETRIES) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      throw new Error(`RPC HTTP ${res.status}: ${res.statusText}`);
    }
    if (json.error) throw new Error(json.error.message);
    const wrapper = json.result;
    if (wrapper && typeof wrapper === 'object' && 'code' in wrapper && wrapper.code !== 0 && wrapper.result == null) {
      throw new Error(wrapper.message || `RPC error code ${wrapper.code}`);
    }
    return wrapper && typeof wrapper === 'object' && 'result' in wrapper ? wrapper.result : wrapper;
  }
}

// Block methods
export async function getLastBlockNumber(network: Network): Promise<number> {
  return rpc(network, 'ain_getLastBlockNumber');
}

export async function getLastBlock(network: Network): Promise<any> {
  return rpc(network, 'ain_getLastBlock');
}

export async function getBlockByNumber(network: Network, number: number, getFullTransactions = false): Promise<any> {
  return rpc(network, 'ain_getBlockByNumber', { number, getFullTransactions });
}

export async function getBlockByHash(network: Network, hash: string, getFullTransactions = false): Promise<any> {
  return rpc(network, 'ain_getBlockByHash', { hash, getFullTransactions });
}

export async function getBlockList(network: Network, from: number, to: number): Promise<any> {
  return rpc(network, 'ain_getBlockList', { from, to });
}

export async function getBlockHeadersList(network: Network, from: number, to: number): Promise<any> {
  return rpc(network, 'ain_getBlockHeadersList', { from, to });
}

export async function getBlockTransactionCountByNumber(network: Network, number: number): Promise<number> {
  return rpc(network, 'ain_getBlockTransactionCountByNumber', { number });
}

// Transaction methods
export async function getTransactionByHash(network: Network, hash: string): Promise<any> {
  return rpc(network, 'ain_getTransactionByHash', { hash });
}

export async function getTransactionByBlockNumberAndIndex(
  network: Network,
  block_number: number,
  tx_index: number,
): Promise<any> {
  return rpc(network, 'ain_getTransactionByBlockNumberAndIndex', { block_number, tx_index });
}

// Account methods
export async function getBalance(network: Network, address: string): Promise<number> {
  return rpc(network, 'ain_getBalance', { address });
}

export async function getNonce(network: Network, address: string): Promise<number> {
  return rpc(network, 'ain_getNonce', { address });
}

// Validator methods
export async function getValidatorsByNumber(network: Network, number: number): Promise<any> {
  return rpc(network, 'ain_getValidatorsByNumber', { number });
}

export async function getValidatorInfo(network: Network, address: string): Promise<any> {
  return rpc(network, 'ain_getValidatorInfo', { address });
}

// Network methods
export async function getConsensusStatus(network: Network): Promise<any> {
  return rpc(network, 'net_consensusStatus');
}

export async function getPeerCount(network: Network): Promise<number> {
  return rpc(network, 'net_peerCount');
}

export async function getNetworkId(network: Network): Promise<number> {
  return rpc(network, 'net_getNetworkId');
}

// Database methods
export async function getValue(network: Network, ref: string): Promise<any> {
  return rpc(network, 'ain_get', { type: 'GET_VALUE', ref });
}

export async function getRule(network: Network, ref: string): Promise<any> {
  return rpc(network, 'ain_get', { type: 'GET_RULE', ref });
}

export async function getFunction(network: Network, ref: string): Promise<any> {
  return rpc(network, 'ain_get', { type: 'GET_FUNCTION', ref });
}

export async function getOwner(network: Network, ref: string): Promise<any> {
  return rpc(network, 'ain_get', { type: 'GET_OWNER', ref });
}

export async function matchFunction(network: Network, ref: string): Promise<any> {
  return rpc(network, 'ain_matchFunction', { ref });
}

export async function matchRule(network: Network, ref: string): Promise<any> {
  return rpc(network, 'ain_matchRule', { ref });
}

export async function matchOwner(network: Network, ref: string): Promise<any> {
  return rpc(network, 'ain_matchOwner', { ref });
}

// REST API helpers
async function rest(network: Network, path: string): Promise<any> {
  if (typeof window !== 'undefined') throw new Error('REST index is server-only; use the RPC fallback');
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(`${rpcEndpoint(network).replace(/\/json-rpc\/?$/, '')}${path}`, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (res.status === 429 && attempt < MAX_RETRIES) {
      await sleep(1000 * (attempt + 1));
      continue;
    }
    // Public gateways answer the REST index with 403 "IP not whitelisted"; fail fast
    // so callers fall back to RPC instead of sleeping through non-JSON retries.
    if (!res.ok) throw new Error(`REST HTTP ${res.status}`);
    const text = await res.text();
    let json: any;
    try { json = JSON.parse(text); } catch {
      if (attempt < MAX_RETRIES) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      throw new Error(`REST non-JSON: ${text.slice(0, 100)}`);
    }
    return json.result ?? json;
  }
}

/**
 * Upper bound on how many recent blocks the RPC fallback scans for transactions.
 * Mainnet can go thousands of blocks without a transaction, so an unbounded scan
 * would walk millions of blocks and never finish a server render.
 */
export const RECENT_SCAN_BLOCKS = 1000;
const SCAN_BATCH_BLOCKS = 20; // ain_getBlockList returns at most 20 blocks per call
const SCAN_PARALLEL_BATCHES = 5;

/** Read up to RECENT_SCAN_BLOCKS latest blocks, newest first, stopping once `enough` is satisfied. */
async function scanRecentBlocks(network: Network, enough: (blocks: any[]) => boolean): Promise<any[]> {
  const lastBlock = await getLastBlockNumber(network);
  if (!Number.isSafeInteger(lastBlock) || lastBlock < 0) throw new Error('Invalid latest block number');

  const scanned: any[] = [];
  const floor = Math.max(0, lastBlock - RECENT_SCAN_BLOCKS + 1);
  for (let end = lastBlock; end >= floor && !enough(scanned); ) {
    const batchPromises = [];
    for (let i = 0; i < SCAN_PARALLEL_BATCHES && end >= floor; i++) {
      const batchStart = Math.max(floor, end - SCAN_BATCH_BLOCKS + 1);
      batchPromises.push(getBlockList(network, batchStart, end + 1));
      end = batchStart - 1;
    }
    for (const blocks of await Promise.all(batchPromises)) {
      if (!Array.isArray(blocks)) throw new Error('Invalid block list');
      scanned.push(...[...blocks].sort((left, right) => right.number - left.number));
    }
  }
  return scanned;
}

const withTransactions = (blocks: any[]) => blocks.filter((b) => b.transactions?.length > 0);

export async function getRecentBlocksWithTransactions(network: Network, count: number = 10): Promise<any[]> {
  // Try REST endpoint first
  const result = await rest(network, `/recent_blocks_with_transactions?count=${count}`).catch(() => []);
  if (Array.isArray(result) && result.length > 0) return result;
  // Fallback: scan a bounded window of recent blocks
  const blocks = await scanRecentBlocks(network, (scanned) => withTransactions(scanned).length >= count);
  return withTransactions(blocks).slice(0, count).sort((a, b) => b.number - a.number);
}

export async function getRecentTransactions(network: Network, count: number = 50): Promise<any[]> {
  // Try REST endpoint first
  const result = await rest(network, `/recent_transactions?count=${count}`).catch(() => []);
  if (Array.isArray(result) && result.length > 0) {
    return result.map((entry: any) => {
      const tx = entry.transaction || {};
      return {
        hash: tx.hash,
        address: tx.address,
        block_number: entry.block_number,
        timestamp: tx.tx_body?.timestamp || entry.block_timestamp,
        operation: tx.tx_body?.operation,
      };
    });
  }
  // Fallback: scan blocks for transactions
  return scanRecentTransactions(network, count);
}

/** Scan a bounded window of recent blocks for transactions (fallback when the REST index is unavailable). */
export async function scanRecentTransactions(network: Network, count: number = 50): Promise<any[]> {
  const txCount = (blocks: any[]) => blocks.reduce((sum, b) => sum + (b.transactions?.length || 0), 0);
  const blocks = await scanRecentBlocks(network, (scanned) => txCount(scanned) >= count);

  // Newest blocks first; fetch only as many full blocks as needed to reach `count`.
  const needed: number[] = [];
  let pending = 0;
  for (const b of withTransactions(blocks)) {
    if (pending >= count) break;
    needed.push(b.number);
    pending += b.transactions.length;
  }
  const fullBlocks = await Promise.all(needed.map((n) => getBlockByNumber(network, n, true)));

  const transactions: any[] = [];
  for (const block of fullBlocks) {
    if (!Array.isArray(block?.transactions)) throw new Error('Full block unavailable');
    for (const tx of block.transactions) {
      if (typeof tx === 'object') {
        transactions.push({
          hash: tx.hash,
          address: tx.address,
          block_number: block.number,
          timestamp: tx.tx_body?.timestamp || block.timestamp,
          operation: tx.tx_body?.operation,
        });
      }
    }
  }
  return transactions.slice(0, count);
}

// Tracker membership is network-wide; net_peerCount is only one node's neighbours.
export async function getNodeCount(network: Network): Promise<number> {
  const status = await rest(network, '/network_status');
  const count = status?.numNodesAlive;
  if (!Number.isSafeInteger(count) || count < 0) throw new Error('Network node count unavailable');
  return count;
}

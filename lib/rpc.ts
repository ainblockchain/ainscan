const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://devnet-api.ainetwork.ai/json-rpc';
const REST_BASE = RPC_URL.replace(/\/json-rpc$/, '');

let requestId = 0;

export async function rpc(method: string, params: Record<string, any> = {}): Promise<any> {
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: ++requestId,
      method,
      params: { protoVer: '1.0.0', ...params },
    }),
    next: { revalidate: 10 },
  });
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}: ${res.statusText}`);
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { throw new Error(`RPC non-JSON response: ${text.slice(0, 100)}`); }
  if (json.error) throw new Error(json.error.message);
  const wrapper = json.result;
  if (wrapper && typeof wrapper === 'object' && 'code' in wrapper && wrapper.code !== 0 && wrapper.result == null) {
    throw new Error(wrapper.message || `RPC error code ${wrapper.code}`);
  }
  return wrapper?.result ?? wrapper;
}

// Block methods
export async function getLastBlockNumber(): Promise<number> {
  return rpc('ain_getLastBlockNumber');
}

export async function getLastBlock(): Promise<any> {
  return rpc('ain_getLastBlock');
}

export async function getBlockByNumber(number: number, getFullTransactions = false): Promise<any> {
  return rpc('ain_getBlockByNumber', { number, getFullTransactions });
}

export async function getBlockByHash(hash: string, getFullTransactions = false): Promise<any> {
  return rpc('ain_getBlockByHash', { hash, getFullTransactions });
}

export async function getBlockList(from: number, to: number): Promise<any> {
  return rpc('ain_getBlockList', { from, to });
}

export async function getBlockHeadersList(from: number, to: number): Promise<any> {
  return rpc('ain_getBlockHeadersList', { from, to });
}

export async function getBlockTransactionCountByNumber(number: number): Promise<number> {
  return rpc('ain_getBlockTransactionCountByNumber', { number });
}

// Transaction methods
export async function getTransactionByHash(hash: string): Promise<any> {
  return rpc('ain_getTransactionByHash', { hash });
}

export async function getTransactionByBlockNumberAndIndex(
  block_number: number,
  tx_index: number,
): Promise<any> {
  return rpc('ain_getTransactionByBlockNumberAndIndex', { block_number, tx_index });
}

// Account methods
export async function getBalance(address: string): Promise<number> {
  return rpc('ain_getBalance', { address });
}

export async function getNonce(address: string): Promise<number> {
  return rpc('ain_getNonce', { address });
}

// Validator methods
export async function getValidatorsByNumber(number: number): Promise<any> {
  return rpc('ain_getValidatorsByNumber', { number });
}

export async function getValidatorInfo(address: string): Promise<any> {
  return rpc('ain_getValidatorInfo', { address });
}

// Network methods
export async function getConsensusStatus(): Promise<any> {
  return rpc('net_consensusStatus');
}

export async function getPeerCount(): Promise<number> {
  return rpc('net_peerCount');
}

export async function getNetworkId(): Promise<number> {
  return rpc('net_getNetworkId');
}

// Database methods
export async function getValue(ref: string): Promise<any> {
  return rpc('ain_get', { type: 'GET_VALUE', ref });
}

export async function getRule(ref: string): Promise<any> {
  return rpc('ain_get', { type: 'GET_RULE', ref });
}

export async function getFunction(ref: string): Promise<any> {
  return rpc('ain_get', { type: 'GET_FUNCTION', ref });
}

export async function getOwner(ref: string): Promise<any> {
  return rpc('ain_get', { type: 'GET_OWNER', ref });
}

export async function matchFunction(ref: string): Promise<any> {
  return rpc('ain_matchFunction', { ref });
}

export async function matchRule(ref: string): Promise<any> {
  return rpc('ain_matchRule', { ref });
}

export async function matchOwner(ref: string): Promise<any> {
  return rpc('ain_matchOwner', { ref });
}

// REST API helpers
async function rest(path: string): Promise<any> {
  const res = await fetch(`${REST_BASE}${path}`, { next: { revalidate: 10 } });
  if (!res.ok) throw new Error(`REST HTTP ${res.status}`);
  const json = await res.json();
  return json.result ?? json;
}

export async function getRecentBlocksWithTransactions(count: number = 10): Promise<any[]> {
  // Try REST endpoint first
  const result = await rest(`/recent_blocks_with_transactions?count=${count}`).catch(() => []);
  if (Array.isArray(result) && result.length > 0) return result;
  // Fallback: scan blocks
  return scanRecentBlocksWithTransactions(count);
}

/** Scan blocks backwards to find blocks with transactions (fallback). */
async function scanRecentBlocksWithTransactions(count: number): Promise<any[]> {
  const lastBlock = await getLastBlockNumber().catch(() => 0);
  if (!lastBlock) return [];

  const found: any[] = [];
  for (let end = lastBlock; end >= 0 && found.length < count; ) {
    const batchPromises = [];
    for (let i = 0; i < 8 && end >= 0; i++) {
      const batchEnd = end;
      const batchStart = Math.max(0, end - 19);
      batchPromises.push(getBlockList(batchStart, batchEnd).catch(() => []));
      end = batchStart - 1;
    }
    const batches = await Promise.all(batchPromises);
    for (const blocks of batches) {
      if (!Array.isArray(blocks)) continue;
      for (const b of blocks) {
        if (b.transactions?.length > 0 && found.length < count) {
          found.push(b);
        }
      }
    }
  }
  return found.sort((a, b) => b.number - a.number);
}

export async function getRecentTransactions(count: number = 50): Promise<any[]> {
  // Try REST endpoint first
  const result = await rest(`/recent_transactions?count=${count}`).catch(() => []);
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
  return scanRecentTransactions(count);
}

/** Scan blocks backwards to find transactions (fallback when REST index is empty). */
export async function scanRecentTransactions(count: number = 50): Promise<any[]> {
  const lastBlock = await getLastBlockNumber().catch(() => 0);
  if (!lastBlock) return [];

  const transactions: any[] = [];
  for (let end = lastBlock; end >= 0 && transactions.length < count; ) {
    // Fetch 8 batches of 20 blocks in parallel
    const batchPromises = [];
    for (let i = 0; i < 8 && end >= 0; i++) {
      const batchEnd = end;
      const batchStart = Math.max(0, end - 19);
      batchPromises.push(
        getBlockList(batchStart, batchEnd).catch(() => [])
      );
      end = batchStart - 1;
    }
    const batches = await Promise.all(batchPromises);

    const blocksWithTx: number[] = [];
    for (const blocks of batches) {
      if (!Array.isArray(blocks)) continue;
      for (const b of blocks) {
        if (b.transactions?.length > 0) blocksWithTx.push(b.number);
      }
    }
    blocksWithTx.sort((a, b) => b - a);

    const fullBlocks = await Promise.all(
      blocksWithTx.slice(0, count - transactions.length)
        .map((n) => getBlockByNumber(n, true).catch(() => null))
    );

    for (const block of fullBlocks) {
      if (!block?.transactions) continue;
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
  }
  return transactions.slice(0, count);
}

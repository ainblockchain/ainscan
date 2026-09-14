const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://devnet-api.ainetwork.ai/json-rpc';
const REST_BASE = RPC_URL.replace(/\/json-rpc$/, '');

/**
 * Read the chain through this app's own server instead of straight from the browser.
 *
 * A node only answers a browser when it was started with a CORS whitelist that includes the
 * explorer's origin. Public endpoints are, private and test chains usually are not, and asking an
 * operator to restart consensus nodes just to look at them is the wrong trade. With
 * NEXT_PUBLIC_RPC_PROXY=1 every read goes to /api/rpc and /api/rest here, which are same-origin,
 * so the node needs no CORS at all. Default is off, so public deployments keep talking to the
 * chain directly and no request passes through this server.
 */
const USE_PROXY = process.env.NEXT_PUBLIC_RPC_PROXY === '1' || process.env.NEXT_PUBLIC_RPC_PROXY === 'true';
const inBrowser = () => typeof window !== 'undefined';
const rpcEndpoint = () => (USE_PROXY && inBrowser() ? '/api/rpc' : RPC_URL);
const restUrl = (path: string) =>
  USE_PROXY && inBrowser() ? `/api/rest${path.startsWith('/') ? path : `/${path}`}` : `${REST_BASE}${path}`;

let requestId = 0;

const MAX_RETRIES = 3;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function rpc(method: string, params: Record<string, any> = {}): Promise<any> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const endpoint = rpcEndpoint();
    // /api/rpc takes { method, params } and fills in jsonrpc/id/protoVer itself.
    const payload = endpoint === '/api/rpc'
      ? { method, params }
      : { jsonrpc: '2.0', id: ++requestId, method, params: { protoVer: '1.0.0', ...params } };
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
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
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(restUrl(path), { cache: 'no-store' });
    if (res.status === 429 && attempt < MAX_RETRIES) {
      await sleep(1000 * (attempt + 1));
      continue;
    }
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
    for (let i = 0; i < 2 && end >= 0; i++) {
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
    for (let i = 0; i < 2 && end >= 0; i++) {
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

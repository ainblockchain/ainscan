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
  const json = await res.json();
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
  const json = await res.json();
  return json.result ?? json;
}

export async function getRecentBlocksWithTransactions(count: number = 10): Promise<any[]> {
  const result = await rest(`/recent_blocks_with_transactions?count=${count}`);
  return Array.isArray(result) ? result : [];
}

export async function getRecentTransactions(count: number = 50): Promise<any[]> {
  const result = await rest(`/recent_transactions?count=${count}`);
  return Array.isArray(result) ? result : [];
}

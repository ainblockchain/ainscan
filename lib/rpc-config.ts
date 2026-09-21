export function rpcEndpoint(): string {
  return process.env.AIN_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || 'http://3.89.93.84:8088/json-rpc';
}

export const EXPLORER_RPC_METHODS = new Set([
  'ain_get', 'ain_getBalance', 'ain_getNonce', 'ain_getBlockByHash', 'ain_getBlockByNumber',
  'ain_getBlockHeadersList', 'ain_getBlockList', 'ain_getBlockTransactionCountByNumber',
  'ain_getLastBlock', 'ain_getLastBlockNumber', 'ain_getTransactionByBlockNumberAndIndex',
  'ain_getTransactionByHash', 'ain_getValidatorInfo', 'ain_getValidatorsByNumber',
  'ain_matchFunction', 'ain_matchOwner', 'ain_matchRule',
  'net_consensusStatus', 'net_getNetworkId', 'net_peerCount',
]);

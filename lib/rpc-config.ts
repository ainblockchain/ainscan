import { NETWORKS, type Network } from './network';

// Optional per-network server-side overrides (e.g. a private gateway). There is
// deliberately no single-endpoint override: it would serve one chain under both
// network labels.
const RPC_URL_OVERRIDES: Record<Network, string | undefined> = {
  mainnet: process.env.AIN_MAINNET_RPC_URL,
  testnet: process.env.AIN_TESTNET_RPC_URL,
};

export function rpcEndpoint(network: Network): string {
  return RPC_URL_OVERRIDES[network] || NETWORKS[network].rpcUrl;
}

export const EXPLORER_RPC_METHODS = new Set([
  'ain_getLayerInfo', 'ain_listTransactions', 'ain_getIndexedTransaction',
  'ain_getStateChannel', 'ain_getStateChannelEvents', 'ain_getProofHash', 'ain_getStateProof',
  'ain_get', 'ain_getBalance', 'ain_getNonce', 'ain_getBlockByHash', 'ain_getBlockByNumber',
  'ain_getBlockHeadersList', 'ain_getBlockList', 'ain_getBlockTransactionCountByNumber',
  'ain_getLastBlock', 'ain_getLastBlockNumber', 'ain_getTransactionByBlockNumberAndIndex',
  'ain_getTransactionByHash', 'ain_getValidatorInfo', 'ain_getValidatorsByNumber',
  'ain_matchFunction', 'ain_matchOwner', 'ain_matchRule',
  'net_consensusStatus', 'net_getNetworkId', 'net_peerCount',
]);

// Shared by server, middleware and browser code: keep this module free of
// Node-only or next/headers imports.

export const NETWORKS = {
  mainnet: {
    label: 'Mainnet',
    chainId: 101,
    rpcUrl: 'https://mainnet-api.ainetwork.ai/json-rpc',
    eventUrl: 'wss://mainnet-event.ainetwork.ai',
  },
  testnet: {
    label: 'Testnet',
    chainId: 102,
    rpcUrl: 'https://testnet-api.ainetwork.ai/json-rpc',
    eventUrl: 'wss://testnet-event.ainetwork.ai',
  },
} as const;

export type Network = keyof typeof NETWORKS;

export const DEFAULT_NETWORK: Network = 'mainnet';
export const NETWORK_PARAM = 'network';
export const NETWORK_COOKIE = 'ainscan_network';
export const NETWORK_STORAGE_KEY = 'ainscan.network';

export function isNetwork(value: unknown): value is Network {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(NETWORKS, value);
}

/** Page searchParams / query values -> network; anything unknown falls back to mainnet. */
export function parseNetwork(value: string | string[] | null | undefined): Network {
  const first = Array.isArray(value) ? value[0] : value;
  return isNetwork(first) ? first : DEFAULT_NETWORK;
}

/**
 * Add (or, for the default network, remove) the `network` query parameter on an
 * internal href so links stay on the selected network. External hrefs are returned unchanged.
 */
export function withNetwork(href: string, network: Network): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  const url = new URL(href, 'http://ainscan.local');
  if (network === DEFAULT_NETWORK) url.searchParams.delete(NETWORK_PARAM);
  else url.searchParams.set(NETWORK_PARAM, network);
  return `${url.pathname}${url.search}${url.hash}`;
}

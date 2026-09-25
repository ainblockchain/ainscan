'use client';

import { createContext, useContext, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  DEFAULT_NETWORK,
  NETWORK_COOKIE,
  NETWORK_PARAM,
  NETWORK_STORAGE_KEY,
  isNetwork,
  parseNetwork,
  withNetwork,
  type Network,
} from '@/lib/network';

const NetworkContext = createContext<Network>(DEFAULT_NETWORK);

/** The network selected by the current URL (`?network=`), defaulting to mainnet. */
export function useNetwork(): Network {
  return useContext(NetworkContext);
}

export function readRememberedNetwork(): Network | null {
  try {
    const stored = window.localStorage.getItem(NETWORK_STORAGE_KEY);
    return isNetwork(stored) ? stored : null;
  } catch {
    return null;
  }
}

/** Persist the choice in localStorage and a cookie (the cookie lets middleware honour it on full page loads). */
export function rememberNetwork(network: Network) {
  try {
    window.localStorage.setItem(NETWORK_STORAGE_KEY, network);
  } catch {}
  try {
    document.cookie = `${NETWORK_COOKIE}=${network}; path=/; max-age=31536000; samesite=lax`;
  } catch {}
}

export default function NetworkProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const explicit = searchParams.get(NETWORK_PARAM);
  const network = parseNetwork(explicit);

  // An explicit ?network= (selector or shared link) becomes the remembered choice.
  useEffect(() => {
    if (isNetwork(explicit)) rememberNetwork(explicit);
  }, [explicit]);

  // Fallback for browsers whose cookie is missing but localStorage remembers a
  // non-default network: move to that network once on first load.
  useEffect(() => {
    if (explicit !== null) return;
    const remembered = readRememberedNetwork();
    if (remembered && remembered !== DEFAULT_NETWORK) {
      rememberNetwork(remembered);
      router.replace(withNetwork(`${pathname}?${searchParams.toString()}${window.location.hash}`, remembered));
    }
    // Only on mount: later in-app navigation already carries the network in its links.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <NetworkContext.Provider value={network}>{children}</NetworkContext.Provider>;
}

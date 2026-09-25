'use client';

import useSWR from 'swr';
import { rpc } from '@/lib/rpc';
import type { Network } from '@/lib/network';
import { useNetwork } from '@/components/NetworkProvider';

export function useRpc<T = any>(
  method: string,
  params?: Record<string, any>,
  refreshInterval?: number,
) {
  const network = useNetwork();
  // The network is part of the SWR key so cached results never cross networks.
  return useSWR<T>(
    [network, method, params],
    ([n, m, p]: [Network, string, Record<string, any> | undefined]) => rpc(n, m, p ?? {}),
    { refreshInterval },
  );
}

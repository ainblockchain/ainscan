'use client';

import useSWR from 'swr';
import { rpc } from '@/lib/rpc';

export function useRpc<T = any>(
  method: string,
  params?: Record<string, any>,
  refreshInterval?: number,
) {
  return useSWR<T>(
    [method, params],
    ([m, p]: [string, Record<string, any> | undefined]) => rpc(m, p ?? {}),
    { refreshInterval },
  );
}

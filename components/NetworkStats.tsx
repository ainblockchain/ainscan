'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { formatNumber } from '@/lib/utils';
import { getBlockList, getLastBlockNumber, getBlockByNumber } from '@/lib/rpc';
import { chainSnapshot } from '@/lib/chain-snapshot';

interface NetworkStatsProps {
  blockNumber: number | null;
  genesisHash: string | null;
  peerCount: number | null;
  consensusState: string | null;
}

export default function NetworkStats({
  blockNumber,
  peerCount,
  consensusState,
  genesisHash,
}: NetworkStatsProps) {
  const { data: snapshot, error } = useSWR('chain-throughput', () => chainSnapshot({
    genesis: () => getBlockByNumber(0, true), height: getLastBlockNumber, blocks: getBlockList,
  }), { refreshInterval: 3000, keepPreviousData: false });
  const changed = Boolean(snapshot && genesisHash && snapshot.genesisHash !== genesisHash);
  const throughput = !error && !changed ? snapshot?.throughput : null;
  const height = !error && !changed ? snapshot?.height ?? blockNumber : null;
  const visibleGenesis = error ? null : snapshot?.genesisHash ?? genesisHash;
  const stats = [
    { label: 'Block Height', value: height === null ? '-' : formatNumber(height) },
    {
      label: 'Peer Count',
      value: !changed && peerCount != null ? formatNumber(peerCount) : '-',
    },
    { label: 'Consensus', value: !changed ? consensusState || '-' : '-' },
    { label: 'On-chain TPS', value: !error && throughput ? throughput.tps.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '-',
      description: !error && throughput ? `${throughput.transactions} transactions / ${(throughput.elapsedMs / 1000).toLocaleString('en-US')} s · ${throughput.blocks} block intervals · block ${throughput.to} at ${new Date(throughput.timestamp).toISOString()}` : 'Waiting for a complete consecutive block window' },
  ];

  return (
    <section className="space-y-3">
      <div className="text-sm text-gray-500 break-all">Genesis Block: {visibleGenesis
        ? <Link href="/blocks/0" className="font-mono text-blue-600 hover:underline">{visibleGenesis}</Link>
        : 'Unavailable'}</div>
      {changed && <p role="alert" className="text-sm text-amber-700">The connected chain changed since this page loaded. Reload before interpreting block tables or network statistics.</p>}
      {error && <p role="alert" className="text-sm text-amber-700">Unable to verify the connected chain and block window. On-chain TPS is unavailable.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <dt className="text-sm font-medium text-gray-500">{stat.label}</dt>
            <dd className="mt-1 text-2xl font-semibold text-gray-900">
              {stat.value}
            </dd>
            {stat.description && <p className="mt-2 text-xs text-gray-500">{stat.description}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

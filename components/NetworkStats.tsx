'use client';

import useSWR from 'swr';
import Link from '@/components/NetworkLink';
import { formatNumber } from '@/lib/utils';
import { getBlockList, getLastBlockNumber, getBlockByNumber } from '@/lib/rpc';
import { chainSnapshot } from '@/lib/chain-snapshot';
import { useNetwork } from './NetworkProvider';

interface NetworkStatsProps {
  blockNumber: number | null;
  genesisHash: string | null;
  nodeCount: number | null;
  consensusState: string | null;
}

export default function NetworkStats({
  blockNumber,
  nodeCount,
  consensusState,
  genesisHash,
}: NetworkStatsProps) {
  const network = useNetwork();
  const { data: snapshot, error } = useSWR(['chain-throughput', network], ([, net]) => chainSnapshot({
    genesis: () => getBlockByNumber(net, 0, true),
    height: () => getLastBlockNumber(net),
    blocks: (from, to) => getBlockList(net, from, to),
  }), { refreshInterval: 3000, keepPreviousData: false });
  const changed = Boolean(snapshot && genesisHash && snapshot.genesisHash !== genesisHash);
  const throughput = !error && !changed ? snapshot?.throughput : null;
  const height = !error && !changed ? snapshot?.height ?? blockNumber : null;
  const visibleGenesis = error ? null : snapshot?.genesisHash ?? genesisHash;
  const stats = [
    { label: 'Block Height', value: height === null ? '-' : formatNumber(height) },
    {
      label: 'Node Count',
      description: 'Online blockchain nodes reported by the network tracker.',
      value: !changed && nodeCount != null ? formatNumber(nodeCount) : '-',
    },
    { label: 'Consensus', value: !changed ? consensusState || '-' : '-' },
    { label: 'Current L1 TPS', value: !error && throughput ? (throughput.tps === 0 ? 'No activity' : throughput.tps.toLocaleString('en-US', { maximumFractionDigits: 2 })) : '-',
      description: !error && throughput ? `${throughput.transactions} included chain transactions / ${(throughput.elapsedMs / 1000).toLocaleString('en-US')} s · ${throughput.blocks} block intervals · block ${throughput.to} at ${new Date(throughput.timestamp).toISOString()}` : 'Waiting for a complete consecutive block window' },
  ];

  return (
    <section aria-label="Current network activity" className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Current network activity</h2>
        <p className="text-sm text-gray-500">L1 activity across the latest 10 block intervals. This rolling average falls when traffic stops; completed run results above remain unchanged.</p>
      </div>
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

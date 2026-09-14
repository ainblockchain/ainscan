'use client';

import useSWR from 'swr';
import { formatNumber } from '@/lib/utils';
import { getBlockList, getLastBlockNumber } from '@/lib/rpc';
import { chainThroughput } from '@/lib/chain-throughput';

interface NetworkStatsProps {
  blockNumber: number;
  peerCount: number | null;
  consensusState: string | null;
}

export default function NetworkStats({
  blockNumber,
  peerCount,
  consensusState,
}: NetworkStatsProps) {
  const { data: throughput, error } = useSWR('chain-throughput', async () => {
    const latest = await getLastBlockNumber();
    if (!Number.isSafeInteger(latest) || latest < 1) return null;
    const blocks = await getBlockList(Math.max(0, latest - 10), latest + 1);
    const result = chainThroughput(blocks);
    if (result && result.to !== latest) throw new Error('Incomplete block window');
    return result;
  }, { refreshInterval: 3000, keepPreviousData: false });
  const stats = [
    { label: 'Block Height', value: formatNumber(throughput?.to ?? blockNumber) },
    {
      label: 'Peer Count',
      value: peerCount != null ? formatNumber(peerCount) : '-',
    },
    { label: 'Consensus', value: consensusState || '-' },
    { label: 'On-chain TPS', value: !error && throughput ? throughput.tps.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '-',
      description: !error && throughput ? `${throughput.transactions} transactions / ${(throughput.elapsedMs / 1000).toLocaleString('en-US')} s · ${throughput.blocks} block intervals · block ${throughput.to} at ${new Date(throughput.timestamp).toISOString()}` : 'Waiting for a complete consecutive block window' },
  ];

  return (
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
  );
}

import { formatNumber } from '@/lib/utils';

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
  const stats = [
    { label: 'Block Height', value: formatNumber(blockNumber) },
    {
      label: 'Peer Count',
      value: peerCount != null ? formatNumber(peerCount) : '-',
    },
    { label: 'Consensus', value: consensusState || '-' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-gray-200 bg-white p-4"
        >
          <dt className="text-sm font-medium text-gray-500">{stat.label}</dt>
          <dd className="mt-1 text-2xl font-semibold text-gray-900">
            {stat.value}
          </dd>
        </div>
      ))}
    </div>
  );
}

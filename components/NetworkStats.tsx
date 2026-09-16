'use client';

import useSWR from 'swr';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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
  const [tpsSamples, setTpsSamples] = useState<Array<{ timestamp: number; tps: number }>>([]);
  const { data: snapshot, error } = useSWR('chain-throughput', () => chainSnapshot({
    genesis: () => getBlockByNumber(0, true), height: getLastBlockNumber, blocks: getBlockList,
  }), { refreshInterval: 3000, keepPreviousData: false });
  const changed = Boolean(snapshot && genesisHash && snapshot.genesisHash !== genesisHash);
  const throughput = !error && !changed ? snapshot?.throughput : null;
  const height = !error && !changed ? snapshot?.height ?? blockNumber : null;
  const visibleGenesis = error ? null : snapshot?.genesisHash ?? genesisHash;
  useEffect(() => {
    if (!throughput) return;
    const sample = { timestamp: throughput.timestamp, tps: throughput.tps };
    setTpsSamples((current) => {
      const today = new Date(sample.timestamp).toISOString().slice(0, 10);
      const retained = current.filter((entry) => new Date(entry.timestamp).toISOString().slice(0, 10) === today);
      if (retained.some((entry) => entry.timestamp === sample.timestamp)) return retained;
      return [...retained, sample].slice(-2880);
    });
  }, [throughput]);
  const todayPeak = useMemo(() => tpsSamples.reduce((peak, sample) => Math.max(peak, sample.tps), 0), [tpsSamples]);
  const chartData = tpsSamples.map((sample) => ({
    time: new Date(sample.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    tps: Number(sample.tps.toFixed(2)),
  }));
  const stats = [
    { label: 'Block Height', value: height === null ? '-' : formatNumber(height) },
    {
      label: 'Direct Peer Count',
      value: !changed && peerCount != null ? (peerCount === 0 ? 'Disconnected' : formatNumber(peerCount)) : '-',
    },
    { label: 'Consensus', value: !changed ? consensusState || '-' : '-' },
    { label: 'On-chain TPS', value: !error && throughput ? (throughput.tps === 0 ? 'No activity' : throughput.tps.toLocaleString('en-US', { maximumFractionDigits: 2 })) : '-',
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
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Today&apos;s observed TPS peak</h2>
            <p className="text-xs text-gray-500">Samples collected while this explorer page is open</p>
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {chartData.length > 0 ? `${todayPeak.toLocaleString('en-US', { maximumFractionDigits: 2 })} TPS` : 'Waiting for data'}
          </div>
        </div>
        <div className="mt-4 h-48">
          {chartData.length > 0 ? <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="tpsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 11 }} minTickGap={24} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={48} />
              <Tooltip formatter={(value: number) => [`${value} TPS`, 'Throughput']} />
              <Area type="monotone" dataKey="tps" stroke="#2563eb" fill="url(#tpsGradient)" />
            </AreaChart>
          </ResponsiveContainer> : <div className="flex h-full items-center justify-center text-sm text-gray-500">No complete block window yet</div>}
        </div>
      </div>
    </section>
  );
}

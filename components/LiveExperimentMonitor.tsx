'use client';

import { useEffect, useState } from 'react';
import { getBlockByNumber, getLastBlockNumber } from '@/lib/rpc';

interface ExperimentBlock {
  number: number;
  hash?: string | null;
  transactionCount?: number;
  transactionHashes?: string[];
}

interface ExperimentSnapshot {
  runId: string;
  phase: string;
  updatedAt: number;
  targetTPS: number;
  currentTPS: number;
  averageTPS: number;
  peakTPS: number;
  measured: number;
  errors: number;
  nodeCount: number;
  latestBlock: ExperimentBlock | null;
}

interface ChainSnapshot {
  number: number;
  hash: string | null;
  transactionCount: number;
  transactionHashes: string[];
}

function number(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
}

function txs(block: any): string[] {
  if (!Array.isArray(block?.transactions)) return [];
  return block.transactions.map((transaction: any) => transaction?.hash).filter(Boolean).slice(0, 20);
}

export default function LiveExperimentMonitor() {
  const [experiment, setExperiment] = useState<ExperimentSnapshot | null>(null);
  const [chain, setChain] = useState<ChainSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const response = await fetch('/api/experiment/status', { cache: 'no-store' });
        const status = await response.json();
        if (active) setExperiment(status.status === 'waiting' ? null : status);
      } catch (pollError) {
        if (active) setError(pollError instanceof Error ? pollError.message : 'status unavailable');
      }
    };
    poll();
    const timer = window.setInterval(poll, 1000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const latest = await getLastBlockNumber();
        const block = await getBlockByNumber(latest, true);
        const hashes = txs(block);
        if (active) setChain({ number: latest, hash: block?.hash || null, transactionCount: hashes.length, transactionHashes: hashes });
      } catch (pollError) {
        if (active) setError(pollError instanceof Error ? pollError.message : 'chain unavailable');
      }
    };
    poll();
    const timer = window.setInterval(poll, 3000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const block = experiment?.latestBlock || chain;
  const hashes = experiment?.latestBlock?.transactionHashes || chain?.transactionHashes || [];

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 space-y-4" aria-label="Live TPS monitor">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Live TPS Monitor</h2>
          <p className="text-xs text-gray-500">P2P experiment status and live chain block/transaction data</p>
        </div>
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${experiment ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
          {experiment ? `${experiment.phase} · ${experiment.nodeCount} nodes` : 'waiting for experiment'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div><dt className="text-xs text-gray-500">Current TPS</dt><dd className="text-xl font-semibold text-gray-900">{experiment ? number(experiment.currentTPS) : '-'}</dd></div>
        <div><dt className="text-xs text-gray-500">Average TPS</dt><dd className="text-xl font-semibold text-gray-900">{experiment ? number(experiment.averageTPS) : '-'}</dd></div>
        <div><dt className="text-xs text-gray-500">Peak TPS</dt><dd className="text-xl font-semibold text-gray-900">{experiment ? number(experiment.peakTPS) : '-'}</dd></div>
        <div><dt className="text-xs text-gray-500">Target</dt><dd className="text-xl font-semibold text-gray-900">{experiment ? number(experiment.targetTPS) : '7,000'}</dd></div>
      </div>

      <div className="grid grid-cols-1 gap-3 border-t border-gray-100 pt-3 sm:grid-cols-3">
        <div><dt className="text-xs text-gray-500">Run / measured</dt><dd className="mt-1 truncate text-sm text-gray-800">{experiment ? `${experiment.runId} / ${number(experiment.measured)}` : '-'}</dd></div>
        <div><dt className="text-xs text-gray-500">Latest block</dt><dd className="mt-1 text-sm text-gray-800">{block ? `${number(block.number)} · ${block.transactionCount || 0} tx` : '-'}</dd></div>
        <div><dt className="text-xs text-gray-500">Errors / updated</dt><dd className="mt-1 text-sm text-gray-800">{experiment ? `${experiment.errors} · ${new Date(experiment.updatedAt).toLocaleTimeString()}` : '-'}</dd></div>
      </div>

      {block?.hash && <p className="truncate font-mono text-xs text-gray-500">Block hash: {block.hash}</p>}
      {hashes.length > 0 && (
        <div className="border-t border-gray-100 pt-3">
          <p className="mb-2 text-xs font-medium text-gray-500">Latest transaction hashes</p>
          <div className="flex flex-wrap gap-2">
            {hashes.map((hash) => <code key={hash} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">{hash}</code>)}
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </section>
  );
}

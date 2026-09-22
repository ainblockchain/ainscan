'use client';
import useSWR from 'swr';
import Link from 'next/link';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BenchmarkStatus, benchmarkIsStale } from '@/lib/benchmark-status';
const number = (n: number | null | undefined) => n == null ? '—' : n.toLocaleString('en-US', {maximumFractionDigits: 2});
export default function BenchmarkStats() {
  const {data, error} = useSWR('/api/benchmarks', async url => {
    const response = await fetch(url, {cache: 'no-store'});
    if (!response.ok) throw new Error('Benchmark feed unavailable');
    return response.json() as Promise<{genesisHash: string; l1: BenchmarkStatus | null; l2_peer: BenchmarkStatus | null}>;
  }, {refreshInterval: 3000});
  return <section aria-label="L1 and L2 benchmark throughput" className="space-y-3">
    <div>
      <h2 className="text-lg font-semibold text-gray-900">Latest benchmark results</h2>
      <p className="text-sm text-gray-500">Updates during each run, then retains its final result. L1 shows the peak TPS; L2 shows the average TPS.</p>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    {(['l1','l2_peer'] as const).map(kind => {
      const value = data?.[kind];
      const stale = value ? benchmarkIsStale(value) : false;
      const unavailable = Boolean(error) || stale;
      const completed = value?.phase === 'completed';
      const label = kind === 'l2_peer' ? 'L2 peer TPS' : 'L1 peak TPS';
      const status = error ? 'Feed unavailable' : !value ? 'No recorded run' : stale ? 'Updates interrupted' :
        ({starting: 'Preparing', running: 'Live', verifying: 'Verifying receipts', completed: 'Completed · checkpoint finalized', failed: 'Run failed'})[value.phase];
      return <div key={kind} className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        <div className="flex flex-wrap justify-between gap-2"><h2 className="text-lg font-semibold text-gray-900">{label}</h2>
          <span className={`text-xs rounded-full px-2 py-1 ${completed && !unavailable ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{status}</span></div>
        <div className="text-3xl font-semibold text-gray-900">{unavailable ? '—' : number(kind === 'l1' ? value?.peakTPS : value?.averageTPS)} <span className="text-sm font-normal">TPS</span></div>
        <p className="text-xs text-gray-500">{kind === 'l1' ? 'Observed maximum per block interval' : completed ? 'Final average' : 'Average so far'} · {kind === 'l2_peer' ? 'Signed peer transfers acknowledged after durable persistence' : value?.source === 'l2_checkpoints' ? 'L2 state checkpoints included in independently verified finalized L1 blocks' : 'Successful transactions included in independently verified finalized blocks'}</p>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>Current<br/><strong>{!unavailable && value?.phase === 'running' ? number(value.currentTPS) : '—'}</strong></div>
          <div>{kind === 'l2_peer' ? 'Peak / 1 s' : 'Average'}<br/><strong>{unavailable ? '—' : number(kind === 'l1' ? value?.averageTPS : value?.peakTPS)}</strong></div>
          <div>Counted transfers<br/><strong>{unavailable ? '—' : number(value?.measured)}</strong></div>
        </div>
        {value && <>
          <p className="text-xs text-gray-500">Window: {number(value.elapsedMs / 1000)} s · {kind === 'l1' ? 'Commit failures' : 'Failures'}: {number(value.failures)}</p>
          {kind === 'l1' && value.rejected !== undefined && <p className="text-xs text-gray-500">Rejected submissions: {number(value.rejected)} · Pending: {number(value.pending)} · Unknown outcomes: {number(value.unknown)}</p>}
          {value.samples.length > 0 && <div className="h-36"><ResponsiveContainer width="100%" height="100%"><AreaChart data={value.samples.map((tps, i) => ({sample: i+1, tps}))}>
            <XAxis dataKey="sample" tick={{fontSize: 10}}/><YAxis width={52} tick={{fontSize: 10}}/><Tooltip formatter={(v: number) => [`${number(v)} TPS`, label]}/>
            <Area dataKey="tps" stroke={kind === 'l2_peer' ? '#7c3aed' : '#2563eb'} fill={kind === 'l2_peer' ? '#ede9fe' : '#dbeafe'} isAnimationActive={false}/>
          </AreaChart></ResponsiveContainer></div>}
          <p className="text-xs text-gray-500 break-all">Run: {value.runId}<br/>{completed ? 'Completed' : 'Updated'}: {value.completedAt && completed ? value.completedAt : value.updatedAt}</p>
          {value.checkpointTx && <Link className="text-xs text-blue-600 hover:underline" href={`/transactions/${value.checkpointTx}`}>View checkpoint transaction</Link>}
        </>}
      </div>;
    })}
    </div>
  </section>;
}

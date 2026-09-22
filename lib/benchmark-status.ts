export interface BenchmarkStatus {
  version: number; kind: 'l2_peer' | 'l1'; runId: string; genesisHash: string;
  phase: 'starting' | 'running' | 'verifying' | 'completed' | 'failed';
  updatedAt: string; completedAt: string | null; startedAt?: string;
  averageTPS: number | null; peakTPS: number | null; currentTPS: number | null;
  measured: number; elapsedMs: number; failures: number; samples: number[];
  finalized: boolean; checkpointTx: string | null; checkpointBlock: number | null; performancePass?: boolean;
}
export function validBenchmark(value: unknown, kind: string, genesis: string): value is BenchmarkStatus {
  if (!value || typeof value !== 'object') return false;
  const v = value as BenchmarkStatus;
  const nonnegative = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0;
  if (v.version !== 1 || v.kind !== kind || v.genesisHash !== genesis || !/^[A-Za-z0-9_-]+$/.test(v.runId)
    || !['starting','running','verifying','completed','failed'].includes(v.phase)
    || !Number.isFinite(Date.parse(v.updatedAt)) || ![v.measured,v.elapsedMs,v.failures].every(nonnegative)
    || ![v.averageTPS,v.peakTPS,v.currentTPS].every(n => n === null || nonnegative(n))
    || !Array.isArray(v.samples) || v.samples.length > 3600 || !v.samples.every(nonnegative)) return false;
  if (v.phase === 'completed' && (!v.finalized || !/^0x[a-fA-F0-9]{64}$/.test(v.checkpointTx || '')
    || !Number.isSafeInteger(v.checkpointBlock) || v.checkpointBlock! < 0
    || !v.completedAt || !Number.isFinite(Date.parse(v.completedAt)))) return false;
  return v.averageTPS === null || (v.elapsedMs > 0 && Math.abs(v.averageTPS - v.measured * 1000 / v.elapsedMs) < 0.01);
}
export function benchmarkIsStale(value: BenchmarkStatus, now = Date.now()) {
  return ['starting','running','verifying'].includes(value.phase) && now - Date.parse(value.updatedAt) > 30000;
}

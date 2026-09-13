export interface ExperimentBlock {
  number: number;
  hash?: string | null;
  transactionCount?: number;
  transactionHashes?: string[];
}

export interface ExperimentStatus {
  runId: string;
  nodeId: string;
  phase: string;
  updatedAt: number;
  targetTPS?: number;
  currentTPS?: number;
  averageTPS?: number;
  peakTPS?: number;
  measured?: number;
  errors?: number;
  block?: ExperimentBlock | null;
}

export interface ExperimentSnapshot {
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
  nodes: ExperimentStatus[];
  latestBlock: ExperimentBlock | null;
}

const MAX_AGE_MS = 5 * 60 * 1000;
const globalState = globalThis as typeof globalThis & {
  __ainScanExperimentStatus?: Map<string, Map<string, ExperimentStatus>>;
};
const statuses = globalState.__ainScanExperimentStatus ?? new Map<string, Map<string, ExperimentStatus>>();
globalState.__ainScanExperimentStatus = statuses;

function finite(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function cleanBlock(value: unknown): ExperimentBlock | null {
  if (!value || typeof value !== 'object') return null;
  const block = value as Record<string, unknown>;
  const number = finite(block.number, -1);
  if (!Number.isInteger(number) || number < 0) return null;
  const hashes = Array.isArray(block.transactionHashes)
    ? block.transactionHashes.filter((hash): hash is string => typeof hash === 'string').slice(0, 100)
    : [];
  return {
    number,
    hash: typeof block.hash === 'string' ? block.hash.slice(0, 200) : null,
    transactionCount: Math.max(0, Math.floor(finite(block.transactionCount, hashes.length))),
    transactionHashes: hashes,
  };
}

export function recordExperimentStatus(input: Record<string, unknown>): ExperimentStatus {
  const runId = String(input.runId || '').slice(0, 100);
  const nodeId = String(input.nodeId || '').slice(0, 100);
  if (!runId || !nodeId) throw new Error('runId and nodeId are required');
  const status: ExperimentStatus = {
    runId,
    nodeId,
    phase: String(input.phase || 'unknown').slice(0, 40),
    updatedAt: Date.now(),
    targetTPS: Math.max(0, finite(input.targetTPS, 7000)),
    currentTPS: Math.max(0, finite(input.currentTPS)),
    averageTPS: Math.max(0, finite(input.averageTPS)),
    peakTPS: Math.max(0, finite(input.peakTPS)),
    measured: Math.max(0, Math.floor(finite(input.measured))),
    errors: Math.max(0, Math.floor(finite(input.errors))),
    block: cleanBlock(input.block),
  };
  let run = statuses.get(runId);
  if (!run) {
    run = new Map<string, ExperimentStatus>();
    statuses.set(runId, run);
  }
  run.set(nodeId, status);
  return status;
}

export function getExperimentSnapshot(runId?: string): ExperimentSnapshot | null {
  const now = Date.now();
  statuses.forEach((run, id) => {
    run.forEach((status, nodeId) => {
      if (now - status.updatedAt > MAX_AGE_MS) run.delete(nodeId);
    });
    if (!run.size) statuses.delete(id);
  });
  let selected = runId ? statuses.get(runId) : undefined;
  if (!selected && !runId) {
    selected = Array.from(statuses.values()).sort((left, right) => {
      const leftLatest = Math.max(...Array.from(left.values()).map((status) => status.updatedAt));
      const rightLatest = Math.max(...Array.from(right.values()).map((status) => status.updatedAt));
      return rightLatest - leftLatest;
    })[0];
  }
  if (!selected?.size) return null;
  const nodes = Array.from(selected.values());
  const latestBlock = nodes.filter((status) => status.block).map((status) => status.block!)
    .sort((left, right) => right.number - left.number)[0] || null;
  const newest = nodes.reduce((latest, status) => status.updatedAt > latest.updatedAt ? status : latest, nodes[0]);
  return {
    runId: newest.runId,
    phase: nodes.some((status) => status.phase === 'running') ? 'running' : newest.phase,
    updatedAt: Math.max(...nodes.map((status) => status.updatedAt)),
    targetTPS: Math.max(...nodes.map((status) => status.targetTPS || 7000)),
    currentTPS: nodes.reduce((total, status) => total + (status.currentTPS || 0), 0),
    averageTPS: nodes.reduce((total, status) => total + (status.averageTPS || 0), 0),
    peakTPS: nodes.reduce((total, status) => total + (status.peakTPS || 0), 0),
    measured: nodes.reduce((total, status) => total + (status.measured || 0), 0),
    errors: nodes.reduce((total, status) => total + (status.errors || 0), 0),
    nodeCount: nodes.length,
    nodes,
    latestBlock,
  };
}

export interface TrainingRecord {
  path: string;
  jobId: string;
  nodeId: string;
  datasetId: string | null;
  status: string | null;
  backend: string | null;
  submittedAt: number | null;
}

export function trainingRecord(operation: unknown): TrainingRecord | null {
  if (!operation || typeof operation !== 'object') return null;
  const input = operation as Record<string, unknown>;
  if (input.type !== 'SET_VALUE' || typeof input.ref !== 'string') return null;
  const match = /^\/apps\/knowledge\/market\/lessons\/([^/]+)\/([^/]+)$/.exec(input.ref);
  if (!match || !input.value || typeof input.value !== 'object' || Array.isArray(input.value)) return null;
  const value = input.value as Record<string, unknown>;
  return {
    path: input.ref, nodeId: match[1], jobId: match[2],
    datasetId: typeof value.dataset_id === 'string' ? value.dataset_id : null,
    status: typeof value.status === 'string' ? value.status : null,
    backend: typeof value.backend === 'string' ? value.backend : null,
    submittedAt: typeof value.submitted_at === 'number' && Number.isSafeInteger(value.submitted_at) && value.submitted_at > 0 ? value.submitted_at : null,
  };
}

export function trainingRecordLatency(record: TrainingRecord, block: unknown, txHash: string): number | null {
  if (record.submittedAt === null || !block || typeof block !== 'object') return null;
  const value = block as Record<string, unknown>;
  if (typeof value.timestamp !== 'number' || !Number.isSafeInteger(value.timestamp)
    || value.timestamp < record.submittedAt || !Array.isArray(value.transactions)) return null;
  const included = value.transactions.some(transaction => typeof transaction === 'string' ? transaction === txHash
    : transaction && typeof transaction === 'object' && transaction.hash === txHash);
  return included ? value.timestamp - record.submittedAt : null;
}

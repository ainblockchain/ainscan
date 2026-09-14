export interface TrainingRecord {
  path: string;
  jobId: string;
  nodeId: string;
  datasetId: string | null;
  datasetSha256: string | null;
  rows: number | null;
  patchId: string | null;
  patchSha256: string | null;
  status: string | null;
  backend: string | null;
  modelId: string | null;
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
    datasetSha256: typeof value.dataset_sha256 === 'string' && /^[a-f0-9]{64}$/i.test(value.dataset_sha256) ? value.dataset_sha256 : null,
    rows: typeof value.rows === 'number' && Number.isSafeInteger(value.rows) && value.rows >= 0 ? value.rows : null,
    patchId: typeof value.patch_id === 'string' ? value.patch_id : null,
    patchSha256: typeof value.sha256 === 'string' && /^[a-f0-9]{64}$/i.test(value.sha256) ? value.sha256 : null,
    status: typeof value.status === 'string' ? value.status : null,
    backend: typeof value.backend === 'string' ? value.backend : null,
    modelId: typeof value.model_id === 'string' && value.model_id.trim() && value.model_id.length <= 512 ? value.model_id : null,
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

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
    submittedAt: typeof value.submitted_at === 'number' && Number.isSafeInteger(value.submitted_at) && value.submitted_at > 0 && value.submitted_at <= 8640000000000000 ? value.submitted_at : null,
  };
}

/**
 * How long the record took to reach the chain: from the submission time it carries to the moment the
 * block holding it was SEALED.
 *
 * A block's own `timestamp` is when its proposer started building it, and transactions keep arriving
 * into that block for the next second or two — so a record's `submittedAt` is routinely LATER than the
 * timestamp of the very block that carries it. Subtracting the two gave a negative number and this
 * function returned `Unavailable` for it, which is how a real 1.8-second latency read as "no data" on
 * a chain where 48 of 70 records were in exactly that position.
 *
 * `sealedAt` is the next block's timestamp — when this block stopped accepting and the next began.
 * Without it there is no arrival time to report, and the answer is null rather than a guess.
 */
export function trainingRecordLatency(
  record: TrainingRecord, block: unknown, txHash: string, sealedAt?: number | null,
): number | null {
  if (record.submittedAt === null || !block || typeof block !== 'object') return null;
  const value = block as Record<string, unknown>;
  if (typeof value.timestamp !== 'number' || !Number.isSafeInteger(value.timestamp)
    || !Array.isArray(value.transactions)) return null;
  const included = value.transactions.some(transaction => typeof transaction === 'string' ? transaction === txHash
    : transaction && typeof transaction === 'object' && transaction.hash === txHash);
  if (!included) return null;
  if (typeof sealedAt !== 'number' || !Number.isSafeInteger(sealedAt)) return null;
  const latency = sealedAt - record.submittedAt;
  return latency >= 0 ? latency : null;
}

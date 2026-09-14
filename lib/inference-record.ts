export interface InferenceRecord {
  path: string;
  nodeId: string;
  modelId: string;
  requestCount: number;
  startedAt: number;
  finishedAt: number;
  receiptRoot: string;
  requestsPerSecond: number;
}

export function inferenceRecord(operation: unknown): InferenceRecord | null {
  if (!operation || typeof operation !== 'object') return null;
  const input = operation as Record<string, unknown>;
  if (input.type !== 'SET_VALUE' || typeof input.ref !== 'string') return null;
  const match = /^\/apps\/knowledge\/market\/inference_batches\/(0x[a-fA-F0-9]{40})\/([a-f0-9]{64})$/.exec(input.ref);
  if (!match || !input.value || typeof input.value !== 'object' || Array.isArray(input.value)) return null;
  const value = input.value as Record<string, unknown>;
  const fields = ['version', 'node', 'model_id', 'request_count', 'started_at', 'finished_at', 'receipt_root'];
  if (Object.keys(value).length !== fields.length || Object.keys(value).some(key => !fields.includes(key))
    || value.version !== 1 || value.node !== match[1]
    || typeof value.model_id !== 'string' || !value.model_id.trim() || value.model_id.length > 512
    || typeof value.request_count !== 'number' || !Number.isSafeInteger(value.request_count) || value.request_count < 1
    || typeof value.started_at !== 'number' || !Number.isSafeInteger(value.started_at) || value.started_at <= 0
    || typeof value.finished_at !== 'number' || !Number.isSafeInteger(value.finished_at)
    || value.finished_at <= value.started_at || value.finished_at > 8640000000000000
    || typeof value.receipt_root !== 'string' || !/^[a-f0-9]{64}$/.test(value.receipt_root)) return null;
  return {
    path: input.ref, nodeId: match[1], modelId: value.model_id,
    requestCount: value.request_count, startedAt: value.started_at, finishedAt: value.finished_at,
    receiptRoot: value.receipt_root,
    requestsPerSecond: value.request_count / (value.finished_at - value.started_at) * 1000,
  };
}

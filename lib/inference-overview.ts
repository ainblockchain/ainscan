import { inferenceRecord, type InferenceRecord } from './inference-record';

export const INFERENCE_ROOT = '/apps/knowledge/market/inference_batches';

export function inferenceOverview(publisher: string, value: unknown) {
  if (!/^0x[a-fA-F0-9]{40}$/.test(publisher)) throw new Error('Invalid inference publisher');
  if (value !== null && (!value || typeof value !== 'object' || Array.isArray(value))) throw new Error('Invalid inference state');
  const entries = Object.entries(value ?? {});
  const records: InferenceRecord[] = [];
  let skipped = 0;
  for (const [batch, value] of entries.slice(0, 1000)) {
    const record = inferenceRecord({ type: 'SET_VALUE', ref: `${INFERENCE_ROOT}/${publisher}/${batch}`, value });
    if (record) records.push(record);
    else skipped++;
  }
  records.sort((left, right) => right.finishedAt - left.finishedAt || left.path.localeCompare(right.path));
  return { records, skipped, truncated: entries.length > 1000, models: new Set(records.map(record => record.modelId)).size };
}

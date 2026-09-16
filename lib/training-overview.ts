import { trainingRecord, type TrainingRecord } from './training-record';

export const LESSONS_ROOT = '/apps/knowledge/market/lessons';

export function validPublisher(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value);
}

export function trainingOverview(publisher: string, value: unknown) {
  if (!validPublisher(publisher)) throw new Error('Invalid publisher');
  if (value !== null && (!value || typeof value !== 'object' || Array.isArray(value))) throw new Error('Invalid lesson state');
  const entries = Object.entries(value ?? {});
  const records: TrainingRecord[] = [];
  let skipped = 0;
  for (const [jobId, record] of entries.slice(0, 1000)) {
    if (!validPublisher(jobId) || !record || typeof record !== 'object' || '#state_ph' in record) {
      skipped++;
      continue;
    }
    const lesson = trainingRecord({ type: 'SET_VALUE', ref: `${LESSONS_ROOT}/${publisher}/${jobId}`, value: record });
    if (!lesson || !lesson.status || !lesson.datasetId) {
      skipped++;
      continue;
    }
    records.push(lesson);
  }
  return { records, skipped, truncated: entries.length > 1000,
    backends: {
      gradient: records.filter(record => record.backend === 'gradient').length,
      stub: records.filter(record => record.backend === 'stub').length,
      otherOrUnknown: records.filter(record => record.backend !== 'gradient' && record.backend !== 'stub').length,
    },
    datasets: new Set(records.map(record => record.datasetId)).size,
    models: new Set(records.flatMap(record => record.modelId ? [record.modelId] : [])).size,
    training: records.filter(record => record.status === 'TRAINING').length };
}

import { transactionOperations } from '@/lib/transaction-operations';
import { trainingRecord } from '@/lib/training-record';
import { inferenceRecord } from '@/lib/inference-record';
import { transactionChannels, transactionEscrows } from '@/lib/state-channel';

function preview(value: string): string {
  return value.length > 120 ? `${value.slice(0, 120)}…` : value;
}

export default function NativeRecordSummary({ operation, compact = false }: { operation: unknown; compact?: boolean }) {
  const tree = transactionOperations(operation);
  const lessons = tree.entries.flatMap(entry => {
    const record = trainingRecord(entry.operation);
    return record ? [record] : [];
  });
  const batches = tree.entries.flatMap(entry => {
    const record = inferenceRecord(entry.operation);
    return record ? [record] : [];
  });
  const channels = transactionChannels(operation);
  const escrows = transactionEscrows(operation);
  const counts = [
    ['Training writes', lessons.length], ['Inference batches', batches.length],
    ['State channel references', channels.length], ['Escrow references', escrows.length],
  ] as const;
  const labels = counts.filter(([, count]) => count > 0);
  if (!labels.length && !tree.truncated) return <span className="text-gray-400">-</span>;
  const lesson = lessons[0];
  const batch = batches[0];
  return <div className="max-w-xs space-y-1 text-xs text-gray-600">
    {labels.map(([label, count]) => <div key={label}>{label}: {count.toLocaleString('en-US')}</div>)}
    {!compact && lesson && <div className="break-all">
      <div>Job: {preview(lesson.jobId)}</div>
      {lesson.status && <div>Status (reported): {preview(lesson.status)}</div>}
      {lesson.datasetId && <div>Dataset: {preview(lesson.datasetId)}</div>}
      {lesson.modelId && <div>Model (reported): {preview(lesson.modelId)}</div>}
    </div>}
    {!compact && batch && <div className="break-all">Inference model (reported): {preview(batch.modelId)}</div>}
    {!compact && (lessons.length > 1 || batches.length > 1) && <div>First record per type shown; open the transaction for more.</div>}
    {tree.truncated && <div className="text-amber-700">Partial operation inspection</div>}
    <div className="text-gray-500">Submitted operations, not verified outcomes.</div>
  </div>;
}

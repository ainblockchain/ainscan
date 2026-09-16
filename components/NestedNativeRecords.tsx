import Link from 'next/link';
import CopyButton from './CopyButton';
import { transactionOperations } from '@/lib/transaction-operations';
import { trainingRecord, trainingRecordLatency } from '@/lib/training-record';
import { inferenceRecord } from '@/lib/inference-record';

export default function NestedNativeRecords({ operation, block, txHash, sealedAt }: { operation: unknown; block: unknown; txHash: string; sealedAt?: number | null }) {
  const tree = transactionOperations(operation);
  const records = tree.entries.filter(entry => entry.position !== 'operation').flatMap(entry => {
    const lesson = trainingRecord(entry.operation);
    const inference = inferenceRecord(entry.operation);
    if (!lesson && !inference) return [];
    const path = (lesson ?? inference)!.path;
    const latency = lesson ? trainingRecordLatency(lesson, block, txHash, sealedAt) : null;
    const fields: [string, string][] = lesson ? [
      ['Training Job', lesson.jobId], ['Training Status', lesson.status ?? '-'],
      ['Dataset', lesson.datasetId ?? '-'], ['Dataset SHA-256', lesson.datasetSha256 ?? '-'],
      ['Training Rows (reported)', lesson.rows?.toLocaleString('en-US') ?? '-'],
      ['Model ID (trainer-reported)', lesson.modelId ?? '-'], ['Training Backend', lesson.backend ?? '-'],
      ['Knowledge / Draft ID', lesson.patchId ?? '-'], ['Knowledge SHA-256', lesson.patchSha256 ?? '-'],
      ['Submitted At (reported)', lesson.submittedAt === null ? '-' : new Date(lesson.submittedAt).toISOString()],
      ['Training Record Latency', latency === null ? 'Unavailable' : `${latency.toLocaleString('en-US')} ms`],
    ] : [
      ['Inference Model (reported)', inference!.modelId],
      ['Completed Requests (reported)', inference!.requestCount.toLocaleString('en-US')],
      ['Interval Start (reported)', new Date(inference!.startedAt).toISOString()],
      ['Interval End (reported)', new Date(inference!.finishedAt).toISOString()],
      ['Inference Requests / Second (reported)', inference!.requestsPerSecond.toLocaleString('en-US', { maximumFractionDigits: 3 })],
      ['Receipt Commitment (unverified)', inference!.receiptRoot],
    ];
    return [{ position: entry.position, path, fields, title: lesson
      ? `Training ${lesson.jobId} · ${lesson.status ?? 'Unknown'} · ${latency === null ? 'Latency unavailable' : `${latency.toLocaleString('en-US')} ms`}`
      : `Inference ${inference!.modelId} · ${inference!.requestCount.toLocaleString('en-US')} reported requests` }];
  });
  if (!records.length && !tree.truncated) return null;
  return <section className="space-y-3">
    <h2 className="text-xl font-semibold text-gray-900">Batched Native Records</h2>
    <p className="text-sm text-gray-500">Each item is a reported write within this transaction, not an independently verified job or proof of simultaneous training. Latency uses the reported submission time and the moment the containing block was sealed, read as the next block&apos;s timestamp — a block&apos;s own timestamp is when its proposer began building it, so records submitted into that same block carry a later time than it does. Inference rates are not onchain TPS and must not be added across overlapping intervals. Inclusion alone does not establish execution success, model quality or receipt coverage.</p>
    {tree.truncated && <p className="text-sm text-amber-700">Operation inspection reached its 1,000-item or 32-level safety limit. The list may be incomplete; inspect the raw operation below.</p>}
    {records.length > 100 && <p className="text-sm text-amber-700">Showing the first 100 recognized records. The remaining records are available in the raw operation below.</p>}
    {records.slice(0, 100).map(record => <details key={record.position} className="rounded-lg border border-gray-200 bg-white" open={records.length === 1}>
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-900 break-all">{record.position}: {record.title}</summary>
      <dl className="divide-y divide-gray-200">
        {record.fields.map(([label, value]) => <div key={label} className="px-4 py-3 sm:grid sm:grid-cols-4 sm:gap-4">
          <dt className="text-sm font-medium text-gray-500">{label}</dt>
          <dd className="mt-1 sm:mt-0 sm:col-span-3 text-sm text-gray-900 break-all">{value}</dd>
        </div>)}
        <div className="px-4 py-3 sm:grid sm:grid-cols-4 sm:gap-4">
          <dt className="text-sm font-medium text-gray-500">Record Path</dt>
          <dd className="mt-1 sm:mt-0 sm:col-span-3 text-sm flex items-center">
            <Link className="font-mono text-blue-600 hover:underline break-all" href={`/database${record.path.split('/').map(encodeURIComponent).join('/')}`}>{record.path}</Link>
            <CopyButton text={record.path} />
          </dd>
        </div>
      </dl>
    </details>)}
  </section>;
}

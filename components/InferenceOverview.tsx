import Link from '@/components/NetworkLink';
import { getValue } from '@/lib/rpc';
import { INFERENCE_ROOT, inferenceOverview } from '@/lib/inference-overview';
import type { Network } from '@/lib/network';

export default async function InferenceOverview({ network, publisher }: { network: Network; publisher?: string }) {
  if (!publisher || !/^0x[a-fA-F0-9]{40}$/.test(publisher)) return null;
  let overview: ReturnType<typeof inferenceOverview> | null = null;
  try {
    overview = inferenceOverview(publisher, await getValue(network, `${INFERENCE_ROOT}/${publisher}`));
  } catch {}
  return <section className="space-y-4 mb-8" id="inference-records">
    <h2 className="text-xl font-semibold text-gray-900">Inference Records</h2>
    <p className="text-sm text-gray-500">Native inference batches for the selected publisher. Rates and model names are sender-reported. These are not blockchain TPS, verified model support or an independently measured client load test.</p>
    <Link href={`/database${INFERENCE_ROOT}/${publisher}`} className="text-sm text-blue-600 hover:underline">Browse Native Inference State</Link>
    {overview === null ? <p role="alert" className="text-sm text-red-600">Inference state unavailable. No counts or rates are inferred from this failed query.</p> : <>
      <dl className="grid grid-cols-2 gap-4">
        <div className="rounded border border-gray-200 p-4"><dt className="text-sm text-gray-500">Loaded Batches</dt><dd className="text-2xl font-bold text-gray-900">{overview.records.length.toLocaleString('en-US')}</dd></div>
        <div className="rounded border border-gray-200 p-4"><dt className="text-sm text-gray-500">Inference Model IDs (reported)</dt><dd className="text-2xl font-bold text-gray-900">{overview.models.toLocaleString('en-US')}</dd></div>
      </dl>
      {(overview.truncated || overview.skipped > 0) && <p className="text-sm text-amber-700">Partial summary: at most 1,000 entries are inspected; {overview.skipped} malformed or shallow entries were skipped. This is not a network-wide count.</p>}
      {!overview.records.length ? <p className="text-sm text-gray-500">No recognized inference batches in this response.</p> : <div className="overflow-x-auto rounded border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50"><tr>{['Batch / Native State', 'Model (reported)', 'Completed Requests (reported)', 'Interval Start', 'Interval End', 'Requests / Second (reported)'].map(label => <th key={label} className="px-4 py-3 text-left font-medium text-gray-500">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-200">{overview.records.slice(0, 100).map(record => <tr key={record.path}>
            <td className="px-4 py-3"><Link href={`/database${record.path}`} className="text-blue-600 hover:underline break-all">{record.path.split('/').at(-1)}</Link></td>
            <td className="px-4 py-3 break-all">{record.modelId}</td><td className="px-4 py-3">{record.requestCount.toLocaleString('en-US')}</td>
            <td className="px-4 py-3">{new Date(record.startedAt).toISOString()}</td><td className="px-4 py-3">{new Date(record.finishedAt).toISOString()}</td>
            <td className="px-4 py-3">{record.requestsPerSecond.toLocaleString('en-US', { maximumFractionDigits: 3 })}</td>
          </tr>)}</tbody>
        </table>
      </div>}
      {overview.records.length > 100 && <p className="text-sm text-amber-700">Showing the 100 most recent intervals among loaded batches; not necessarily the latest across the full publisher state.</p>}
    </>}
    <p className="text-sm text-gray-500">Overlapping batch intervals and repeated model names are not added together. Receipt commitments and content-addressed paths are not independently verified here. State presence does not prove receipt coverage, client delivery or model quality. Use the original transaction hash in Transactions to inspect its execution receipt and containing block.</p>
  </section>;
}

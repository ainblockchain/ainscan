import Link from 'next/link';
import { rpc, getValue } from '@/lib/rpc';
import { LESSONS_ROOT, validPublisher, trainingOverview } from '@/lib/training-overview';
import { INFERENCE_ROOT } from '@/lib/inference-overview';

export default async function TrainingOverview({ publisher }: { publisher?: string }) {
  let publishers: string[] = [];
  let discoveryFailed = false;
  let publisherListLimited = false;
  const discovered = new Set<string>();
  const responses = await Promise.allSettled([LESSONS_ROOT, INFERENCE_ROOT].map(ref => rpc('ain_get', { type: 'GET_VALUE', ref, is_shallow: true })));
  for (const response of responses) {
    try {
      if (response.status === 'rejected') throw new Error('Publisher discovery failed');
      const shallow = response.value;
      if (shallow !== null && (!shallow || typeof shallow !== 'object' || Array.isArray(shallow))) throw new Error('Invalid publisher state');
      for (const key of Object.keys(shallow ?? {}).filter(validPublisher)) discovered.add(key);
    } catch {
      discoveryFailed = true;
    }
  }
  publisherListLimited = discovered.size > 100;
  publishers = Array.from(discovered).sort().slice(0, 100);
  let overview: ReturnType<typeof trainingOverview> | null = null;
  let stateFailed = false;
  const valid = publisher !== undefined && validPublisher(publisher);
  if (valid) {
    try {
      overview = trainingOverview(publisher, await getValue(`${LESSONS_ROOT}/${publisher}`));
    } catch {
      stateFailed = true;
    }
  }
  const database = `${LESSONS_ROOT}${valid ? `/${publisher}` : ''}`;
  return <section className="space-y-4 mb-8" id="training-records">
    <h2 className="text-xl font-semibold text-gray-900">Training Records</h2>
    <p className="text-sm text-gray-500">Current lesson state from the connected blockchain, grouped by publisher. Counts describe the loaded records, not a history of simultaneous training, verified model support or successful inference.</p>
    <form action="/knowledge" method="get" className="flex flex-wrap gap-2 items-end">
      <label className="text-sm text-gray-700">Publisher
        <input name="publisher" list="training-publishers" defaultValue={publisher ?? ''} maxLength={128} required pattern="[a-zA-Z0-9_-]+" className="block border border-gray-300 rounded px-3 py-2" />
      </label>
      <datalist id="training-publishers">{publishers.map(node => <option key={node} value={node} />)}</datalist>
      <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm text-white">Load Records</button>
      <Link href={`/database${database}`} className="text-sm text-blue-600 hover:underline">Browse Native State</Link>
    </form>
    {discoveryFailed && <p role="alert" className="text-sm text-amber-700">Publisher discovery is incomplete or unavailable. Enter a known publisher ID to query its records.</p>}
    {publisherListLimited && <p className="text-sm text-amber-700">Suggestions show the first 100 publishers. Other publisher IDs can be entered directly.</p>}
    {publisher !== undefined && !valid && <p role="alert" className="text-sm text-red-600">Invalid publisher ID.</p>}
    {stateFailed && <p role="alert" className="text-sm text-red-600">Training state unavailable. No counts are inferred from this failed query.</p>}
    {!publisher && <p className="text-sm text-gray-500">Select or enter a publisher to inspect its native lesson records.</p>}
    {overview && <>
      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          ['Loaded Lessons', overview.records.length], ['TRAINING Status (reported)', overview.training],
          ['Dataset IDs (reported)', overview.datasets], ['Model IDs (reported)', overview.models],
        ] as const).map(([label, count]) => <div key={label} className="rounded border border-gray-200 p-4">
          <dt className="text-sm text-gray-500">{label}</dt><dd className="text-2xl font-bold text-gray-900">{count.toLocaleString('en-US')}</dd>
        </div>)}
      </dl>
      {(overview.truncated || overview.skipped > 0) && <p className="text-sm text-amber-700">Partial summary: at most 1,000 entries are inspected; {overview.skipped} malformed or shallow entries were skipped. Counts are not network totals.</p>}
      {overview.records.length === 0 ? <p className="text-sm text-gray-500">No recognized dataset-backed lessons in this response.</p> : <div className="overflow-x-auto rounded border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50"><tr>{['Job / Native State', 'Status', 'Dataset ID', 'Model ID', 'Rows (reported)'].map(label => <th key={label} className="px-4 py-3 text-left font-medium text-gray-500">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-200">{overview.records.slice(0, 100).map(record => <tr key={record.path}>
            <td className="px-4 py-3"><Link href={`/database${record.path}`} className="text-blue-600 break-all hover:underline">{record.jobId}</Link></td>
            <td className="px-4 py-3">{record.status}</td><td className="px-4 py-3 break-all">{record.datasetId}</td>
            <td className="px-4 py-3 break-all">{record.modelId ?? '-'}</td><td className="px-4 py-3">{record.rows ?? '-'}</td>
          </tr>)}</tbody>
        </table>
      </div>}
      {overview.records.length > 100 && <p className="text-sm text-amber-700">Table shows the first 100 loaded lessons. Browse Native State for other records.</p>}
      <p className="text-sm text-gray-500">Dataset IDs are deduplicated within this publisher, not by content or across publishers. Model IDs are sender-reported labels, not verified Hugging Face revisions. Current TRAINING labels may be stale. Search a submission transaction hash in Transactions to inspect execution, containing block and submission-to-inclusion latency; current state alone cannot establish those timings.</p>
    </>}
  </section>;
}

import Link from '@/components/NetworkLink';
import { notFound } from 'next/navigation';
import { parseNetwork } from '@/lib/network';
import { rpc } from '@/lib/rpc';
import ExplorerRefresh from '@/components/ExplorerRefresh';

export const dynamic = 'force-dynamic';

export default async function LayerTransactions({ params, searchParams }: {
  params: { layer: string }; searchParams: { network?: string; cursor?: string };
}) {
  const layer = params.layer;
  if (layer !== 'L1' && layer !== 'L2') notFound();
  const network = parseNetwork(searchParams.network);
  let page: any, error = false;
  try { page = await rpc(network, 'ain_listTransactions', { layer, limit: 50, cursor: searchParams.cursor }); }
  catch { error = true; }
  return <div className="space-y-4">
    <h1 className="text-2xl font-bold">{layer} Transactions</h1>
    <nav className="flex gap-4 text-blue-600">
      <Link href="/layers/L1/transactions">L1 transactions</Link>
      <Link href="/layers/L2/transactions">L2 transactions</Link>
      <Link href={`/database/apps?layer=${layer}`}>{layer} apps and state</Link>
    </nav>
    <ExplorerRefresh />
    {error ? <p role="alert" className="rounded border border-red-200 bg-red-50 p-4">
      {layer} transaction history is unavailable. No data from another layer is shown.
    </p> : <>
      <p className="text-sm text-gray-500">Indexed through {layer} block {page.indexed_height}.
        This page is pinned to block {page.snapshot_height}.</p>
      {layer === 'L2' && <p className="text-sm text-gray-600">L2 commitment is confirmed by the operator validators.
        L1 anchoring and settlement are separate stages.</p>}
      <div className="overflow-auto rounded border bg-white"><table className="w-full text-left text-sm">
        <thead><tr className="border-b"><th className="p-3">Hash</th><th>Block</th><th>Signer</th><th>Commitment</th></tr></thead>
        <tbody>{page.transactions.map((tx: any) => <tr key={tx.hash} className="border-b">
          <td className="p-3 font-mono text-blue-600"><Link href={`/layers/${layer}/transactions/${tx.hash}`}>{tx.hash.slice(0, 18)}…</Link></td>
          <td>{tx.block_number}</td><td className="font-mono">{tx.address ? `${tx.address.slice(0, 16)}…` : '—'}</td>
          <td>{layer === 'L2' ? 'L2 committed' : 'L1 finalized'}</td>
        </tr>)}</tbody>
      </table>{page.transactions.length === 0 && <p className="p-6 text-gray-500">No indexed transactions.</p>}</div>
      {page.next_cursor && <Link className="inline-block rounded border px-4 py-2" href={`/layers/${layer}/transactions?cursor=${encodeURIComponent(page.next_cursor)}`}>Older transactions</Link>}
    </>}
  </div>;
}

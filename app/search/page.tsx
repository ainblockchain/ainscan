import Link from '@/components/NetworkLink';
import { rpc } from '@/lib/rpc';
import { redirect } from 'next/navigation';
import { isBlockNumber, isTxHash, isAddress } from '@/lib/utils';
import { parseNetwork, withNetwork } from '@/lib/network';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; network?: string | string[] };
}) {
  const network = parseNetwork(searchParams.network);
  const query = (searchParams.q || '').trim();

  if (!query) {
    redirect(withNetwork('/', network));
  }

  if (isBlockNumber(query)) {
    redirect(withNetwork(`/blocks/${query}`, network));
  }

  if (isTxHash(query)) {
    const results = await Promise.all(['L1', 'L2'].map(async layer => {
      try { return { layer, tx: await rpc(network, 'ain_getIndexedTransaction', { layer, hash: query }), error: false }; }
      catch { return { layer, tx: null, error: true }; }
    }));
    return <div className="space-y-4"><h1 className="text-2xl font-bold">Transaction search</h1>
      <p className="break-all font-mono text-sm">{query}</p>
      {results.map(({ layer, tx, error }) => <div key={layer} className="rounded border bg-white p-4">
        <h2 className="font-semibold">{layer}</h2>
        {error ? <p>Lookup is unavailable.</p> : tx ? <Link className="text-blue-600" href={`/layers/${layer}/transactions/${query}`}>View finalized {layer} transaction in block {tx.block_number}</Link> : <p>Not indexed on {layer}. Pending transactions may appear after finalization.</p>}
      </div>)}
    </div>;
  }

  if (isAddress(query)) {
    redirect(withNetwork(`/accounts/${query}`, network));
  }

  // Default: try as database path
  redirect(withNetwork(`/database/${query.replace(/^\//, '')}`, network));
}

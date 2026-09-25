import Link from '@/components/NetworkLink';
import { notFound } from 'next/navigation';
import { parseNetwork } from '@/lib/network';
import { rpc } from '@/lib/rpc';

export const dynamic = 'force-dynamic';

export default async function LayerTransaction({ params, searchParams }: {
  params: { layer: string; hash: string }; searchParams: { network?: string };
}) {
  const { layer, hash } = params;
  if (!['L1', 'L2'].includes(layer) || !/^0x[a-fA-F0-9]{64}$/.test(hash)) notFound();
  const network = parseNetwork(searchParams.network);
  let tx: any, error = false;
  try { tx = await rpc(network, 'ain_getIndexedTransaction', { layer, hash }); }
  catch { error = true; }
  return <div className="space-y-4">
    <h1 className="text-2xl font-bold">{layer} Transaction</h1>
    <Link className="text-blue-600" href={`/layers/${layer}/transactions`}>Back to {layer} transactions</Link>
    <p className="break-all font-mono text-sm">{hash}</p>
    {error ? <p role="alert" className="text-red-700">{layer} transaction lookup is unavailable.</p> : !tx ?
      <p>This transaction has not been indexed on {layer}. It may still be pending or belong to another layer.</p> : <>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded border bg-white p-4 text-sm">
        <dt>Network</dt><dd>{network}</dd><dt>Execution layer</dt><dd>{layer}</dd>
        <dt>Block</dt><dd>{tx.block_number}</dd><dt>Commitment</dt><dd>{layer === 'L2' ? 'L2 committed' : 'L1 finalized'}</dd>
        <dt>Signer</dt><dd className="break-all font-mono">{tx.transaction.address || '—'}</dd>
      </dl>
      {layer === 'L2' && <div className="rounded border bg-white p-4 text-sm">
        {tx.settlement?.status === 'OPERATOR_ATTESTED_ON_L1' ? <>
          <p>Recorded on L1 by a quorum of at least 4 of the 5 operators.</p>
          <p>L2 checkpoint: {tx.settlement.l2_checkpoint_height} · L1 block: {tx.settlement.l1_block}</p>
          <Link className="break-all text-blue-600" href={`/layers/L1/transactions/${tx.settlement.l1_tx_hash}`}>
            View L1 checkpoint transaction</Link>
          <p className="mt-2 text-gray-600">Operator-validated settlement; this is not a validity proof.</p>
        </> : <p>L2 committed. Awaiting a verified L1 checkpoint.</p>}
      </div>}
      {tx.inbox && <div className="rounded border bg-white p-4 text-sm">
        <p>This L1 inbox submission requests execution on L2. The L1 receipt alone does not mean the L2 operation succeeded.</p>
        <Link className="text-blue-600" href={`/layers/L2/transactions/${tx.inbox.l2_tx_hash}`}>View L2 execution</Link>
      </div>}
      <h2 className="text-lg font-semibold">Signed transaction</h2>
      <pre className="max-h-[32rem] overflow-auto rounded border bg-white p-4 text-xs">{JSON.stringify(tx.transaction, null, 2)}</pre>
      <h2 className="text-lg font-semibold">Execution result</h2>
      <pre className="max-h-96 overflow-auto rounded border bg-white p-4 text-xs">{JSON.stringify(tx.execution_result, null, 2)}</pre>
    </>}
  </div>;
}

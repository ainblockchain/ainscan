import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTransactionByHash } from '@/lib/rpc';
import { formatTimestamp, getOperationType } from '@/lib/utils';
import CopyButton from '@/components/CopyButton';

export default async function TransactionDetailPage({
  params,
}: {
  params: { hash: string };
}) {
  const tx = await getTransactionByHash(params.hash).catch(() => null);
  if (!tx) notFound();

  const opType = getOperationType(tx);

  const details = [
    { label: 'Transaction Hash', value: tx.hash, mono: true, copy: true },
    {
      label: 'Block',
      value: tx.block_number,
      link: `/blocks/${tx.block_number}`,
    },
    { label: 'Timestamp', value: formatTimestamp(tx.timestamp) },
    {
      label: 'From',
      value: tx.address,
      mono: true,
      link: `/accounts/${tx.address}`,
      copy: true,
    },
    { label: 'Nonce', value: tx.nonce },
    { label: 'Operation Type', value: opType },
  ];

  if (tx.parent_tx_hash) {
    details.push({
      label: 'Parent Tx',
      value: tx.parent_tx_hash,
      mono: true,
      link: `/transactions/${tx.parent_tx_hash}`,
      copy: true,
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Transaction Details</h1>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <dl className="divide-y divide-gray-200">
          {details.map((item) => (
            <div key={item.label} className="px-4 py-3 sm:grid sm:grid-cols-4 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">{item.label}</dt>
              <dd className="mt-1 sm:mt-0 sm:col-span-3 text-sm text-gray-900 flex items-center">
                {item.link ? (
                  <Link href={item.link} className="text-blue-600 hover:underline font-mono break-all">
                    {String(item.value)}
                  </Link>
                ) : (
                  <span className={item.mono ? 'font-mono break-all' : ''}>
                    {String(item.value ?? '-')}
                  </span>
                )}
                {item.copy && <CopyButton text={String(item.value)} />}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {tx.operation && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Operation</h2>
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden p-4">
            <pre className="text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap break-all">
              {JSON.stringify(tx.operation, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {tx.exec_result && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Execution Result</h2>
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden p-4">
            <pre className="text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(tx.exec_result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

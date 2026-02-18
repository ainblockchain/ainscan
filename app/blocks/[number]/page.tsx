import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBlockByNumber } from '@/lib/rpc';
import { formatTimestamp, truncateHash, truncateAddress } from '@/lib/utils';
import TransactionsTable from '@/components/TransactionsTable';
import CopyButton from '@/components/CopyButton';

export default async function BlockDetailPage({
  params,
}: {
  params: { number: string };
}) {
  const blockNumber = parseInt(params.number, 10);
  if (isNaN(blockNumber)) notFound();

  const block = await getBlockByNumber(blockNumber, true).catch(() => null);
  if (!block) notFound();

  const transactions = Array.isArray(block.transactions)
    ? block.transactions.map((tx: any) =>
        typeof tx === 'object'
          ? { ...tx, block_number: block.number, timestamp: tx.timestamp || block.timestamp }
          : { hash: tx, block_number: block.number }
      )
    : [];

  const details = [
    { label: 'Block Number', value: block.number },
    {
      label: 'Hash',
      value: block.hash,
      mono: true,
      copy: true,
    },
    {
      label: 'Parent Hash',
      value: block.parent_hash,
      mono: true,
      link: block.number > 0 ? `/blocks/${block.number - 1}` : undefined,
    },
    { label: 'Timestamp', value: formatTimestamp(block.timestamp) },
    {
      label: 'Proposer',
      value: block.proposer,
      mono: true,
      link: `/accounts/${block.proposer}`,
      truncate: true,
    },
    { label: 'Transactions', value: transactions.length },
    { label: 'Size', value: block.size || '-' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Block #{block.number}
      </h1>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <dl className="divide-y divide-gray-200">
          {details.map((item) => (
            <div key={item.label} className="px-4 py-3 sm:grid sm:grid-cols-4 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">{item.label}</dt>
              <dd className="mt-1 sm:mt-0 sm:col-span-3 text-sm text-gray-900 flex items-center">
                {item.link ? (
                  <Link href={item.link} className="text-blue-600 hover:underline font-mono">
                    {item.truncate ? truncateAddress(String(item.value)) : String(item.value)}
                  </Link>
                ) : (
                  <span className={item.mono ? 'font-mono break-all' : ''}>
                    {String(item.value)}
                  </span>
                )}
                {item.copy && <CopyButton text={String(item.value)} />}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {transactions.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">
            Transactions ({transactions.length})
          </h2>
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <TransactionsTable transactions={transactions} />
          </div>
        </div>
      )}
    </div>
  );
}

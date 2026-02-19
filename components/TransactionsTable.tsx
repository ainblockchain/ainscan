import Link from 'next/link';
import { truncateHash, truncateAddress, timeAgo, getOperationType } from '@/lib/utils';

interface TxRow {
  hash: string;
  block_number?: number;
  timestamp?: number;
  address?: string;
  operation?: any;
}

export default function TransactionsTable({
  transactions,
  compact = false,
}: {
  transactions: TxRow[];
  compact?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Tx Hash
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Block
            </th>
            {!compact && (
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Age
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              From
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Type
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((tx) => (
            <tr key={tx.hash} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm">
                <Link
                  href={`/transactions/${tx.hash}${tx.block_number != null ? `?block=${tx.block_number}` : ''}`}
                  className="text-blue-600 hover:underline font-mono"
                >
                  {truncateHash(tx.hash)}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm">
                {tx.block_number != null ? (
                  <Link
                    href={`/blocks/${tx.block_number}`}
                    className="text-blue-600 hover:underline"
                  >
                    {tx.block_number}
                  </Link>
                ) : (
                  '-'
                )}
              </td>
              {!compact && (
                <td className="px-4 py-3 text-sm text-gray-500">
                  {tx.timestamp ? timeAgo(tx.timestamp) : '-'}
                </td>
              )}
              <td className="px-4 py-3 text-sm">
                {tx.address ? (
                  <Link
                    href={`/accounts/${tx.address}`}
                    className="text-blue-600 hover:underline font-mono"
                  >
                    {truncateAddress(tx.address)}
                  </Link>
                ) : (
                  '-'
                )}
              </td>
              <td className="px-4 py-3 text-sm">
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                  {getOperationType(tx)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

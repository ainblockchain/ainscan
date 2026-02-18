import Link from 'next/link';
import { truncateHash, truncateAddress, timeAgo } from '@/lib/utils';

interface BlockRow {
  number: number;
  hash?: string;
  timestamp: number;
  proposer: string;
  transactions?: any[];
  size?: number;
}

export default function BlocksTable({
  blocks,
  compact = false,
}: {
  blocks: BlockRow[];
  compact?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Block
            </th>
            {!compact && (
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Hash
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Age
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Proposer
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Txs
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {blocks.map((block) => (
            <tr key={block.number} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm">
                <Link
                  href={`/blocks/${block.number}`}
                  className="text-blue-600 hover:underline"
                >
                  {block.number}
                </Link>
              </td>
              {!compact && (
                <td className="px-4 py-3 text-sm font-mono text-gray-600">
                  {block.hash ? truncateHash(block.hash) : '-'}
                </td>
              )}
              <td className="px-4 py-3 text-sm text-gray-500">
                {timeAgo(block.timestamp)}
              </td>
              <td className="px-4 py-3 text-sm">
                <Link
                  href={`/accounts/${block.proposer}`}
                  className="text-blue-600 hover:underline font-mono"
                >
                  {truncateAddress(block.proposer)}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {block.transactions?.length ?? 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

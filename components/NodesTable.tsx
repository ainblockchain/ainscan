import Link from 'next/link';
import { truncateAddress, formatAIN } from '@/lib/utils';

interface NodeRow {
  address: string;
  stake: number;
  proposalRight?: boolean;
}

export default function NodesTable({ nodes }: { nodes: NodeRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              #
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Address
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Stake
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Proposal Right
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {nodes.map((node, i) => (
            <tr key={node.address} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-500">{i + 1}</td>
              <td className="px-4 py-3 text-sm">
                <Link
                  href={`/nodes/${node.address}`}
                  className="text-blue-600 hover:underline font-mono"
                >
                  {truncateAddress(node.address, 10)}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {formatAIN(node.stake)}
              </td>
              <td className="px-4 py-3 text-sm">
                {node.proposalRight ? (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    Yes
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                    No
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

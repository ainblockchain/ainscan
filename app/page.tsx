import Link from 'next/link';
import { getLastBlockNumber, getPeerCount, getConsensusStatus, getRecentBlocksWithTransactions, getRecentTransactions } from '@/lib/rpc';
import SearchBar from '@/components/SearchBar';
import NetworkStats from '@/components/NetworkStats';
import BlocksTable from '@/components/BlocksTable';
import TransactionsTable from '@/components/TransactionsTable';

export const revalidate = 10;

export default async function HomePage() {
  const [blockNumber, peerCount, consensusStatus, recentBlocks, recentTxs] = await Promise.all([
    getLastBlockNumber().catch(() => 0),
    getPeerCount().catch(() => null),
    getConsensusStatus().catch(() => null),
    getRecentBlocksWithTransactions(10).catch(() => []),
    getRecentTransactions(10).catch(() => []),
  ]);

  const consensusState = consensusStatus?.state || consensusStatus?.status || null;

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          AI Network Blockchain Explorer
        </h1>
        <div className="max-w-2xl mx-auto">
          <SearchBar large />
        </div>
      </div>

      <NetworkStats
        blockNumber={blockNumber}
        peerCount={peerCount}
        consensusState={consensusState}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Latest Blocks</h2>
            <Link href="/blocks" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <BlocksTable blocks={recentBlocks} compact />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Latest Transactions</h2>
            <Link href="/transactions" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          {recentTxs.length > 0 ? (
            <TransactionsTable transactions={recentTxs} compact />
          ) : (
            <p className="px-4 py-8 text-center text-gray-500 text-sm">
              No recent transactions found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

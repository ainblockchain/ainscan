import Link from '@/components/NetworkLink';
import { getLastBlockNumber, getNodeCount, getConsensusStatus, getRecentBlocksWithTransactions, getRecentTransactions, getBlockByNumber, getBlockHeadersList, RECENT_SCAN_BLOCKS } from '@/lib/rpc';
import SearchBar from '@/components/SearchBar';
import NetworkStats from '@/components/NetworkStats';
import BlocksTable from '@/components/BlocksTable';
import TransactionsTable from '@/components/TransactionsTable';
import { genesisHash } from '@/lib/chain-snapshot';
import { parseNetwork } from '@/lib/network';
import BenchmarkStats from '@/components/BenchmarkStats';
import ExplorerRefresh from '@/components/ExplorerRefresh';

export const dynamic = 'force-dynamic';

export default async function HomePage({
  searchParams,
}: {
  searchParams: { network?: string | string[] };
}) {
  const network = parseNetwork(searchParams.network);
  // Fetch sequentially to avoid rate limiting on devnet
  const blockNumber = await getLastBlockNumber(network).catch(() => null);
  const [nodeCount, consensusStatus, genesis] = await Promise.all([
    getNodeCount(network).catch(() => null),
    getConsensusStatus(network).catch(() => null),
    getBlockByNumber(network, 0, true).catch(() => null),
  ]);
  let recentBlocks = await getRecentBlocksWithTransactions(network, 10).catch(() => []);
  // Mainnet often has no transactions in the scanned window; show the latest blocks instead of an empty table.
  if (recentBlocks.length === 0 && Number.isSafeInteger(blockNumber) && blockNumber! >= 0) {
    const headers = await getBlockHeadersList(network, Math.max(0, blockNumber! - 9), blockNumber! + 1).catch(() => []);
    recentBlocks = Array.isArray(headers) ? [...headers].sort((a: any, b: any) => b.number - a.number) : [];
  }
  const recentTxs = await getRecentTransactions(network, 10).catch(() => []);

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

      <ExplorerRefresh />
      <BenchmarkStats />
      <NetworkStats
        genesisHash={genesisHash(genesis)}
        blockNumber={blockNumber}
        nodeCount={nodeCount}
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
              No transactions in the latest {RECENT_SCAN_BLOCKS.toLocaleString('en-US')} blocks.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

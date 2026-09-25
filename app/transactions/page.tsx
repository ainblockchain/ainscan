import { getRecentTransactions, RECENT_SCAN_BLOCKS } from '@/lib/rpc';
import TransactionsTable from '@/components/TransactionsTable';
import ExplorerRefresh from '@/components/ExplorerRefresh';
import { parseNetwork } from '@/lib/network';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { network?: string | string[] };
}) {
  const network = parseNetwork(searchParams.network);
  const transactions = await getRecentTransactions(network, 50);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Recent Transactions</h1>
      <ExplorerRefresh />
      <p className="text-sm text-gray-500">
        Showing {transactions.length} most recent transactions.
      </p>
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        {transactions.length > 0 ? (
          <TransactionsTable transactions={transactions} />
        ) : (
          <p className="px-4 py-8 text-center text-gray-500 text-sm">
            No transactions in the latest {RECENT_SCAN_BLOCKS.toLocaleString('en-US')} blocks.
          </p>
        )}
      </div>
    </div>
  );
}

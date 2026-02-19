import { getRecentTransactions } from '@/lib/rpc';
import TransactionsTable from '@/components/TransactionsTable';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
  const transactions = await getRecentTransactions(50);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Recent Transactions</h1>
      <p className="text-sm text-gray-500">
        Showing {transactions.length} most recent transactions.
      </p>
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        {transactions.length > 0 ? (
          <TransactionsTable transactions={transactions} />
        ) : (
          <p className="px-4 py-8 text-center text-gray-500 text-sm">
            No transactions found.
          </p>
        )}
      </div>
    </div>
  );
}

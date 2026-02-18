import { getLastBlockNumber, getBlockByNumber } from '@/lib/rpc';
import TransactionsTable from '@/components/TransactionsTable';

export const revalidate = 10;

const BLOCKS_TO_FETCH = 10;

export default async function TransactionsPage() {
  const lastBlock = await getLastBlockNumber();
  const from = Math.max(0, lastBlock - BLOCKS_TO_FETCH + 1);

  // Fetch blocks individually with full transaction data
  const blockPromises = [];
  for (let i = lastBlock; i >= from; i--) {
    blockPromises.push(getBlockByNumber(i, true).catch(() => null));
  }
  const blocks = (await Promise.all(blockPromises)).filter(Boolean);

  const transactions: any[] = [];
  for (const block of blocks) {
    if (block.transactions && Array.isArray(block.transactions)) {
      for (const tx of block.transactions) {
        if (typeof tx === 'object') {
          transactions.push({
            ...tx,
            block_number: block.number,
            timestamp: tx.timestamp || block.timestamp,
          });
        }
      }
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Recent Transactions</h1>
      <p className="text-sm text-gray-500">
        Showing transactions from the latest {BLOCKS_TO_FETCH} blocks ({transactions.length} transactions found).
      </p>
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        {transactions.length > 0 ? (
          <TransactionsTable transactions={transactions} />
        ) : (
          <p className="px-4 py-8 text-center text-gray-500 text-sm">
            No transactions found in recent blocks.
          </p>
        )}
      </div>
    </div>
  );
}

import { getLastBlockNumber, getBlockByNumber, getBlockList, getBlockTransactionCountByNumber } from '@/lib/rpc';
import TransactionsTable from '@/components/TransactionsTable';

export const dynamic = 'force-dynamic';

const MAX_TX = 50;
const SCAN_BATCH = 20; // ain_getBlockList returns at most 20 blocks per call
const MAX_SCAN = 5000;

async function findRecentTransactions(lastBlock: number): Promise<{ transactions: any[]; scannedBlocks: number }> {
  const transactions: any[] = [];
  let scannedBlocks = 0;

  // Scan backwards in batches to find blocks with transactions
  for (let end = lastBlock; end >= 0 && transactions.length < MAX_TX && scannedBlocks < MAX_SCAN; ) {
    const start = Math.max(0, end - SCAN_BATCH + 1);
    const blocks = await getBlockList(start, end).catch(() => []);
    scannedBlocks += end - start + 1;

    if (!Array.isArray(blocks)) break;

    // Sort descending by block number
    const sorted = [...blocks].sort((a: any, b: any) => b.number - a.number);

    // Find blocks that have transactions (array with length > 0)
    const blocksWithTx = sorted.filter(
      (b: any) => b.transactions && Array.isArray(b.transactions) && b.transactions.length > 0
    );

    // Fetch full blocks for those with transactions
    for (const block of blocksWithTx) {
      if (transactions.length >= MAX_TX) break;
      const fullBlock = await getBlockByNumber(block.number, true).catch(() => null);
      if (!fullBlock?.transactions) continue;
      for (const tx of fullBlock.transactions) {
        if (typeof tx === 'object') {
          transactions.push({
            ...tx,
            block_number: fullBlock.number,
            timestamp: tx.timestamp || fullBlock.timestamp,
          });
        }
      }
    }

    end = start - 1;
  }

  return { transactions, scannedBlocks };
}

export default async function TransactionsPage() {
  const lastBlock = await getLastBlockNumber();
  const { transactions, scannedBlocks } = await findRecentTransactions(lastBlock);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Recent Transactions</h1>
      <p className="text-sm text-gray-500">
        Found {transactions.length} transactions (scanned {scannedBlocks.toLocaleString()} blocks from #{lastBlock}).
      </p>
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        {transactions.length > 0 ? (
          <TransactionsTable transactions={transactions} />
        ) : (
          <p className="px-4 py-8 text-center text-gray-500 text-sm">
            No transactions found in the last {scannedBlocks.toLocaleString()} blocks.
          </p>
        )}
      </div>
    </div>
  );
}

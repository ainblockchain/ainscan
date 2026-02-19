import { getLastBlockNumber, getBlockByNumber, getBlockList } from '@/lib/rpc';
import TransactionsTable from '@/components/TransactionsTable';

export const dynamic = 'force-dynamic';

const MAX_TX = 50;
const BATCH = 20; // ain_getBlockList returns at most 20 blocks per call
const PARALLEL = 8; // number of parallel batch requests

async function findRecentTransactions(lastBlock: number): Promise<{ transactions: any[]; scannedBlocks: number }> {
  const transactions: any[] = [];
  let scannedBlocks = 0;
  let end = lastBlock;

  // Scan backwards in parallel batches to find blocks with transactions
  while (end >= 0 && transactions.length < MAX_TX) {
    // Fire PARALLEL batch requests at once
    const batchPromises = [];
    for (let i = 0; i < PARALLEL && end >= 0; i++) {
      const batchEnd = end;
      const batchStart = Math.max(0, end - BATCH + 1);
      batchPromises.push(
        getBlockList(batchStart, batchEnd)
          .then((blocks) => ({ blocks: Array.isArray(blocks) ? blocks : [], start: batchStart, end: batchEnd }))
          .catch(() => ({ blocks: [] as any[], start: batchStart, end: batchEnd }))
      );
      scannedBlocks += batchEnd - batchStart + 1;
      end = batchStart - 1;
    }

    const results = await Promise.all(batchPromises);

    // Collect all blocks with transactions, sorted descending
    const blocksWithTx: any[] = [];
    for (const { blocks } of results) {
      for (const b of blocks) {
        if (b.transactions && Array.isArray(b.transactions) && b.transactions.length > 0) {
          blocksWithTx.push(b);
        }
      }
    }
    blocksWithTx.sort((a, b) => b.number - a.number);

    // Fetch full blocks in parallel
    const fullBlockPromises = blocksWithTx
      .slice(0, MAX_TX - transactions.length)
      .map((b) => getBlockByNumber(b.number, true).catch(() => null));
    const fullBlocks = await Promise.all(fullBlockPromises);

    for (const fullBlock of fullBlocks) {
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

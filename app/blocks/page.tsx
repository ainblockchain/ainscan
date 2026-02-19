import Link from 'next/link';
import { getLastBlockNumber, getBlockHeadersList, getRecentBlocksWithTransactions } from '@/lib/rpc';
import BlocksTable from '@/components/BlocksTable';
import Pagination from '@/components/Pagination';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export default async function BlocksPage({
  searchParams,
}: {
  searchParams: { page?: string; filter?: string };
}) {
  const filterTx = searchParams.filter === 'tx';
  const page = Math.max(1, parseInt(searchParams.page || '1', 10));
  const lastBlock = await getLastBlockNumber().catch(() => 0);

  let sortedBlocks: any[] = [];
  let hasNext = false;
  let hasPrev = page > 1;

  if (filterTx) {
    // Show only blocks with transactions
    const blocks = await getRecentBlocksWithTransactions(PAGE_SIZE * page);
    const allSorted = blocks.sort((a: any, b: any) => b.number - a.number);
    const start = (page - 1) * PAGE_SIZE;
    sortedBlocks = allSorted.slice(start, start + PAGE_SIZE);
    hasNext = allSorted.length > start + PAGE_SIZE;
  } else {
    // Show all blocks
    const to = lastBlock - (page - 1) * PAGE_SIZE;
    const from = Math.max(0, to - PAGE_SIZE + 1);
    const blocks = to >= 0
      ? await getBlockHeadersList(from, to).catch(() => [])
      : [];
    sortedBlocks = Array.isArray(blocks)
      ? [...blocks].sort((a: any, b: any) => b.number - a.number)
      : [];
    hasNext = from > 0;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Blocks</h1>
        <div className="flex gap-2">
          <Link
            href="/blocks"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              !filterTx
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            All
          </Link>
          <Link
            href="/blocks?filter=tx"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filterTx
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            With Transactions
          </Link>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        {sortedBlocks.length > 0 ? (
          <BlocksTable blocks={sortedBlocks} />
        ) : (
          <p className="px-4 py-8 text-center text-gray-500 text-sm">
            No blocks found.
          </p>
        )}
        <Pagination
          basePath="/blocks"
          currentPage={page}
          hasNext={hasNext}
          hasPrev={hasPrev}
          extraParams={filterTx ? { filter: 'tx' } : {}}
        />
      </div>
    </div>
  );
}

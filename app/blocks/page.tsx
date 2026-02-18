import { getLastBlockNumber, getBlockHeadersList } from '@/lib/rpc';
import BlocksTable from '@/components/BlocksTable';
import Pagination from '@/components/Pagination';

export const revalidate = 10;

const PAGE_SIZE = 20;

export default async function BlocksPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, parseInt(searchParams.page || '1', 10));
  const lastBlock = await getLastBlockNumber();

  const to = lastBlock - (page - 1) * PAGE_SIZE;
  const from = Math.max(0, to - PAGE_SIZE + 1);

  const blocks = to >= 0
    ? await getBlockHeadersList(from, to).catch(() => [])
    : [];

  const sortedBlocks = Array.isArray(blocks)
    ? [...blocks].sort((a: any, b: any) => b.number - a.number)
    : [];

  const hasNext = from > 0;
  const hasPrev = page > 1;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Blocks</h1>
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <BlocksTable blocks={sortedBlocks} />
        <Pagination
          basePath="/blocks"
          currentPage={page}
          hasNext={hasNext}
          hasPrev={hasPrev}
        />
      </div>
    </div>
  );
}

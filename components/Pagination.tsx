import Link from 'next/link';

interface PaginationProps {
  basePath: string;
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  extraParams?: Record<string, string>;
}

export default function Pagination({
  basePath,
  currentPage,
  hasNext,
  hasPrev,
  extraParams = {},
}: PaginationProps) {
  function buildHref(page: number) {
    const params = new URLSearchParams({ ...extraParams, page: String(page) });
    return `${basePath}?${params.toString()}`;
  }

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="text-sm text-gray-500">Page {currentPage}</div>
      <div className="flex gap-2">
        {hasPrev ? (
          <Link
            href={buildHref(currentPage - 1)}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Previous
          </Link>
        ) : (
          <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
            Previous
          </span>
        )}
        {hasNext ? (
          <Link
            href={buildHref(currentPage + 1)}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Next
          </Link>
        ) : (
          <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
            Next
          </span>
        )}
      </div>
    </div>
  );
}

import { redirect } from 'next/navigation';
import { isBlockNumber, isTxHash, isAddress } from '@/lib/utils';
import { parseNetwork, withNetwork } from '@/lib/network';

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; network?: string | string[] };
}) {
  const network = parseNetwork(searchParams.network);
  const query = (searchParams.q || '').trim();

  if (!query) {
    redirect(withNetwork('/', network));
  }

  if (isBlockNumber(query)) {
    redirect(withNetwork(`/blocks/${query}`, network));
  }

  if (isTxHash(query)) {
    redirect(withNetwork(`/transactions/${query}`, network));
  }

  if (isAddress(query)) {
    redirect(withNetwork(`/accounts/${query}`, network));
  }

  // Default: try as database path
  redirect(withNetwork(`/database/${query.replace(/^\//, '')}`, network));
}

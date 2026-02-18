import { redirect } from 'next/navigation';
import { isBlockNumber, isTxHash, isAddress } from '@/lib/utils';

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = (searchParams.q || '').trim();

  if (!query) {
    redirect('/');
  }

  if (isBlockNumber(query)) {
    redirect(`/blocks/${query}`);
  }

  if (isTxHash(query)) {
    redirect(`/transactions/${query}`);
  }

  if (isAddress(query)) {
    redirect(`/accounts/${query}`);
  }

  // Default: try as database path
  redirect(`/database/${query.replace(/^\//, '')}`);
}

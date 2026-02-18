'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { isBlockNumber, isTxHash, isAddress } from '@/lib/utils';

export default function SearchBar({ large = false }: { large?: boolean }) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    if (isBlockNumber(q)) {
      router.push(`/blocks/${q}`);
    } else if (isTxHash(q)) {
      router.push(`/transactions/${q}`);
    } else if (isAddress(q)) {
      router.push(`/accounts/${q}`);
    } else {
      router.push(`/database/${q.replace(/^\//, '')}`);
    }
    setQuery('');
  }

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by block number, tx hash, address, or db path..."
          className={`w-full rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none ${
            large ? 'px-4 py-3 text-base' : 'px-3 py-2 text-sm'
          }`}
        />
        <button
          type="submit"
          className={`absolute right-1 top-1/2 -translate-y-1/2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors ${
            large ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs'
          }`}
        >
          Search
        </button>
      </div>
    </form>
  );
}

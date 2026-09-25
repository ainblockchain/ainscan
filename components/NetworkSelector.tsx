'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { NETWORKS, isNetwork, withNetwork } from '@/lib/network';
import { rememberNetwork, useNetwork } from './NetworkProvider';

export default function NetworkSelector() {
  const network = useNetwork();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Network</span>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-2.5 h-2 w-2 rounded-full ${
          network === 'mainnet' ? 'bg-green-500' : 'bg-amber-500'
        }`}
      />
      <select
        value={network}
        onChange={(e) => {
          const next = e.target.value;
          if (!isNetwork(next) || next === network) return;
          rememberNetwork(next);
          router.push(withNetwork(`${pathname}?${searchParams.toString()}`, next));
        }}
        className="rounded-lg border border-gray-300 bg-white py-2 pl-6 pr-8 text-sm font-medium text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
      >
        {Object.entries(NETWORKS).map(([key, info]) => (
          <option key={key} value={key}>
            {info.label}
          </option>
        ))}
      </select>
    </label>
  );
}

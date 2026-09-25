'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function LayerSelector() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const layer = params.get('layer') === 'L1' ? 'L1' : 'L2';
  return <label className="inline-flex items-center gap-2 text-sm font-medium">
    Execution layer
    <select aria-label="Execution layer" value={layer} className="rounded border px-3 py-2"
      onChange={event => {
        const next = new URLSearchParams(params.toString());
        next.set('layer', event.target.value);
        router.push(`${pathname}?${next}`);
      }}>
      <option value="L1">L1</option><option value="L2">L2</option>
    </select>
  </label>;
}

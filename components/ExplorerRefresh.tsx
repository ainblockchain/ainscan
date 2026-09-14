'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function ExplorerRefresh({ autoRefresh = true }: { autoRefresh?: boolean }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(autoRefresh);
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    if (!enabled || pending) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') startTransition(() => router.refresh());
    }, 15000);
    return () => window.clearInterval(timer);
  }, [enabled, pending, router, startTransition]);

  return <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
    <button type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())}
      className="rounded border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50">
      {pending ? 'Refreshing…' : 'Refresh'}
    </button>
    <label className="inline-flex items-center gap-2">
      <input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} />
      Auto-refresh (15s)
    </label>
    <span className="text-xs text-gray-500">Automatic refresh pauses in background tabs.</span>
  </div>;
}

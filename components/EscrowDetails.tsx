'use client';

import Link from '@/components/NetworkLink';
import { useRpc } from '@/hooks/useRpc';
import type { EscrowReference } from '@/lib/state-channel';

export default function EscrowDetails({ escrow }: { escrow: EscrowReference }) {
  const { data, error } = useRpc<Record<string, unknown> | null>('ain_get', { type: 'GET_VALUE', ref: escrow.root }, 30000);
  const databasePath = `/database${escrow.root.split('/').map(encodeURIComponent).join('/')}`;
  return <section className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
    <h2 className="text-xl font-semibold">Escrow · {escrow.key}</h2>
    <p className="text-sm text-gray-500">Current contract records, not a historical snapshot at this transaction. Cooperative channel configuration, closing approvals and release records can be inspected here. A closing sequence alone is not verified transfer throughput.</p>
    <dl className="text-sm space-y-2">
      <div><dt className="text-gray-500">Source</dt><dd><Link href={`/accounts/${escrow.source}`} className="text-blue-600 break-all">{escrow.source}</Link></dd></div>
      <div><dt className="text-gray-500">Target</dt><dd><Link href={`/accounts/${escrow.target}`} className="text-blue-600 break-all">{escrow.target}</Link></dd></div>
      <div><dt className="text-gray-500">Contract Path</dt><dd><Link href={databasePath} className="text-blue-600 break-all">{escrow.root}</Link></dd></div>
    </dl>
    {error ? <p role="alert" className="text-sm text-red-600">Escrow state unavailable from the connected blockchain node.</p>
      : data === undefined ? <p className="text-sm text-gray-500">Loading escrow state…</p>
        : data === null ? <p className="text-sm text-gray-500">No value stored at this contract path.</p>
          : <pre className="overflow-auto text-sm">{JSON.stringify(data, null, 2)}</pre>}
    <p className="text-sm text-gray-500">Record presence does not establish successful execution, matching approvals, asset conservation or off-chain delivery. Inspect transaction execution results and the contract rules separately.</p>
  </section>;
}

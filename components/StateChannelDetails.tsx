'use client';

import Link from 'next/link';
import { useRpc } from '@/hooks/useRpc';

interface ChannelState {
  channel_id: string;
  path: string;
  state: unknown;
  proof_hash: string | null;
  block_number: number;
}

export default function StateChannelDetails({ channelId }: { channelId: string }) {
  const { data, error } = useRpc<ChannelState>('ain_getStateChannel', { channel_id: channelId }, 30000);
  return <section className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
    <h2 className="text-xl font-semibold">State Channel · {channelId}</h2>
    <p className="text-sm text-gray-500">Current on-chain channel state, not the historical state at this transaction. Off-chain transfers are not counted as on-chain transactions.</p>
    {error ? <p role="alert" className="text-sm text-red-600">Channel state unavailable from the connected blockchain node.</p>
      : !data ? <p className="text-sm text-gray-500">Loading channel state…</p>
        : <>
          <p className="text-sm">At block <Link href={`/blocks/${data.block_number}`} className="text-blue-600">{data.block_number}</Link></p>
          <Link href={`/database/state_channels/${encodeURIComponent(channelId)}`} className="text-sm text-blue-600">View on-chain channel records</Link>
          {data.proof_hash && <p className="break-all font-mono text-xs">State proof hash: {data.proof_hash}</p>}
          {data.state === null ? <p className="text-sm text-gray-500">No channel state stored at this path.</p>
            : <pre className="overflow-auto text-sm">{JSON.stringify(data.state, null, 2)}</pre>}
        </>}
  </section>;
}

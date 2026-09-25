import { NextRequest, NextResponse } from 'next/server';
import { rpc, getBlockByNumber, getLastBlockNumber } from '@/lib/rpc';
import { genesisHash } from '@/lib/chain-snapshot';
import { validBenchmark } from '@/lib/benchmark-status';
import { NETWORK_PARAM, isNetwork, parseNetwork } from '@/lib/network';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get(NETWORK_PARAM);
  if (requested !== null && !isNetwork(requested)) {
    return NextResponse.json({error: 'Unsupported network'}, {status: 400, headers: {'Cache-Control': 'no-store'}});
  }
  const network = parseNetwork(requested);
  try {
    const genesis = genesisHash(await getBlockByNumber(network, 0, true));
    if (!genesis) throw new Error('chain unavailable');
    const height = await getLastBlockNumber(network);
    const entries = await Promise.all(['l1', 'l2_peer'].map(async kind => {
      const value = await rpc(network, 'ain_get', {type: 'GET_VALUE', ref: `/apps/ai_network_dag/benchmarks/${kind}/latest`, is_final: true});
      if (value === null) return [kind, null];
      value.samples = JSON.parse(value.samplesJson || '[]');
      delete value.samplesJson;
      if (!validBenchmark(value, kind, genesis)) throw new Error('invalid benchmark or different chain');
      if (value.phase === 'completed') {
        const block = await getBlockByNumber(network, value.checkpointBlock!, true);
        const index = block?.transactions?.findIndex((tx: {hash: string}) => tx.hash === value.checkpointTx);
        const operation = index >= 0 ? block.transactions[index].tx_body?.operation : null;
        const expected = kind === 'l2_peer' ? `/apps/ai_network_dag/network_channels/${value.runId}/settle` : `/apps/ai_network_dag/l1_load/${value.runId}/summary`;
        if (block?.number !== value.checkpointBlock || value.checkpointBlock! > height - 2 || index < 0
          || block.receipts?.[index]?.code !== 0 || operation?.ref !== expected || operation?.value?.runId !== value.runId) throw new Error('checkpoint not verified');
      }
      return [kind, value];
    }));
    if (genesisHash(await getBlockByNumber(network, 0, true)) !== genesis) throw new Error('chain changed');
    return NextResponse.json({genesisHash: genesis, ...Object.fromEntries(entries)}, {headers: {'Cache-Control': 'no-store'}});
  } catch {
    return NextResponse.json({error: 'Benchmark feed or checkpoint verification unavailable'}, {status: 503, headers: {'Cache-Control': 'no-store'}});
  }
}

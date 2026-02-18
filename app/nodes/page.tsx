import Link from 'next/link';
import { getLastBlockNumber, getValidatorsByNumber } from '@/lib/rpc';
import NodesTable from '@/components/NodesTable';

export const revalidate = 30;

export default async function NodesPage() {
  const lastBlock = await getLastBlockNumber();
  const validatorsRaw = await getValidatorsByNumber(lastBlock).catch(() => null);

  // The validators response is a map of address -> { stake, proposal_right }
  const nodes: { address: string; stake: number; proposalRight: boolean }[] = [];

  if (validatorsRaw && typeof validatorsRaw === 'object') {
    for (const [address, info] of Object.entries(validatorsRaw)) {
      if (!info) continue;
      const v = info as any;
      nodes.push({
        address,
        stake: typeof v === 'object' ? (v.stake || 0) : (typeof v === 'number' ? v : 0),
        proposalRight: typeof v === 'object' ? (v.proposal_right ?? true) : true,
      });
    }
  }

  // Sort by stake descending
  nodes.sort((a, b) => b.stake - a.stake);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Validators</h1>
        <span className="text-sm text-gray-500">
          At block #{lastBlock} &middot; {nodes.length} validators
        </span>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        {nodes.length > 0 ? (
          <NodesTable nodes={nodes} />
        ) : (
          <p className="px-4 py-8 text-center text-gray-500 text-sm">
            No validators found.
          </p>
        )}
      </div>
    </div>
  );
}

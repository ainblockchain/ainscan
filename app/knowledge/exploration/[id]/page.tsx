import { getValue } from '@/lib/rpc';
import { getExplorationNeighbors } from '@/lib/neo4j';
import { KnowledgeExploration, GraphData } from '@/lib/types';
import ExplorationDetail from './ExplorationDetail';

export const revalidate = 10;

interface PageProps {
  params: { id: string };
}

function parseNodeId(nodeId: string): { address: string; topicKey: string; entryId: string } | null {
  // nodeId format: {address}_{topicKey}_{entryId}
  const parts = nodeId.split('_');
  if (parts.length < 3) return null;
  const address = parts[0];
  const entryId = parts[parts.length - 1];
  const topicKey = parts.slice(1, -1).join('_');
  return { address, topicKey, entryId };
}

async function getExploration(nodeId: string): Promise<{ data: KnowledgeExploration | null; address: string; topicKey: string; entryId: string }> {
  const parsed = parseNodeId(nodeId);
  if (!parsed) return { data: null, address: '', topicKey: '', entryId: '' };

  try {
    const data = await getValue(
      `/apps/knowledge/explorations/${parsed.address}/${parsed.topicKey}/${parsed.entryId}`
    );
    return { data, ...parsed };
  } catch {
    return { data: null, ...parsed };
  }
}

async function getNeighborhood(nodeId: string): Promise<GraphData> {
  try {
    return await getExplorationNeighbors(nodeId);
  } catch {
    return { nodes: [], edges: [] };
  }
}

export default async function ExplorationPage({ params }: PageProps) {
  const nodeId = decodeURIComponent(params.id);
  const [exploration, graphData] = await Promise.all([
    getExploration(nodeId),
    getNeighborhood(nodeId),
  ]);

  return (
    <ExplorationDetail
      nodeId={nodeId}
      exploration={exploration.data}
      address={exploration.address}
      topicKey={exploration.topicKey}
      entryId={exploration.entryId}
      graphData={graphData}
    />
  );
}

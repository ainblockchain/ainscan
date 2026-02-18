import { getValue } from './rpc';
import { GraphData, GraphNode, GraphEdge, GraphStats } from './types';

/**
 * Reads the on-chain knowledge graph via JSON-RPC (replaces direct Neo4j queries).
 * On-chain paths:
 *   /apps/knowledge/graph/nodes/{nodeId} -> { address, topic_path, entry_id, title, depth, created_at }
 *   /apps/knowledge/graph/edges/{nodeId}/{targetNodeId} -> { type, created_at, created_by }
 *   /apps/knowledge/topics/...  -> topic tree
 *   /apps/knowledge/explorations/{address}/{topicKey}/{entryId} -> exploration data
 */

function onchainNodeToGraphNode(nodeId: string, data: Record<string, any>): GraphNode {
  const label = data.entry_id ? 'Exploration' : 'Topic';
  return {
    id: nodeId,
    label,
    properties: { ...data, id: nodeId },
  };
}

function buildGraphFromOnchain(
  nodesData: Record<string, any> | null,
  edgesData: Record<string, Record<string, any>> | null
): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  if (nodesData) {
    for (const [nodeId, data] of Object.entries(nodesData)) {
      if (data && typeof data === 'object') {
        nodes.push(onchainNodeToGraphNode(nodeId, data));
      }
    }
  }

  if (edgesData) {
    for (const [fromId, targets] of Object.entries(edgesData)) {
      if (!targets || typeof targets !== 'object') continue;
      for (const [toId, edgeData] of Object.entries(targets)) {
        if (!edgeData || typeof edgeData !== 'object') continue;
        edges.push({
          id: `${fromId}->${toId}`,
          from: fromId,
          to: toId,
          type: edgeData.type || 'related',
          properties: edgeData,
        });
      }
    }
  }

  return { nodes, edges };
}

export async function getKnowledgeGraph(): Promise<GraphData> {
  const [nodesData, edgesData] = await Promise.all([
    getValue('/apps/knowledge/graph/nodes').catch(() => null),
    getValue('/apps/knowledge/graph/edges').catch(() => null),
  ]);
  return buildGraphFromOnchain(nodesData, edgesData);
}

export async function getTopicSubgraph(topicPath: string): Promise<GraphData> {
  const graph = await getKnowledgeGraph();
  const topicKey = topicPath.replace(/\//g, '|');

  // Filter nodes that belong to this topic (topic_path contains the topicKey)
  const relevantNodes = graph.nodes.filter((n) => {
    const tp = n.properties.topic_path || '';
    return tp === topicPath || tp === topicKey || n.id.includes(topicKey.replace(/\|/g, '_'));
  });

  const nodeIds = new Set(relevantNodes.map((n) => n.id));

  // Filter edges where both endpoints are in the relevant set
  const relevantEdges = graph.edges.filter(
    (e) => nodeIds.has(e.from) || nodeIds.has(e.to)
  );

  // Also include nodes referenced by edges
  for (const edge of relevantEdges) {
    if (!nodeIds.has(edge.from)) {
      const n = graph.nodes.find((x) => x.id === edge.from);
      if (n) { relevantNodes.push(n); nodeIds.add(n.id); }
    }
    if (!nodeIds.has(edge.to)) {
      const n = graph.nodes.find((x) => x.id === edge.to);
      if (n) { relevantNodes.push(n); nodeIds.add(n.id); }
    }
  }

  return { nodes: relevantNodes, edges: relevantEdges };
}

export async function getExplorationNeighbors(nodeId: string): Promise<GraphData> {
  const graph = await getKnowledgeGraph();

  // Find the node and all directly connected edges
  const connectedEdges = graph.edges.filter(
    (e) => e.from === nodeId || e.to === nodeId
  );

  const nodeIds = new Set<string>([nodeId]);
  for (const edge of connectedEdges) {
    nodeIds.add(edge.from);
    nodeIds.add(edge.to);
  }

  const nodes = graph.nodes.filter((n) => nodeIds.has(n.id));

  return { nodes, edges: connectedEdges };
}

export async function getGraphStats(): Promise<GraphStats> {
  const [topicsData, explorationsData, graphData] = await Promise.all([
    getValue('/apps/knowledge/topics').catch(() => null),
    getValue('/apps/knowledge/explorations').catch(() => null),
    getKnowledgeGraph().catch(() => ({ nodes: [], edges: [] })),
  ]);

  // Count topics recursively
  function countTopics(obj: any): number {
    if (!obj || typeof obj !== 'object') return 0;
    let count = 0;
    for (const [key, value] of Object.entries(obj)) {
      if (key === '.info') { count++; continue; }
      if (value && typeof value === 'object') {
        count += countTopics(value);
      }
    }
    return count;
  }

  // Count explorations and unique users
  let explorationCount = 0;
  const users = new Set<string>();
  if (explorationsData && typeof explorationsData === 'object') {
    for (const [address, topics] of Object.entries(explorationsData as Record<string, any>)) {
      users.add(address);
      if (topics && typeof topics === 'object') {
        for (const entries of Object.values(topics as Record<string, any>)) {
          if (entries && typeof entries === 'object') {
            explorationCount += Object.keys(entries).filter(
              (k) => !k.startsWith('.')
            ).length;
          }
        }
      }
    }
  }

  return {
    topicCount: countTopics(topicsData),
    explorationCount,
    edgeCount: graphData.edges.length,
    userCount: users.size,
  };
}

import { getValue } from './rpc';
import { GraphData, GraphNode, GraphEdge, GraphStats } from './types';

/**
 * Reads the on-chain knowledge graph via JSON-RPC.
 * On-chain paths:
 *   /apps/knowledge/graph/nodes/{nodeId} -> { address, topic_path, entry_id, title, depth, created_at }
 *   /apps/knowledge/graph/edges/{nodeId}/{targetNodeId} -> { type, created_at, created_by }
 *   /apps/knowledge/topics/...  -> topic tree with .info metadata
 *   /apps/knowledge/explorations/{address}/{topicKey}/{entryId} -> exploration data
 *
 * The graph is built from:
 * 1. On-chain graph nodes and edges (explicit links from parentEntry/relatedEntries)
 * 2. Topic nodes (from the topic tree)
 * 3. Inferred edges: exploration -> topic (IN_TOPIC), topic -> subtopic (SUBTOPIC)
 */

// -- helpers ------------------------------------------------------------------

function flattenTopics(
  obj: Record<string, any>,
  prefix: string[] = []
): { path: string; info: Record<string, any> }[] {
  if (!obj || typeof obj !== 'object') return [];
  const results: { path: string; info: Record<string, any> }[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (key === '.info' || !value || typeof value !== 'object') continue;
    const currentPath = [...prefix, key];
    if (value['.info']) {
      results.push({ path: currentPath.join('/'), info: value['.info'] });
    }
    results.push(...flattenTopics(value, currentPath));
  }
  return results;
}

function topicPathToKey(topicPath: string): string {
  return topicPath.replace(/\//g, '|');
}

// -- graph building -----------------------------------------------------------

function buildFullGraph(
  graphNodes: Record<string, any> | null,
  graphEdges: Record<string, Record<string, any>> | null,
  topicsData: Record<string, any> | null,
  explorationsData: Record<string, any> | null,
): GraphData {
  const nodesMap = new Map<string, GraphNode>();
  const edgesMap = new Map<string, GraphEdge>();

  // 1. Add topic nodes from the topic tree
  const topics = flattenTopics(topicsData || {});
  for (const topic of topics) {
    const topicId = `topic:${topic.path}`;
    nodesMap.set(topicId, {
      id: topicId,
      label: 'Topic',
      properties: {
        id: topicId,
        title: topic.info.title || topic.path,
        description: topic.info.description || '',
        topic_path: topic.path,
        created_by: topic.info.created_by,
        created_at: topic.info.created_at,
      },
    });
  }

  // 2. Build subtopic edges (parent topic -> child topic)
  for (const topic of topics) {
    const parts = topic.path.split('/');
    if (parts.length > 1) {
      const parentPath = parts.slice(0, -1).join('/');
      const parentId = `topic:${parentPath}`;
      const childId = `topic:${topic.path}`;
      if (nodesMap.has(parentId)) {
        const edgeId = `${parentId}->subtopic->${childId}`;
        edgesMap.set(edgeId, {
          id: edgeId,
          from: parentId,
          to: childId,
          type: 'subtopic',
        });
      }
    }
  }

  // 3. Add on-chain graph nodes (explorations)
  if (graphNodes) {
    for (const [nodeId, data] of Object.entries(graphNodes)) {
      if (!data || typeof data !== 'object') continue;
      nodesMap.set(nodeId, {
        id: nodeId,
        label: 'Exploration',
        properties: { ...data, id: nodeId },
      });

      // Create exploration -> topic edge
      const topicPath = data.topic_path;
      if (topicPath) {
        const topicId = `topic:${topicPath}`;
        // Ensure topic node exists even if not in topic tree
        if (!nodesMap.has(topicId)) {
          nodesMap.set(topicId, {
            id: topicId,
            label: 'Topic',
            properties: { id: topicId, title: topicPath, topic_path: topicPath },
          });
        }
        const edgeId = `${nodeId}->in_topic->${topicId}`;
        edgesMap.set(edgeId, {
          id: edgeId,
          from: nodeId,
          to: topicId,
          type: 'in_topic',
        });
      }
    }
  }

  // 4. Add on-chain explicit edges (extends, related, prerequisite)
  if (graphEdges) {
    const seen = new Set<string>();
    for (const [fromId, targets] of Object.entries(graphEdges)) {
      if (!targets || typeof targets !== 'object') continue;
      for (const [toId, edgeData] of Object.entries(targets)) {
        if (!edgeData || typeof edgeData !== 'object') continue;
        // Deduplicate bidirectional edges
        const canonical = [fromId, toId].sort().join('<->');
        if (seen.has(canonical)) continue;
        seen.add(canonical);
        const edgeId = `${fromId}->${toId}`;
        edgesMap.set(edgeId, {
          id: edgeId,
          from: fromId,
          to: toId,
          type: edgeData.type || 'related',
          properties: edgeData,
        });
      }
    }
  }

  // 5. Add user nodes and explored_by edges from explorations data
  if (explorationsData) {
    for (const [address, topics] of Object.entries(explorationsData as Record<string, any>)) {
      if (!topics || typeof topics !== 'object') continue;
      const userId = `user:${address}`;
      if (!nodesMap.has(userId)) {
        nodesMap.set(userId, {
          id: userId,
          label: 'User',
          properties: { id: userId, address, name: `${address.slice(0, 8)}...` },
        });
      }

      for (const [topicKey, entries] of Object.entries(topics as Record<string, any>)) {
        if (!entries || typeof entries !== 'object') continue;
        const topicPath = topicKey.replace(/\|/g, '/');
        const topicId = `topic:${topicPath}`;

        // User -> topic edge
        const utEdgeId = `${userId}->explored->${topicId}`;
        if (!edgesMap.has(utEdgeId)) {
          edgesMap.set(utEdgeId, {
            id: utEdgeId,
            from: userId,
            to: topicId,
            type: 'explored',
          });
        }
      }
    }
  }

  return {
    nodes: Array.from(nodesMap.values()),
    edges: Array.from(edgesMap.values()),
  };
}

// -- public API ---------------------------------------------------------------

export async function getKnowledgeGraph(): Promise<GraphData> {
  const [graphNodes, graphEdges, topicsData, explorationsData] = await Promise.all([
    getValue('/apps/knowledge/graph/nodes').catch(() => null),
    getValue('/apps/knowledge/graph/edges').catch(() => null),
    getValue('/apps/knowledge/topics').catch(() => null),
    getValue('/apps/knowledge/explorations').catch(() => null),
  ]);
  return buildFullGraph(graphNodes, graphEdges, topicsData, explorationsData);
}

export async function getTopicSubgraph(topicPath: string): Promise<GraphData> {
  const graph = await getKnowledgeGraph();
  const topicId = `topic:${topicPath}`;
  const topicKey = topicPath.replace(/\//g, '|');

  // Collect relevant nodes: the topic + its explorations + connected nodes
  const relevantNodeIds = new Set<string>();

  // Add the topic itself and subtopics
  for (const node of graph.nodes) {
    if (node.id === topicId) {
      relevantNodeIds.add(node.id);
    } else if (node.id.startsWith(`topic:${topicPath}/`)) {
      relevantNodeIds.add(node.id);
    } else if (node.label === 'Exploration') {
      const tp = node.properties.topic_path || '';
      if (tp === topicPath || tp === topicKey || node.id.includes(topicKey.replace(/\|/g, '_'))) {
        relevantNodeIds.add(node.id);
      }
    }
  }

  // Find edges touching these nodes
  const relevantEdges = graph.edges.filter(
    (e) => relevantNodeIds.has(e.from) || relevantNodeIds.has(e.to)
  );

  // Include connected nodes from edges
  for (const edge of relevantEdges) {
    relevantNodeIds.add(edge.from);
    relevantNodeIds.add(edge.to);
  }

  const nodes = graph.nodes.filter((n) => relevantNodeIds.has(n.id));
  return { nodes, edges: relevantEdges };
}

export async function getExplorationNeighbors(nodeId: string): Promise<GraphData> {
  const graph = await getKnowledgeGraph();

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
    getValue('/apps/knowledge/graph/nodes').catch(() => null),
  ]);

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

  const graphNodeCount = graphData ? Object.keys(graphData).length : 0;

  // Use the higher of topic count or graph node count for edges estimate
  const edgeCount = graphData
    ? Object.keys(graphData).length
    : 0;

  return {
    topicCount: countTopics(topicsData),
    explorationCount: Math.max(explorationCount, graphNodeCount),
    edgeCount,
    userCount: users.size,
  };
}

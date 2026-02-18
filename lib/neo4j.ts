import neo4j, { Driver, Record as Neo4jRecord } from 'neo4j-driver';
import { GraphData, GraphNode, GraphEdge, GraphStats } from './types';

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'ain';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'randomstring';

let driver: Driver | null = null;

function getDriver(): Driver {
  if (!driver) {
    driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  }
  return driver;
}

function toNumber(value: any): number {
  if (neo4j.isInt(value)) return value.toNumber();
  if (typeof value === 'number') return value;
  return Number(value) || 0;
}

function recordToNode(record: Neo4jRecord, key: string): GraphNode {
  const node = record.get(key);
  const props: Record<string, any> = {};
  for (const [k, v] of Object.entries(node.properties)) {
    props[k] = neo4j.isInt(v) ? (v as any).toNumber() : v;
  }
  return {
    id: node.properties.id || node.elementId,
    label: node.labels?.[0] || 'Unknown',
    properties: props,
  };
}

function recordToEdge(record: Neo4jRecord, key: string): GraphEdge {
  const rel = record.get(key);
  const props: Record<string, any> = {};
  if (rel.properties) {
    for (const [k, v] of Object.entries(rel.properties)) {
      props[k] = neo4j.isInt(v) ? (v as any).toNumber() : v;
    }
  }
  return {
    id: rel.elementId,
    from: rel.startNodeElementId,
    to: rel.endNodeElementId,
    type: rel.type,
    properties: props,
  };
}

export async function queryGraph(cypher: string, params: Record<string, any> = {}): Promise<GraphData> {
  const session = getDriver().session();
  try {
    const result = await session.run(cypher, params);
    const nodesMap = new Map<string, GraphNode>();
    const edgesMap = new Map<string, GraphEdge>();

    for (const record of result.records) {
      for (const key of record.keys) {
        const value = record.get(key as string);
        if (!value) continue;

        if (value.labels) {
          // It's a node
          const node = recordToNode(record, key as string);
          nodesMap.set(node.id, node);
        } else if (value.type && value.startNodeElementId) {
          // It's a relationship
          const edge = recordToEdge(record, key as string);
          edgesMap.set(edge.id, edge);
        }
      }
    }

    return {
      nodes: Array.from(nodesMap.values()),
      edges: Array.from(edgesMap.values()),
    };
  } finally {
    await session.close();
  }
}

export async function getKnowledgeGraph(): Promise<GraphData> {
  return queryGraph(`
    MATCH (n)
    WHERE n:Topic OR n:Exploration OR n:User
    OPTIONAL MATCH (n)-[r]->(m)
    WHERE m:Topic OR m:Exploration OR m:User
    RETURN n, r, m
  `);
}

export async function getTopicSubgraph(topicPath: string): Promise<GraphData> {
  return queryGraph(`
    MATCH (t:Topic {id: $topicPath})
    OPTIONAL MATCH (e:Exploration)-[:IN_TOPIC]->(t)
    OPTIONAL MATCH (e)-[r:BUILDS_ON]->(e2:Exploration)
    RETURN t, e, r, e2
  `, { topicPath });
}

export async function getExplorationNeighbors(nodeId: string): Promise<GraphData> {
  return queryGraph(`
    MATCH (n {id: $nodeId})
    OPTIONAL MATCH (n)-[r]-(m)
    RETURN n, r, m
  `, { nodeId });
}

export async function getGraphStats(): Promise<GraphStats> {
  const session = getDriver().session();
  try {
    const result = await session.run(`
      OPTIONAL MATCH (t:Topic) WITH count(t) AS topicCount
      OPTIONAL MATCH (e:Exploration) WITH topicCount, count(e) AS explorationCount
      OPTIONAL MATCH (u:User) WITH topicCount, explorationCount, count(u) AS userCount
      OPTIONAL MATCH ()-[r]->() WITH topicCount, explorationCount, userCount, count(r) AS edgeCount
      RETURN topicCount, explorationCount, userCount, edgeCount
    `);
    const record = result.records[0];
    return {
      topicCount: toNumber(record?.get('topicCount')),
      explorationCount: toNumber(record?.get('explorationCount')),
      edgeCount: toNumber(record?.get('edgeCount')),
      userCount: toNumber(record?.get('userCount')),
    };
  } finally {
    await session.close();
  }
}

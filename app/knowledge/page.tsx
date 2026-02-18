import Link from 'next/link';
import { getValue } from '@/lib/rpc';
import { getGraphStats, getKnowledgeGraph } from '@/lib/neo4j';
import { KnowledgeTopic, GraphStats, GraphData } from '@/lib/types';
import KnowledgeGraphView from './KnowledgeGraphView';

export const revalidate = 10;

async function getTopics(): Promise<Record<string, { '.info': KnowledgeTopic }>> {
  try {
    return (await getValue('/apps/knowledge/topics')) || {};
  } catch {
    return {};
  }
}

async function getStats(): Promise<GraphStats> {
  try {
    return await getGraphStats();
  } catch {
    return { topicCount: 0, explorationCount: 0, edgeCount: 0, userCount: 0 };
  }
}

async function getGraph(): Promise<GraphData> {
  try {
    return await getKnowledgeGraph();
  } catch {
    return { nodes: [], edges: [] };
  }
}

function flattenTopics(
  obj: Record<string, any>,
  prefix: string[] = []
): { path: string; info: KnowledgeTopic }[] {
  const results: { path: string; info: KnowledgeTopic }[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (key === '.info') continue;
    const currentPath = [...prefix, key];
    if (value && value['.info']) {
      results.push({ path: currentPath.join('/'), info: value['.info'] });
    }
    // Recurse into subtopics
    const subTopics = flattenTopics(value, currentPath);
    results.push(...subTopics);
  }
  return results;
}

export default async function KnowledgePage() {
  const [topics, stats, graphData] = await Promise.all([getTopics(), getStats(), getGraph()]);
  const topicList = flattenTopics(topics);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Knowledge Graph</h1>
        <p className="mt-1 text-sm text-gray-500">
          Explore the on-chain knowledge graph — topics, explorations, and their relationships
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-sm text-gray-500">Topics</div>
          <div className="text-2xl font-bold text-blue-600">{stats.topicCount}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-sm text-gray-500">Explorations</div>
          <div className="text-2xl font-bold text-green-600">{stats.explorationCount}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-sm text-gray-500">Relationships</div>
          <div className="text-2xl font-bold text-red-500">{stats.edgeCount}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-sm text-gray-500">Explorers</div>
          <div className="text-2xl font-bold text-amber-500">{stats.userCount}</div>
        </div>
      </div>

      {/* Graph Visualization */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Graph Visualization</h2>
        <KnowledgeGraphView data={graphData} />
      </div>

      {/* Topics Table */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Topics</h2>
        {topicList.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
            No topics found. Make sure the local blockchain has knowledge data.
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Path</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topicList.map((topic) => (
                  <tr key={topic.path} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <Link
                        href={`/knowledge/${encodeURIComponent(topic.path)}`}
                        className="text-blue-600 hover:underline font-mono"
                      >
                        {topic.path}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{topic.info.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{topic.info.description}</td>
                    <td className="px-4 py-3 text-sm">
                      <Link
                        href={`/accounts/${topic.info.created_by}`}
                        className="text-blue-600 hover:underline font-mono text-xs"
                      >
                        {topic.info.created_by?.slice(0, 10)}...
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {topic.info.created_at ? new Date(topic.info.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

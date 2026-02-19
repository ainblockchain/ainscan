import Link from 'next/link';
import { getValue } from '@/lib/rpc';
import { getTopicSubgraph } from '@/lib/knowledge';
import { KnowledgeTopic, KnowledgeExploration, GraphData } from '@/lib/types';
import TopicGraphView from './TopicGraphView';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { topic: string[] };
}

async function getTopicInfo(topicPath: string): Promise<KnowledgeTopic | null> {
  try {
    return await getValue(`/apps/knowledge/topics/${topicPath}/.info`);
  } catch {
    return null;
  }
}

async function getExplorations(topicPath: string): Promise<Record<string, Record<string, KnowledgeExploration>>> {
  try {
    const topicKey = topicPath.replace(/\//g, '_');
    const data = await getValue(`/apps/knowledge/explorations`);
    if (!data) return {};
    // Filter explorations that match this topic
    const result: Record<string, Record<string, KnowledgeExploration>> = {};
    for (const [address, entries] of Object.entries(data as Record<string, any>)) {
      if (entries && entries[topicKey]) {
        result[address] = entries[topicKey];
      }
    }
    return result;
  } catch {
    return {};
  }
}

async function getSubgraph(topicPath: string): Promise<GraphData> {
  try {
    return await getTopicSubgraph(topicPath);
  } catch {
    return { nodes: [], edges: [] };
  }
}

export default async function TopicPage({ params }: PageProps) {
  const topicPath = params.topic.map(decodeURIComponent).join('/');
  const [info, explorations, graphData] = await Promise.all([
    getTopicInfo(topicPath),
    getExplorations(topicPath),
    getSubgraph(topicPath),
  ]);

  // Flatten explorations into a list
  const explorationList: { address: string; entryId: string; data: KnowledgeExploration }[] = [];
  for (const [address, entries] of Object.entries(explorations)) {
    for (const [entryId, data] of Object.entries(entries)) {
      if (data && typeof data === 'object' && 'title' in data) {
        explorationList.push({ address, entryId, data: data as KnowledgeExploration });
      }
    }
  }

  // Compute stats
  const explorerCount = Object.keys(explorations).length;
  const depths = explorationList.map((e) => e.data.depth).filter(Boolean);
  const maxDepth = depths.length > 0 ? Math.max(...depths) : 0;
  const avgDepth = depths.length > 0 ? (depths.reduce((a, b) => a + b, 0) / depths.length).toFixed(1) : '0';

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4">
        <Link href="/knowledge" className="text-sm text-blue-600 hover:underline">
          &larr; Back to Knowledge Graph
        </Link>
      </div>

      {/* Topic Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{info?.title || topicPath}</h1>
            <p className="mt-1 text-sm text-gray-500 font-mono">{topicPath}</p>
          </div>
        </div>
        {info && (
          <div className="mt-4 space-y-2">
            <p className="text-gray-700">{info.description}</p>
            <div className="flex gap-6 text-sm text-gray-500">
              <div>
                Created by{' '}
                <Link href={`/accounts/${info.created_by}`} className="text-blue-600 hover:underline font-mono">
                  {info.created_by?.slice(0, 10)}...
                </Link>
              </div>
              {info.created_at && (
                <div>on {new Date(info.created_at).toLocaleDateString()}</div>
              )}
            </div>
          </div>
        )}
        {!info && (
          <p className="mt-4 text-gray-500">Topic info not found on-chain.</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-sm text-gray-500">Explorers</div>
          <div className="text-2xl font-bold text-amber-500">{explorerCount}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-sm text-gray-500">Max Depth</div>
          <div className="text-2xl font-bold text-blue-600">{maxDepth}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-sm text-gray-500">Avg Depth</div>
          <div className="text-2xl font-bold text-green-600">{avgDepth}</div>
        </div>
      </div>

      {/* Subgraph */}
      {graphData.nodes.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Topic Subgraph</h2>
          <TopicGraphView data={graphData} />
        </div>
      )}

      {/* Explorations Table */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Explorations ({explorationList.length})
        </h2>
        {explorationList.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
            No explorations found for this topic.
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Explorer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Depth</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {explorationList.map((exp) => {
                  const nodeId = `${exp.address}_${topicPath.replace(/\//g, '_')}_${exp.entryId}`;
                  return (
                    <tr key={`${exp.address}-${exp.entryId}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <Link
                          href={`/knowledge/exploration/${encodeURIComponent(nodeId)}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {exp.data.title}
                        </Link>
                        {exp.data.summary && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-md">{exp.data.summary}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link
                          href={`/accounts/${exp.address}`}
                          className="text-blue-600 hover:underline font-mono text-xs"
                        >
                          {exp.address.slice(0, 10)}...
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{exp.data.depth}</td>
                      <td className="px-4 py-3 text-sm">
                        {exp.data.price ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            {exp.data.price} AIN
                          </span>
                        ) : (
                          <span className="text-green-600 text-xs">Free</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {exp.data.created_at ? new Date(exp.data.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

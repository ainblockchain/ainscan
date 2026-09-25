import { NextRequest, NextResponse } from 'next/server';
import { getKnowledgeGraph, getTopicSubgraph, getExplorationNeighbors, getGraphStats } from '@/lib/knowledge';
import { DEFAULT_NETWORK, isNetwork } from '@/lib/network';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params, network = DEFAULT_NETWORK } = body;
    if (!isNetwork(network)) {
      return NextResponse.json({ error: 'Unsupported network' }, { status: 400 });
    }

    switch (action) {
      case 'stats':
        return NextResponse.json(await getGraphStats(network));

      case 'graph':
        return NextResponse.json(await getKnowledgeGraph(network));

      case 'topic':
        if (!params?.topicPath) {
          return NextResponse.json({ error: 'topicPath required' }, { status: 400 });
        }
        return NextResponse.json(await getTopicSubgraph(network, params.topicPath));

      case 'exploration':
        if (!params?.nodeId) {
          return NextResponse.json({ error: 'nodeId required' }, { status: 400 });
        }
        return NextResponse.json(await getExplorationNeighbors(network, params.nodeId));

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Knowledge API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

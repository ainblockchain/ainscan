import { NextRequest, NextResponse } from 'next/server';
import { getKnowledgeGraph, getTopicSubgraph, getExplorationNeighbors, getGraphStats } from '@/lib/knowledge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    switch (action) {
      case 'stats':
        return NextResponse.json(await getGraphStats());

      case 'graph':
        return NextResponse.json(await getKnowledgeGraph());

      case 'topic':
        if (!params?.topicPath) {
          return NextResponse.json({ error: 'topicPath required' }, { status: 400 });
        }
        return NextResponse.json(await getTopicSubgraph(params.topicPath));

      case 'exploration':
        if (!params?.nodeId) {
          return NextResponse.json({ error: 'nodeId required' }, { status: 400 });
        }
        return NextResponse.json(await getExplorationNeighbors(params.nodeId));

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

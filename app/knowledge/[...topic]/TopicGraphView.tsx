'use client';

import dynamic from 'next/dynamic';
import { GraphData } from '@/lib/types';

const KnowledgeGraph = dynamic(() => import('@/components/KnowledgeGraph'), { ssr: false });

export default function TopicGraphView({ data }: { data: GraphData }) {
  return <KnowledgeGraph data={data} height="400px" />;
}

'use client';

import dynamic from 'next/dynamic';
import { GraphData } from '@/lib/types';

const KnowledgeGraph = dynamic(() => import('@/components/KnowledgeGraph'), { ssr: false });

export default function KnowledgeGraphView({ data }: { data: GraphData }) {
  return <KnowledgeGraph data={data} height="500px" />;
}

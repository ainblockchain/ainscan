'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Node, Relationship } from '@neo4j-nvl/base';
import { InteractiveNvlWrapper } from '@neo4j-nvl/react';
import type { MouseEventCallbacks } from '@neo4j-nvl/react';
import { GraphData } from '@/lib/types';

const NODE_COLORS: Record<string, string> = {
  Topic: '#3B82F6',       // blue
  Exploration: '#10B981', // green
  User: '#F59E0B',        // amber
};

const NODE_SIZES: Record<string, number> = {
  Topic: 30,
  Exploration: 20,
  User: 15,
};

const EDGE_COLORS: Record<string, string> = {
  BUILDS_ON: '#EF4444',    // red
  PARENT_OF: '#9CA3AF',    // gray
  IN_TOPIC: '#3B82F6',     // blue
  EXPLORED: '#10B981',     // green
  extends: '#EF4444',
  related: '#8B5CF6',      // purple
  prerequisite: '#F59E0B', // amber
};

interface Props {
  data?: GraphData;
  action?: string;
  params?: Record<string, any>;
  height?: string;
  onNodeClick?: (nodeId: string, label: string) => void;
}

export default function KnowledgeGraph({ data: initialData, action, params, height = '500px', onNodeClick }: Props) {
  const router = useRouter();
  const [graphData, setGraphData] = useState<GraphData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  useEffect(() => {
    if (initialData) {
      setGraphData(initialData);
      return;
    }
    if (!action) return;

    setLoading(true);
    fetch('/api/neo4j', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, params }),
    })
      .then((res) => res.json())
      .then((data) => {
        setGraphData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [action, params, initialData]);

  const nvlNodes: Node[] = (graphData?.nodes || []).map((n) => ({
    id: n.id,
    size: NODE_SIZES[n.label] || 15,
    color: NODE_COLORS[n.label] || '#6B7280',
    caption: n.properties.title || n.properties.name || n.label,
  }));

  const nvlRelationships: Relationship[] = (graphData?.edges || []).map((e) => ({
    id: e.id,
    from: e.from,
    to: e.to,
    caption: e.type,
    color: EDGE_COLORS[e.type] || '#9CA3AF',
    width: 2,
  }));

  const handleNodeClick = useCallback(
    (node: Node) => {
      if (onNodeClick) {
        const graphNode = graphData?.nodes.find((n) => n.id === node.id);
        onNodeClick(node.id, graphNode?.label || '');
        return;
      }
      const graphNode = graphData?.nodes.find((n) => n.id === node.id);
      if (!graphNode) return;
      if (graphNode.label === 'Topic') {
        router.push(`/knowledge/${encodeURIComponent(graphNode.id)}`);
      } else if (graphNode.label === 'Exploration') {
        router.push(`/knowledge/exploration/${encodeURIComponent(graphNode.id)}`);
      } else if (graphNode.label === 'User') {
        router.push(`/accounts/${graphNode.properties.address || graphNode.id}`);
      }
    },
    [graphData, router, onNodeClick]
  );

  const mouseEventCallbacks: MouseEventCallbacks = {
    onNodeClick: (node) => handleNodeClick(node),
    onHover: (element, hitTargets, evt) => {
      if (element && 'id' in element) {
        const graphNode = graphData?.nodes.find((n) => n.id === element.id);
        if (graphNode) {
          setTooltip({
            x: evt.clientX,
            y: evt.clientY,
            text: `${graphNode.label}: ${graphNode.properties.title || graphNode.id}`,
          });
          return;
        }
      }
      setTooltip(null);
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200" style={{ height }}>
        <div className="text-gray-500">Loading graph...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center bg-red-50 rounded-lg border border-red-200" style={{ height }}>
        <div className="text-red-600">Failed to load graph: {error}</div>
      </div>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200" style={{ height }}>
        <div className="text-gray-500">No graph data available</div>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg border border-gray-200 overflow-hidden" style={{ height }}>
      <InteractiveNvlWrapper
        nodes={nvlNodes}
        rels={nvlRelationships}
        mouseEventCallbacks={mouseEventCallbacks}
        nvlOptions={{
          allowDynamicMinZoom: true,
          layout: 'forceDirected',
          renderer: 'canvas',
        }}
      />
      {tooltip && (
        <div
          className="absolute z-10 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md pointer-events-none shadow-lg"
          style={{ left: tooltip.x + 10, top: tooltip.y - 30 }}
        >
          {tooltip.text}
        </div>
      )}
      <div className="absolute bottom-3 left-3 flex gap-3 text-xs">
        {Object.entries(NODE_COLORS).map(([label, color]) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-gray-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GraphData } from '@/lib/types';

const NODE_COLORS: Record<string, string> = {
  Topic: '#3B82F6',       // blue
  Exploration: '#10B981', // green
  User: '#F59E0B',        // amber
};

const NODE_SIZES: Record<string, number> = {
  Topic: 14,
  Exploration: 10,
  User: 8,
};

const EDGE_COLORS: Record<string, string> = {
  extends: '#EF4444',      // red
  related: '#8B5CF6',      // purple
  prerequisite: '#F59E0B', // amber
  in_topic: '#60A5FA',     // light blue
  subtopic: '#93C5FD',     // lighter blue
  explored: '#34D399',     // light green
};

interface SimNode {
  id: string;
  label: string;
  caption: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  properties: Record<string, any>;
}

interface SimEdge {
  from: string;
  to: string;
  type: string;
  color: string;
}

interface Props {
  data?: GraphData;
  height?: string;
  onNodeClick?: (nodeId: string, label: string) => void;
}

export default function KnowledgeGraph({ data, height = '500px', onNodeClick }: Props) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<SimNode[]>([]);
  const edgesRef = useRef<SimEdge[]>([]);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const panRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{ node: SimNode; offsetX: number; offsetY: number } | null>(null);

  // Initialize simulation data
  useEffect(() => {
    if (!data || data.nodes.length === 0) return;

    const w = canvasRef.current?.clientWidth || 800;
    const h = canvasRef.current?.clientHeight || 500;

    nodesRef.current = data.nodes.map((n, i) => ({
      id: n.id,
      label: n.label,
      caption: n.properties.title || n.properties.name || n.label,
      x: w / 2 + (Math.random() - 0.5) * w * 0.6,
      y: h / 2 + (Math.random() - 0.5) * h * 0.6,
      vx: 0,
      vy: 0,
      size: NODE_SIZES[n.label] || 8,
      color: NODE_COLORS[n.label] || '#6B7280',
      properties: n.properties,
    }));

    edgesRef.current = data.edges.map((e) => ({
      from: e.from,
      to: e.to,
      type: e.type,
      color: EDGE_COLORS[e.type] || '#D1D5DB',
    }));

    panRef.current = { x: 0, y: 0 };
  }, [data]);

  // Force simulation + render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let iteration = 0;
    const maxIterations = 300;

    function tick() {
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      if (nodes.length === 0) return;

      const alpha = Math.max(0.001, 1 - iteration / maxIterations);
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));

      // Repulsion (all pairs)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (200 * alpha) / dist;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }

      // Attraction (edges)
      for (const edge of edges) {
        const a = nodeMap.get(edge.from);
        const b = nodeMap.get(edge.to);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 80) * 0.05 * alpha;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }

      // Center gravity
      const cx = canvas!.width / (2 * devicePixelRatio);
      const cy = canvas!.height / (2 * devicePixelRatio);
      for (const node of nodes) {
        node.vx += (cx - node.x) * 0.01 * alpha;
        node.vy += (cy - node.y) * 0.01 * alpha;
      }

      // Apply velocity with damping
      for (const node of nodes) {
        if (dragRef.current?.node.id === node.id) continue;
        node.vx *= 0.6;
        node.vy *= 0.6;
        node.x += node.vx;
        node.y += node.vy;
      }

      iteration++;
    }

    function render() {
      if (!canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(panRef.current.x, panRef.current.y);

      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));

      // Draw edges
      for (const edge of edges) {
        const a = nodeMap.get(edge.from);
        const b = nodeMap.get(edge.to);
        if (!a || !b) continue;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = edge.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Draw nodes
      for (const node of nodes) {
        const isHovered = hovered === node.id;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size + (isHovered ? 3 : 0), 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
        if (isHovered) {
          ctx.strokeStyle = '#111827';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Draw labels for larger nodes or hovered
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (const node of nodes) {
        if (node.size >= 12 || hovered === node.id) {
          const label = node.caption.length > 24 ? node.caption.slice(0, 22) + '...' : node.caption;
          ctx.fillStyle = '#374151';
          ctx.fillText(label, node.x, node.y + node.size + 4);
        }
      }

      ctx.restore();

      tick();
      animRef.current = requestAnimationFrame(render);
    }

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [data, hovered]);

  // Mouse interactions
  const findNodeAt = useCallback((clientX: number, clientY: number): SimNode | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left - panRef.current.x;
    const y = clientY - rect.top - panRef.current.y;

    for (const node of nodesRef.current) {
      const dx = node.x - x;
      const dy = node.y - y;
      if (dx * dx + dy * dy < (node.size + 4) * (node.size + 4)) {
        return node;
      }
    }
    return null;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragRef.current) {
      const rect = canvasRef.current!.getBoundingClientRect();
      dragRef.current.node.x = e.clientX - rect.left - panRef.current.x;
      dragRef.current.node.y = e.clientY - rect.top - panRef.current.y;
      dragRef.current.node.vx = 0;
      dragRef.current.node.vy = 0;
      return;
    }

    const node = findNodeAt(e.clientX, e.clientY);
    if (node) {
      setHovered(node.id);
      setTooltip({
        x: e.clientX - (canvasRef.current?.getBoundingClientRect().left || 0),
        y: e.clientY - (canvasRef.current?.getBoundingClientRect().top || 0),
        text: `${node.label}: ${node.caption}`,
      });
    } else {
      setHovered(null);
      setTooltip(null);
    }
  }, [findNodeAt]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const node = findNodeAt(e.clientX, e.clientY);
    if (node) {
      dragRef.current = { node, offsetX: 0, offsetY: 0 };
    }
  }, [findNodeAt]);

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const node = findNodeAt(e.clientX, e.clientY);
    if (!node) return;

    if (onNodeClick) {
      onNodeClick(node.id, node.label);
      return;
    }

    if (node.label === 'Topic') {
      const topicPath = node.properties.topic_path || node.id.replace(/^topic:/, '');
      router.push(`/knowledge/${encodeURIComponent(topicPath)}`);
    } else if (node.label === 'Exploration') {
      router.push(`/knowledge/exploration/${encodeURIComponent(node.id)}`);
    } else if (node.label === 'User') {
      const address = node.properties.address || node.id.replace(/^user:/, '');
      router.push(`/accounts/${address}`);
    }
  }, [onNodeClick, router]);

  if (!data || data.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200" style={{ height }}>
        <div className="text-gray-500">No graph data available</div>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg border border-gray-200 overflow-hidden" style={{ height }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
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

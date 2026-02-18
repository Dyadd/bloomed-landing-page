/**
 * GraphCanvas.tsx
 *
 * Pure SVG rendering component. Renders nodes and edges as SVG elements
 * with unique IDs. GSAP targets these IDs directly — this component
 * never updates after mount (wrapped in React.memo with static props).
 */

import { memo } from 'react';
import type { GraphNode, GraphEdge } from '../data/graphTypes';

const CATEGORY_COLORS: Record<string, string> = {
  foundational: '#6366f1',
  pathological: '#8b5cf6',
  clinical:     '#3b82f6',
  specialty:    '#06b6d4',
};

const NODE_RADIUS = 7;

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

function GraphCanvas({ nodes, edges }: Props) {
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  return (
    <svg
      viewBox="0 0 740 500"
      className="w-full h-full"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Glow filter for nodes */}
        <filter id="glow-node" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* -- EDGES -- */}
      <g>
        {edges.map(edge => {
          const src = nodeMap[edge.source];
          const tgt = nodeMap[edge.target];
          if (!src || !tgt) return null;
          return (
            <line
              key={edge.id}
              id={`edge-${edge.id}`}
              x1={src.x}
              y1={src.y}
              x2={tgt.x}
              y2={tgt.y}
              stroke="var(--color-edge)"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          );
        })}
      </g>

      {/* -- NODES -- */}
      <g>
        {nodes.map(node => {
          const color = CATEGORY_COLORS[node.category];
          const labelLines = node.label.split('\n');

          return (
            <g
              key={node.id}
              id={`node-${node.id}`}
              transform={`translate(${node.x}, ${node.y})`}
            >
              {/* Outer glow ring — animated by GSAP for pulse effects */}
              <circle
                id={`node-${node.id}-ring`}
                r={13}
                fill="none"
                stroke={color}
                strokeWidth={1}
                opacity={0.15}
              />
              {/* Main node dot */}
              <circle
                id={`node-${node.id}-dot`}
                r={NODE_RADIUS}
                fill={color}
                filter="url(#glow-node)"
              />
              {/* Label — rendered above the node */}
              {labelLines.map((line, i) => (
                <text
                  key={i}
                  y={-(NODE_RADIUS + 10 + (labelLines.length - 1 - i) * 13)}
                  textAnchor="middle"
                  fontSize="9.5"
                  fill="var(--color-label)"
                  fontFamily="Inter, system-ui, sans-serif"
                  fontWeight="500"
                  letterSpacing="0.03em"
                >
                  {line}
                </text>
              ))}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// Wrapped in memo: since nodes/edges are module-level constants,
// this component never re-renders — keeping GSAP's DOM mutations intact.
export default memo(GraphCanvas);

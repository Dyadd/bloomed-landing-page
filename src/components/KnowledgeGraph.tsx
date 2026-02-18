/**
 * KnowledgeGraph.tsx
 *
 * Root graph component. Receives the current scroll phase as a prop,
 * and runs the corresponding GSAP animation when it changes.
 *
 * The actual SVG is rendered by GraphCanvas (memo'd, never re-renders),
 * so GSAP can safely mutate SVG attributes without React overwriting them.
 */

import { useEffect, useRef } from 'react';
import GraphCanvas from './GraphCanvas';
import { GRAPH_NODES, GRAPH_EDGES } from '../data/graphData';
import { toAmbient, toDiagnostic, toRepair, toSolidify } from '../animations/graphAnimations';
import type { GraphPhase } from '../data/graphTypes';

interface Props {
  phase: GraphPhase;
}

export default function KnowledgeGraph({ phase }: Props) {
  const timelineRef = useRef<{ kill: () => void } | null>(null);
  const prevPhaseRef = useRef<GraphPhase>('ambient');

  // Run initial ambient animation once on mount
  useEffect(() => {
    timelineRef.current = toAmbient();
    return () => {
      timelineRef.current?.kill();
    };
  }, []);

  // React to phase changes driven by scroll
  useEffect(() => {
    if (phase === prevPhaseRef.current) return;

    // Kill whatever is currently animating
    timelineRef.current?.kill();
    prevPhaseRef.current = phase;

    switch (phase) {
      case 'diagnostic': timelineRef.current = toDiagnostic(); break;
      case 'repair':     timelineRef.current = toRepair();     break;
      case 'solidify':   timelineRef.current = toSolidify();   break;
      default:           timelineRef.current = toAmbient();    break;
    }
  }, [phase]);

  return (
    <div className="w-full h-full">
      <GraphCanvas nodes={GRAPH_NODES} edges={GRAPH_EDGES} />
    </div>
  );
}

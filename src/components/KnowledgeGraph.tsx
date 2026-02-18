/**
 * KnowledgeGraph.tsx
 *
 * Manages two animation layers that coexist without conflict:
 *
 *  Layer 1 — D3 force simulation
 *    Gives every node Obsidian-like physics: nodes repel each other,
 *    edges act as springs, and users can drag nodes freely.
 *    D3 owns: node <g> transform,  edge line x1/y1/x2/y2  (position)
 *
 *  Layer 2 — GSAP scroll animations
 *    Narrative phase animations triggered by scroll position.
 *    GSAP owns: fill, stroke, r, opacity, stroke-dashoffset  (style/motion)
 *
 *  Because each layer targets different SVG attributes they never conflict.
 */

import { useEffect, useRef } from 'react';
import GraphCanvas from './GraphCanvas';
import { GRAPH_NODES, GRAPH_EDGES } from '../data/graphData';
import { toAmbient, toDiagnostic, toRepair, toSolidify } from '../animations/graphAnimations';
import type { GraphPhase } from '../data/graphTypes';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from 'd3-force';
import type { SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';
import { drag } from 'd3-drag';
import { select } from 'd3-selection';

interface SimNode extends SimulationNodeDatum {
  id: string;
  category: string;
}

interface SimEdge extends SimulationLinkDatum<SimNode> {
  edgeId: string;
}

interface Props {
  phase: GraphPhase;
}

export default function KnowledgeGraph({ phase }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef  = useRef<{ kill: () => void } | null>(null);
  const prevPhaseRef = useRef<GraphPhase>('ambient');

  // ── D3 force simulation (mount only) ───────────────────────────────────────
  useEffect(() => {
    const svgEl = containerRef.current?.querySelector<SVGSVGElement>('svg') ?? null;

    // Mutable copies — D3 writes x/y/vx/vy directly on these objects
    const simNodes: SimNode[] = GRAPH_NODES.map(n => ({
      id: n.id,
      category: n.category,
      x: n.x,
      y: n.y,
    }));

    const simEdges: SimEdge[] = GRAPH_EDGES.map(e => ({
      edgeId: e.id,
      source: e.source,
      target: e.target,
    }));

    const sim = forceSimulation<SimNode>(simNodes)
      .force(
        'link',
        forceLink<SimNode, SimEdge>(simEdges)
          .id(d => d.id)
          .distance(120)
          .strength(0.35),
      )
      .force('charge',  forceManyBody<SimNode>().strength(-130))
      .force('center',  forceCenter(370, 250))
      .force('collide', forceCollide<SimNode>(38))
      .alpha(0.18)       // warm but gentle — initial positions barely shift
      .alphaDecay(0.04); // settles in ~60 ticks (~1.5 s)

    // Tick: push D3-computed positions straight into the DOM
    sim.on('tick', () => {
      simNodes.forEach(node => {
        // Clamp inside the SVG viewport
        node.x = Math.max(55, Math.min(685, node.x!));
        node.y = Math.max(45, Math.min(455, node.y!));

        document
          .getElementById(`node-${node.id}`)
          ?.setAttribute('transform', `translate(${node.x}, ${node.y})`);
      });

      simEdges.forEach(edge => {
        const src = edge.source as SimNode;
        const tgt = edge.target as SimNode;
        const el  = document.getElementById(`edge-${edge.edgeId}`);
        if (!el) return;
        el.setAttribute('x1', String(Math.round(src.x ?? 0)));
        el.setAttribute('y1', String(Math.round(src.y ?? 0)));
        el.setAttribute('x2', String(Math.round(tgt.x ?? 0)));
        el.setAttribute('y2', String(Math.round(tgt.y ?? 0)));
      });
    });

    // ── Drag behaviour ────────────────────────────────────────────────────────
    if (svgEl) {
      simNodes.forEach(simNode => {
        const groupEl = document.getElementById(`node-${simNode.id}`) as SVGGElement | null;
        if (!groupEl) return;

        groupEl.style.cursor = 'grab';

        const dragBehavior = drag<SVGGElement, unknown>()
          .on('start', (event) => {
            if (!event.active) sim.alphaTarget(0.3).restart();
            simNode.fx = simNode.x;
            simNode.fy = simNode.y;
            groupEl.style.cursor = 'grabbing';
          })
          .on('drag', (event) => {
            const [sx, sy] = clientToSVG(svgEl, event.sourceEvent as MouseEvent | TouchEvent);
            simNode.fx = Math.max(55, Math.min(685, sx));
            simNode.fy = Math.max(45, Math.min(455, sy));
          })
          .on('end', (event) => {
            if (!event.active) sim.alphaTarget(0);
            simNode.fx = null;
            simNode.fy = null;
            groupEl.style.cursor = 'grab';
          });

        select(groupEl).call(dragBehavior);
      });
    }

    // Start GSAP ambient phase
    timelineRef.current = toAmbient();

    return () => {
      sim.stop();
      timelineRef.current?.kill();
    };
  }, []);

  // ── Scroll-phase changes → GSAP animation ─────────────────────────────────
  useEffect(() => {
    if (phase === prevPhaseRef.current) return;
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
    <div ref={containerRef} className="w-full h-full">
      <GraphCanvas nodes={GRAPH_NODES} edges={GRAPH_EDGES} />
    </div>
  );
}

// ── Helper ─────────────────────────────────────────────────────────────────────

/** Convert a client-space mouse/touch event to SVG viewBox coordinates */
function clientToSVG(
  svg: SVGSVGElement,
  event: MouseEvent | TouchEvent,
): [number, number] {
  const ctm = svg.getScreenCTM();
  if (!ctm) return [0, 0];

  const clientX = event instanceof TouchEvent
    ? (event.touches[0]?.clientX ?? event.changedTouches[0]?.clientX ?? 0)
    : event.clientX;
  const clientY = event instanceof TouchEvent
    ? (event.touches[0]?.clientY ?? event.changedTouches[0]?.clientY ?? 0)
    : event.clientY;

  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const svgPt = pt.matrixTransform(ctm.inverse());
  return [svgPt.x, svgPt.y];
}

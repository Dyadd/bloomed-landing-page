/**
 * graphAnimations.ts
 *
 * GSAP animation functions for each phase of the knowledge graph narrative.
 * Each function returns a GSAP timeline so the caller can kill it later.
 *
 * Phase flow:  ambient → diagnostic → repair → solidify
 *
 * Elements are targeted by their SVG IDs (set in GraphCanvas.tsx):
 *   #edge-{edgeId}          — the <line> element for each edge
 *   #node-{nodeId}          — the <g> group wrapping each node
 *   #node-{nodeId}-dot      — the <circle> dot of each node
 *   #node-{nodeId}-ring     — the outer glow ring <circle>
 *   #repair-particle        — a <circle> that travels along the repaired edge
 */

import { gsap } from 'gsap';
import {
  GRAPH_NODES,
  GRAPH_EDGES,
  GAP_SOURCE_ID,
  GAP_TARGET_ID,
  BROKEN_EDGE_ID,
  BROKEN_EDGE_LENGTH,
} from '../data/graphData';

// Category colours — must match GraphCanvas.tsx
const CATEGORY_COLORS: Record<string, string> = {
  foundational: '#818cf8',
  pathological: '#a78bfa',
  clinical:     '#60a5fa',
  specialty:    '#22d3ee',
};

// We store the repeating diagnostic-pulse tween here so we can kill it
// when the user scrolls into the next phase.
let _pulseTween: gsap.core.Tween | null = null;

function killPulse() {
  if (_pulseTween) {
    _pulseTween.kill();
    _pulseTween = null;
  }
}

// ─────────────────────────────────────────────
// AMBIENT  — the graph's resting state
// ─────────────────────────────────────────────
export function toAmbient(): gsap.core.Timeline {
  killPulse();
  const tl = gsap.timeline();

  GRAPH_EDGES.forEach(edge => {
    tl.set(`#edge-${edge.id}`, {
      attr: {
        stroke: 'rgba(148, 163, 184, 0.25)',
        'stroke-width': 1.5,
        'stroke-dasharray': '9999', // large number = visually solid
        'stroke-dashoffset': 0,
      },
    }, 0);
  });

  GRAPH_NODES.forEach(node => {
    const color = CATEGORY_COLORS[node.category];
    tl.to(`#node-${node.id}`,      { opacity: 1, duration: 0.4 }, 0);
    tl.to(`#node-${node.id}-dot`,  { attr: { fill: color, r: 7 }, duration: 0.4 }, 0);
    tl.to(`#node-${node.id}-ring`, { attr: { r: 13, stroke: color }, opacity: 0.15, duration: 0.4 }, 0);
  });

  tl.set('#repair-particle', { opacity: 0 }, 0);
  return tl;
}

// ─────────────────────────────────────────────
// DIAGNOSTIC  — the broken connection is revealed
// ─────────────────────────────────────────────
export function toDiagnostic(): gsap.core.Timeline {
  killPulse();
  const tl = gsap.timeline();

  // Dim all non-broken edges
  GRAPH_EDGES.forEach(edge => {
    if (edge.id !== BROKEN_EDGE_ID) {
      tl.to(`#edge-${edge.id}`, {
        attr: { stroke: 'rgba(148, 163, 184, 0.07)' },
        duration: 0.5,
      }, 0);
    }
  });

  // Broken edge → red + dashed (set dasharray instantly, tween colour)
  tl.to(`#edge-${BROKEN_EDGE_ID}`, {
    attr: { stroke: '#f43f5e', 'stroke-width': 2.5 },
    duration: 0.5,
  }, 0);
  tl.set(`#edge-${BROKEN_EDGE_ID}`, {
    attr: { 'stroke-dasharray': '8 6', 'stroke-dashoffset': 0 },
  }, 0.05);

  // Dim non-gap nodes
  GRAPH_NODES.forEach(node => {
    if (node.id !== GAP_SOURCE_ID && node.id !== GAP_TARGET_ID) {
      tl.to(`#node-${node.id}`, { opacity: 0.18, duration: 0.5 }, 0);
    }
  });

  // Gap source (Pathology) → red
  tl.to(`#node-${GAP_SOURCE_ID}`,      { opacity: 1, duration: 0.3 }, 0.15);
  tl.to(`#node-${GAP_SOURCE_ID}-dot`,  { attr: { fill: '#f43f5e', r: 9 }, duration: 0.4 }, 0.2);
  tl.to(`#node-${GAP_SOURCE_ID}-ring`, { attr: { r: 13, stroke: '#f43f5e' }, opacity: 0.3, duration: 0.3 }, 0.2);

  // Gap target (Clinical Reasoning) → red
  tl.to(`#node-${GAP_TARGET_ID}`,      { opacity: 1, duration: 0.3 }, 0.25);
  tl.to(`#node-${GAP_TARGET_ID}-dot`,  { attr: { fill: '#f43f5e', r: 9 }, duration: 0.4 }, 0.3);
  tl.to(`#node-${GAP_TARGET_ID}-ring`, { attr: { r: 13, stroke: '#f43f5e' }, opacity: 0.3, duration: 0.3 }, 0.3);

  // Start the repeating ring pulse *after* the initial animations settle
  tl.call(() => {
    _pulseTween = gsap.to(
      [`#node-${GAP_SOURCE_ID}-ring`, `#node-${GAP_TARGET_ID}-ring`],
      {
        attr: { r: 22, stroke: '#f43f5e' },
        opacity: 0.55,
        duration: 0.9,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      }
    );
  }, [], 0.55);

  return tl;
}

// ─────────────────────────────────────────────
// REPAIR  — the broken connection is rebuilt
// ─────────────────────────────────────────────
export function toRepair(): gsap.core.Timeline {
  killPulse();
  const tl = gsap.timeline();

  // Restore non-broken edges to a visible (but muted) state
  GRAPH_EDGES.forEach(edge => {
    if (edge.id !== BROKEN_EDGE_ID) {
      tl.to(`#edge-${edge.id}`, {
        attr: { stroke: 'rgba(148, 163, 184, 0.18)' },
        duration: 0.4,
      }, 0);
    }
  });

  // Restore non-gap nodes
  GRAPH_NODES.forEach(node => {
    if (node.id !== GAP_SOURCE_ID && node.id !== GAP_TARGET_ID) {
      tl.to(`#node-${node.id}`, { opacity: 0.65, duration: 0.4 }, 0);
    }
  });

  // Gap source → cyan (Bloomed engaging with the source node)
  tl.to(`#node-${GAP_SOURCE_ID}-dot`,  { attr: { fill: '#06b6d4', r: 8 }, duration: 0.4 }, 0.1);
  tl.to(`#node-${GAP_SOURCE_ID}-ring`, { attr: { r: 14, stroke: '#06b6d4' }, opacity: 0.35, duration: 0.4 }, 0.1);

  // Prepare the broken edge for the draw-in animation:
  // Set colour to cyan and set dasharray = full length, dashoffset = full length (invisible)
  tl.set(`#edge-${BROKEN_EDGE_ID}`, {
    attr: {
      stroke: '#06b6d4',
      'stroke-width': 2.5,
      'stroke-dasharray': BROKEN_EDGE_LENGTH,
      'stroke-dashoffset': BROKEN_EDGE_LENGTH,
    },
  }, 0.2);

  // Show the repair particle at the source node position
  const src = GRAPH_NODES.find(n => n.id === GAP_SOURCE_ID)!;
  const tgt = GRAPH_NODES.find(n => n.id === GAP_TARGET_ID)!;
  tl.set('#repair-particle', { attr: { cx: src.x, cy: src.y }, opacity: 1 }, 0.25);

  // Particle travels from source → target  (1.3 s, linear)
  tl.to('#repair-particle', {
    attr: { cx: tgt.x, cy: tgt.y },
    duration: 1.3,
    ease: 'none',
  }, 0.3);
  tl.to('#repair-particle', { opacity: 0, duration: 0.25 }, 1.55);

  // Edge draws itself in from source → target  (stroke-dashoffset 163 → 0)
  tl.to(`#edge-${BROKEN_EDGE_ID}`, {
    attr: { 'stroke-dashoffset': 0 },
    duration: 1.3,
    ease: 'power2.inOut',
  }, 0.3);

  // Target node lights up as the edge arrives
  tl.to(`#node-${GAP_TARGET_ID}-dot`,  { attr: { fill: '#06b6d4', r: 10 }, duration: 0.5 }, 1.45);
  tl.to(`#node-${GAP_TARGET_ID}-ring`, { attr: { r: 17, stroke: '#06b6d4' }, opacity: 0.5, duration: 0.5 }, 1.45);

  return tl;
}

// ─────────────────────────────────────────────
// SOLIDIFY  — knowledge is complete and locked in
// ─────────────────────────────────────────────
export function toSolidify(): gsap.core.Timeline {
  killPulse();
  const tl = gsap.timeline();

  tl.set('#repair-particle', { opacity: 0 }, 0);

  // Restore all non-broken edges
  GRAPH_EDGES.forEach(edge => {
    if (edge.id !== BROKEN_EDGE_ID) {
      tl.to(`#edge-${edge.id}`, {
        attr: { stroke: 'rgba(148, 163, 184, 0.38)', 'stroke-width': 1.5 },
        duration: 0.4,
      }, 0);
    }
  });

  // Broken edge → solid green, prominent
  tl.to(`#edge-${BROKEN_EDGE_ID}`, {
    attr: { stroke: '#10b981', 'stroke-width': 3, 'stroke-dashoffset': 0 },
    duration: 0.4,
  }, 0);
  tl.set(`#edge-${BROKEN_EDGE_ID}`, { attr: { 'stroke-dasharray': '9999' } }, 0.35);

  // All nodes: staggered green-pulse ripple then settle back to category colour
  GRAPH_NODES.forEach((node, i) => {
    const color = CATEGORY_COLORS[node.category];
    const d = i * 0.055; // stagger delay

    tl.to(`#node-${node.id}`,      { opacity: 1, duration: 0.3 }, d);

    // Flash green
    tl.to(`#node-${node.id}-ring`, { attr: { r: 20, stroke: '#10b981' }, opacity: 0.65, duration: 0.3 }, d);
    tl.to(`#node-${node.id}-dot`,  { attr: { fill: '#10b981', r: 9 }, duration: 0.3 }, d);

    // Settle to category colour (slightly brighter than ambient)
    tl.to(`#node-${node.id}-ring`, { attr: { r: 13, stroke: color }, opacity: 0.22, duration: 0.45 }, d + 0.38);
    tl.to(`#node-${node.id}-dot`,  { attr: { fill: color, r: 8 }, duration: 0.45 }, d + 0.38);
  });

  // The two previously-broken nodes stay green to celebrate the repair
  const finalDelay = GRAPH_NODES.length * 0.055 + 0.45;
  tl.to(`#node-${GAP_SOURCE_ID}-dot`, { attr: { fill: '#10b981' }, duration: 0.3 }, finalDelay);
  tl.to(`#node-${GAP_TARGET_ID}-dot`, { attr: { fill: '#10b981' }, duration: 0.3 }, finalDelay);

  return tl;
}

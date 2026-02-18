/**
 * graphAnimations.ts
 *
 * Key fixes over v1:
 *  - Particle + edge draw share the same ease → always in sync
 *  - Ambient has continuous breathing so the graph is never static
 *  - Diagnostic: "marching ants" on broken edge + disconnect flash + bounce-in nodes
 *  - Repair: launch burst at source, connection burst at target, node bounces
 *  - Solidify: wave ripple outward from the repaired edge, nodes bounce with back.out
 *
 * D3 integration:
 *  - getNodePos() / getLiveEdgeLength() read live DOM attributes so repair
 *    and solidify animations stay correct after nodes have been dragged.
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

const CATEGORY_COLORS: Record<string, string> = {
  foundational: '#818cf8',
  pathological: '#a78bfa',
  clinical:     '#60a5fa',
  specialty:    '#22d3ee',
};

// ── Tween store — kill all repeating animations before each phase change ─────
let _breathing: gsap.core.Tween | null = null;
let _pulse:     gsap.core.Tween | null = null;
let _march:     gsap.core.Tween | null = null;

function killAll() {
  _breathing?.kill(); _breathing = null;
  _pulse?.kill();     _pulse     = null;
  _march?.kill();     _march     = null;
}

// ── Shared ease + duration for the repair draw ───────────────────────────────
// Changing either constant here keeps particle and edge mathematically in sync.
const REPAIR_EASE     = 'power2.inOut';
const REPAIR_DURATION = 1.5;

// ── Live-DOM position helpers (D3 moves nodes; static graphData.ts is stale) ─

/**
 * Read the current SVG transform on a node group and return its {x, y}.
 * Falls back to the static graphData position if the element is not found.
 */
function getNodePos(nodeId: string): { x: number; y: number } {
  const el = document.getElementById(`node-${nodeId}`);
  if (el) {
    const t = el.getAttribute('transform') ?? '';
    const m = t.match(/translate\(\s*([\d.+-]+)[,\s]\s*([\d.+-]+)\s*\)/);
    if (m) return { x: parseFloat(m[1]), y: parseFloat(m[2]) };
  }
  const node = GRAPH_NODES.find(n => n.id === nodeId);
  return { x: node?.x ?? 0, y: node?.y ?? 0 };
}

/**
 * Read the current x1/y1/x2/y2 on an edge line and return its pixel length.
 * Falls back to the pre-computed BROKEN_EDGE_LENGTH if the element is missing.
 */
function getLiveEdgeLength(edgeId: string): number {
  const el = document.getElementById(`edge-${edgeId}`);
  if (el) {
    const x1 = parseFloat(el.getAttribute('x1') ?? '0');
    const y1 = parseFloat(el.getAttribute('y1') ?? '0');
    const x2 = parseFloat(el.getAttribute('x2') ?? '0');
    const y2 = parseFloat(el.getAttribute('y2') ?? '0');
    const len = Math.round(Math.hypot(x2 - x1, y2 - y1));
    if (len > 0) return len;
  }
  return BROKEN_EDGE_LENGTH;
}

// ─────────────────────────────────────────────────────────────────────────────
// AMBIENT  — resting state with continuous gentle breathing
// ─────────────────────────────────────────────────────────────────────────────
export function toAmbient(): gsap.core.Timeline {
  killAll();
  const tl = gsap.timeline();

  // Reset all edges to solid/dim
  GRAPH_EDGES.forEach(edge => {
    tl.set(`#edge-${edge.id}`, {
      attr: {
        stroke: 'rgba(148, 163, 184, 0.22)',
        'stroke-width': 1.5,
        'stroke-dasharray': '9999',
        'stroke-dashoffset': 0,
      },
    }, 0);
  });

  // Reset all nodes
  GRAPH_NODES.forEach(node => {
    const color = CATEGORY_COLORS[node.category];
    tl.to(`#node-${node.id}`,      { opacity: 1,                                 duration: 0.5, ease: 'power2.out' }, 0);
    tl.to(`#node-${node.id}-dot`,  { attr: { fill: color, r: 7 },               duration: 0.5, ease: 'power2.out' }, 0);
    tl.to(`#node-${node.id}-ring`, { attr: { r: 13, stroke: color }, opacity: 0.12, duration: 0.5 }, 0);
  });

  tl.set('#repair-particle', { opacity: 0 }, 0);

  // Breathing: each node ring slowly inhales/exhales, randomly staggered
  tl.call(() => {
    _breathing = gsap.to(
      GRAPH_NODES.map(n => `#node-${n.id}-ring`),
      {
        attr: { r: 18 },
        opacity: 0.28,
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: { each: 0.22, from: 'random' },
      }
    );
  }, [], 0.5);

  return tl;
}

// ─────────────────────────────────────────────────────────────────────────────
// DIAGNOSTIC  — the gap is revealed: broken edge + urgent pulse
// ─────────────────────────────────────────────────────────────────────────────
export function toDiagnostic(): gsap.core.Timeline {
  killAll();
  const tl = gsap.timeline();

  // ── 1. Everything else fades back ───────────────────────────────────────
  GRAPH_EDGES.forEach(edge => {
    if (edge.id !== BROKEN_EDGE_ID) {
      tl.to(`#edge-${edge.id}`, { attr: { stroke: 'rgba(148, 163, 184, 0.06)' }, duration: 0.6 }, 0);
    }
  });
  GRAPH_NODES.forEach(node => {
    if (node.id !== GAP_SOURCE_ID && node.id !== GAP_TARGET_ID) {
      tl.to(`#node-${node.id}`, { opacity: 0.14, duration: 0.5 }, 0);
    }
  });

  // ── 2. Disconnect flash — briefly white then snaps to red ───────────────
  tl.to(`#edge-${BROKEN_EDGE_ID}`, {
    attr: { stroke: '#ffffff', 'stroke-width': 3 },
    duration: 0.12,
    ease: 'power3.out',
  }, 0.1);
  tl.to(`#edge-${BROKEN_EDGE_ID}`, {
    attr: { stroke: '#f43f5e', 'stroke-width': 2.5 },
    duration: 0.25,
    ease: 'power2.in',
  }, 0.22);
  tl.set(`#edge-${BROKEN_EDGE_ID}`, {
    attr: { 'stroke-dasharray': '8 6', 'stroke-dashoffset': 0 },
  }, 0.26);

  // ── 3. Marching ants — active urgency on the broken edge ─────────────────
  tl.call(() => {
    _march = gsap.to(`#edge-${BROKEN_EDGE_ID}`, {
      attr: { 'stroke-dashoffset': -14 },
      duration: 0.5,
      repeat: -1,
      ease: 'none',
    });
  }, [], 0.28);

  // ── 4. Gap source (Pathology) bounces in red ─────────────────────────────
  tl.to(`#node-${GAP_SOURCE_ID}`, { opacity: 1, duration: 0.2 }, 0.1);
  tl.to(`#node-${GAP_SOURCE_ID}-dot`, {
    attr: { fill: '#f43f5e', r: 12 },
    duration: 0.35,
    ease: 'back.out(2)',
  }, 0.2);
  tl.to(`#node-${GAP_SOURCE_ID}-dot`, { attr: { r: 9 }, duration: 0.2 }, 0.55);
  tl.to(`#node-${GAP_SOURCE_ID}-ring`, { attr: { r: 14, stroke: '#f43f5e' }, opacity: 0.3, duration: 0.3 }, 0.2);

  // ── 5. Gap target (Clinical Reasoning) bounces in red ───────────────────
  tl.to(`#node-${GAP_TARGET_ID}`, { opacity: 1, duration: 0.2 }, 0.22);
  tl.to(`#node-${GAP_TARGET_ID}-dot`, {
    attr: { fill: '#f43f5e', r: 12 },
    duration: 0.35,
    ease: 'back.out(2)',
  }, 0.32);
  tl.to(`#node-${GAP_TARGET_ID}-dot`, { attr: { r: 9 }, duration: 0.2 }, 0.67);
  tl.to(`#node-${GAP_TARGET_ID}-ring`, { attr: { r: 14, stroke: '#f43f5e' }, opacity: 0.3, duration: 0.3 }, 0.32);

  // ── 6. Repeating pulse on both gap rings ────────────────────────────────
  tl.call(() => {
    _pulse = gsap.to(
      [`#node-${GAP_SOURCE_ID}-ring`, `#node-${GAP_TARGET_ID}-ring`],
      {
        attr: { r: 24, stroke: '#f43f5e' },
        opacity: 0.5,
        duration: 0.85,
        repeat: -1,
        yoyo: true,
        ease: 'power2.out',
      }
    );
  }, [], 0.75);

  return tl;
}

// ─────────────────────────────────────────────────────────────────────────────
// REPAIR  — the connection is rebuilt: synced particle + edge draw
// ─────────────────────────────────────────────────────────────────────────────
export function toRepair(): gsap.core.Timeline {
  killAll();

  const tl = gsap.timeline();

  // Read live positions — D3 may have moved nodes from their initial positions
  const srcPos = getNodePos(GAP_SOURCE_ID);
  const tgtPos = getNodePos(GAP_TARGET_ID);
  const edgeLen = getLiveEdgeLength(BROKEN_EDGE_ID);

  // Particle + edge draw both start at t=DRAW_START, both share the same ease
  // and duration — they are mathematically guaranteed to arrive simultaneously.
  const DRAW_START   = 0.35;
  const ARRIVAL_TIME = DRAW_START + REPAIR_DURATION;

  // ── 1. Restore background elements ───────────────────────────────────────
  GRAPH_EDGES.forEach(edge => {
    if (edge.id !== BROKEN_EDGE_ID) {
      tl.to(`#edge-${edge.id}`, { attr: { stroke: 'rgba(148, 163, 184, 0.16)' }, duration: 0.45 }, 0);
    }
  });
  GRAPH_NODES.forEach(node => {
    if (node.id !== GAP_SOURCE_ID && node.id !== GAP_TARGET_ID) {
      tl.to(`#node-${node.id}`, { opacity: 0.6, duration: 0.45 }, 0);
    }
  });

  // ── 2. Source node: transition cyan + launch burst ────────────────────────
  tl.to(`#node-${GAP_SOURCE_ID}-dot`,  { attr: { fill: '#06b6d4', r: 8 },           duration: 0.35 }, 0.05);
  tl.to(`#node-${GAP_SOURCE_ID}-ring`, { attr: { r: 14, stroke: '#06b6d4' }, opacity: 0.3, duration: 0.35 }, 0.05);

  tl.to(`#node-${GAP_SOURCE_ID}-ring`, {
    attr: { r: 30 },
    opacity: 0,
    duration: 0.5,
    ease: 'power2.out',
  }, DRAW_START - 0.05);
  tl.to(`#node-${GAP_SOURCE_ID}-dot`, { attr: { r: 11 }, duration: 0.12, ease: 'power2.out' }, DRAW_START);
  tl.to(`#node-${GAP_SOURCE_ID}-dot`, { attr: { r: 8 },  duration: 0.2  }, DRAW_START + 0.12);
  tl.set(`#node-${GAP_SOURCE_ID}-ring`, { attr: { r: 14 }, opacity: 0.3 }, DRAW_START + 0.5);

  // ── 3. Set up broken edge for draw animation (invisible, ready to reveal) ─
  tl.set(`#edge-${BROKEN_EDGE_ID}`, {
    attr: {
      stroke: '#06b6d4',
      'stroke-width': 2.5,
      'stroke-dasharray': edgeLen,
      'stroke-dashoffset': edgeLen, // fully hidden — will draw left-to-right
    },
  }, 0.25);

  // ── 4. Particle appears at source ─────────────────────────────────────────
  tl.set('#repair-particle', { attr: { cx: srcPos.x, cy: srcPos.y, r: 5 }, opacity: 0 }, DRAW_START - 0.05);
  tl.to('#repair-particle', { opacity: 1, duration: 0.15 }, DRAW_START);

  // ── 5. THE SYNC: particle and edge draw share the exact same ease + duration
  tl.to('#repair-particle', {
    attr: { cx: tgtPos.x, cy: tgtPos.y },
    duration: REPAIR_DURATION,
    ease: REPAIR_EASE,
  }, DRAW_START);

  tl.to(`#edge-${BROKEN_EDGE_ID}`, {
    attr: { 'stroke-dashoffset': 0 },
    duration: REPAIR_DURATION,
    ease: REPAIR_EASE,
  }, DRAW_START);

  // Particle fades just before arrival so it doesn't obscure the burst
  tl.to('#repair-particle', { opacity: 0, attr: { r: 2 }, duration: 0.2 }, ARRIVAL_TIME - 0.2);

  // ── 6. Connection burst when edge arrives at target ────────────────────────
  tl.to(`#node-${GAP_TARGET_ID}-ring`, {
    attr: { r: 38, stroke: '#06b6d4' },
    opacity: 0,
    duration: 0.55,
    ease: 'power2.out',
  }, ARRIVAL_TIME);

  tl.to(`#node-${GAP_TARGET_ID}-dot`, {
    attr: { fill: '#06b6d4', r: 13 },
    duration: 0.35,
    ease: 'back.out(2.5)',
  }, ARRIVAL_TIME + 0.02);
  tl.to(`#node-${GAP_TARGET_ID}-dot`, { attr: { r: 9 }, duration: 0.3, ease: 'power2.inOut' }, ARRIVAL_TIME + 0.4);

  tl.set(`#node-${GAP_TARGET_ID}-ring`, { attr: { r: 16, stroke: '#06b6d4' }, opacity: 0 }, ARRIVAL_TIME + 0.05);
  tl.to(`#node-${GAP_TARGET_ID}-ring`, { opacity: 0.45, duration: 0.45 }, ARRIVAL_TIME + 0.2);

  return tl;
}

// ─────────────────────────────────────────────────────────────────────────────
// SOLIDIFY  — wave ripple + node bounces, restores breathing
// ─────────────────────────────────────────────────────────────────────────────
export function toSolidify(): gsap.core.Timeline {
  killAll();
  const tl = gsap.timeline();

  tl.set('#repair-particle', { opacity: 0 }, 0);

  // Broken edge → bold solid green
  tl.to(`#edge-${BROKEN_EDGE_ID}`, {
    attr: { stroke: '#10b981', 'stroke-width': 3.5, 'stroke-dashoffset': 0 },
    duration: 0.4,
    ease: 'power2.out',
  }, 0);
  tl.set(`#edge-${BROKEN_EDGE_ID}`, { attr: { 'stroke-dasharray': '9999' } }, 0.35);

  // Other edges: restore
  GRAPH_EDGES.forEach(edge => {
    if (edge.id !== BROKEN_EDGE_ID) {
      tl.to(`#edge-${edge.id}`, {
        attr: { stroke: 'rgba(148, 163, 184, 0.32)', 'stroke-width': 1.5 },
        duration: 0.5,
      }, 0);
    }
  });

  // ── Wave ripple: sort by live distance from repaired edge midpoint ────────
  // Reading live positions means the wave origin tracks where nodes actually are
  // after D3 has settled them (or after the user has dragged them).
  const srcPos = getNodePos(GAP_SOURCE_ID);
  const tgtPos = getNodePos(GAP_TARGET_ID);
  const midX   = (srcPos.x + tgtPos.x) / 2;
  const midY   = (srcPos.y + tgtPos.y) / 2;

  const waveOrder = [...GRAPH_NODES].sort((a, b) => {
    const pA = getNodePos(a.id);
    const pB = getNodePos(b.id);
    return Math.hypot(pA.x - midX, pA.y - midY) - Math.hypot(pB.x - midX, pB.y - midY);
  });

  waveOrder.forEach((node, i) => {
    const color = CATEGORY_COLORS[node.category];
    const d = 0.08 + i * 0.08;

    tl.to(`#node-${node.id}`, { opacity: 1, duration: 0.3, ease: 'power2.out' }, d);

    // Bounce: grow past target (back.out overshoot) then settle
    tl.to(`#node-${node.id}-dot`, {
      attr: { fill: '#10b981', r: 12 },
      duration: 0.4,
      ease: 'back.out(2.5)',
    }, d);
    tl.to(`#node-${node.id}-dot`, {
      attr: { fill: color, r: 8 },
      duration: 0.5,
      ease: 'power2.inOut',
    }, d + 0.45);

    // Ring: expand then collapse to ambient glow
    tl.to(`#node-${node.id}-ring`, {
      attr: { r: 26, stroke: '#10b981' },
      opacity: 0.65,
      duration: 0.35,
      ease: 'power2.out',
    }, d);
    tl.to(`#node-${node.id}-ring`, {
      attr: { r: 13, stroke: color },
      opacity: 0.18,
      duration: 0.6,
      ease: 'power3.in',
    }, d + 0.38);
  });

  // Keep the repaired nodes distinctly green
  const waveEnd = 0.08 + waveOrder.length * 0.08 + 0.55;
  tl.to(`#node-${GAP_SOURCE_ID}-dot`, { attr: { fill: '#10b981' }, duration: 0.25 }, waveEnd);
  tl.to(`#node-${GAP_TARGET_ID}-dot`, { attr: { fill: '#10b981' }, duration: 0.25 }, waveEnd);
  tl.to(`#node-${GAP_SOURCE_ID}-ring`, { attr: { stroke: '#10b981' }, opacity: 0.22, duration: 0.25 }, waveEnd);
  tl.to(`#node-${GAP_TARGET_ID}-ring`, { attr: { stroke: '#10b981' }, opacity: 0.22, duration: 0.25 }, waveEnd);

  // Resume breathing — slightly brighter to match success state
  tl.call(() => {
    _breathing = gsap.to(
      GRAPH_NODES.map(n => `#node-${n.id}-ring`),
      {
        attr: { r: 18 },
        opacity: 0.32,
        duration: 2.6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: { each: 0.2, from: 'random' },
      }
    );
  }, [], waveEnd + 0.3);

  return tl;
}

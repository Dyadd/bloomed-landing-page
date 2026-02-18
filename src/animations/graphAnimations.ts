/**
 * graphAnimations.ts — improved
 *
 * Key fixes over v1:
 *  - Particle + edge draw now share the same ease → always in sync
 *  - Ambient has continuous breathing so the graph is never static
 *  - Diagnostic: "marching ants" on broken edge + disconnect flash + bounce-in nodes
 *  - Repair: launch burst at source, connection burst at target, node bounces
 *  - Solidify: wave ripple outward from the repaired edge, nodes bounce with back.out
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

// ── Tween store — kill all repeating animations before each phase change ────
let _breathing: gsap.core.Tween | null = null;
let _pulse:     gsap.core.Tween | null = null;
let _march:     gsap.core.Tween | null = null;

function killAll() {
  _breathing?.kill(); _breathing = null;
  _pulse?.kill();     _pulse = null;
  _march?.kill();     _march = null;
}

// ── Shared ease + duration for the repair draw — changing either here
//    automatically keeps the particle in sync with the edge tip ──────────────
const REPAIR_EASE     = 'power2.inOut';
const REPAIR_DURATION = 1.5;

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

  // Start breathing — each node ring slowly inhales/exhales, staggered randomly
  // so they're all at different phases (feels organic, never looks mechanical)
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

  // ── 2. Disconnect flash — edge briefly whites out then snaps red ─────────
  // This sells the moment of "breaking" rather than just fading to red
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
  // Snap to dashed (can't tween dasharray, so set it)
  tl.set(`#edge-${BROKEN_EDGE_ID}`, {
    attr: { 'stroke-dasharray': '8 6', 'stroke-dashoffset': 0 },
  }, 0.26);

  // ── 3. Marching ants — makes the broken edge feel actively broken/urgent ─
  // Each cycle of dasharray (8+6 = 14px) takes 0.5s → dashes march forward
  tl.call(() => {
    _march = gsap.to(`#edge-${BROKEN_EDGE_ID}`, {
      attr: { 'stroke-dashoffset': -14 }, // one full dash cycle
      duration: 0.5,
      repeat: -1,
      ease: 'none',
    });
  }, [], 0.28);

  // ── 4. Gap source (Pathology) bounces in red ────────────────────────────
  tl.to(`#node-${GAP_SOURCE_ID}`, { opacity: 1, duration: 0.2 }, 0.1);
  // Overshoot then settle — the "bounce in" feel
  tl.to(`#node-${GAP_SOURCE_ID}-dot`, {
    attr: { fill: '#f43f5e', r: 12 },
    duration: 0.35,
    ease: 'back.out(2)',
  }, 0.2);
  tl.to(`#node-${GAP_SOURCE_ID}-dot`, { attr: { r: 9 }, duration: 0.2 }, 0.55);
  tl.to(`#node-${GAP_SOURCE_ID}-ring`, { attr: { r: 14, stroke: '#f43f5e' }, opacity: 0.3, duration: 0.3 }, 0.2);

  // ── 5. Gap target (Clinical Reasoning) bounces in red (slight delay) ─────
  tl.to(`#node-${GAP_TARGET_ID}`, { opacity: 1, duration: 0.2 }, 0.22);
  tl.to(`#node-${GAP_TARGET_ID}-dot`, {
    attr: { fill: '#f43f5e', r: 12 },
    duration: 0.35,
    ease: 'back.out(2)',
  }, 0.32);
  tl.to(`#node-${GAP_TARGET_ID}-dot`, { attr: { r: 9 }, duration: 0.2 }, 0.67);
  tl.to(`#node-${GAP_TARGET_ID}-ring`, { attr: { r: 14, stroke: '#f43f5e' }, opacity: 0.3, duration: 0.3 }, 0.32);

  // ── 6. Repeating pulse on both gap rings (starts after bounce settles) ───
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
  killAll(); // also stops the marching-ants tween

  const tl = gsap.timeline();

  const src = GRAPH_NODES.find(n => n.id === GAP_SOURCE_ID)!;
  const tgt = GRAPH_NODES.find(n => n.id === GAP_TARGET_ID)!;

  // Particle + edge draw both start at t=0.35, both use REPAIR_EASE + REPAIR_DURATION
  // → they are mathematically guaranteed to stay in sync
  const DRAW_START   = 0.35;
  const ARRIVAL_TIME = DRAW_START + REPAIR_DURATION;

  // ── 1. Restore background elements ──────────────────────────────────────
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

  // ── 2. Source node: transition cyan + launch burst ───────────────────────
  tl.to(`#node-${GAP_SOURCE_ID}-dot`,  { attr: { fill: '#06b6d4', r: 8 },         duration: 0.35 }, 0.05);
  tl.to(`#node-${GAP_SOURCE_ID}-ring`, { attr: { r: 14, stroke: '#06b6d4' }, opacity: 0.3, duration: 0.35 }, 0.05);

  // Launch burst: ring expands and fades at moment particle leaves
  tl.to(`#node-${GAP_SOURCE_ID}-ring`, {
    attr: { r: 30 },
    opacity: 0,
    duration: 0.5,
    ease: 'power2.out',
  }, DRAW_START - 0.05);
  tl.to(`#node-${GAP_SOURCE_ID}-dot`, { attr: { r: 11 }, duration: 0.12, ease: 'power2.out' }, DRAW_START);
  tl.to(`#node-${GAP_SOURCE_ID}-dot`, { attr: { r: 8 },  duration: 0.2  }, DRAW_START + 0.12);
  // Reset ring to visible after burst
  tl.set(`#node-${GAP_SOURCE_ID}-ring`, { attr: { r: 14 }, opacity: 0.3 }, DRAW_START + 0.5);

  // ── 3. Set up broken edge for draw animation (invisible, ready to draw) ──
  tl.set(`#edge-${BROKEN_EDGE_ID}`, {
    attr: {
      stroke: '#06b6d4',
      'stroke-width': 2.5,
      'stroke-dasharray': BROKEN_EDGE_LENGTH,
      'stroke-dashoffset': BROKEN_EDGE_LENGTH, // starts invisible
    },
  }, 0.25);

  // ── 4. Particle appears at source ────────────────────────────────────────
  tl.set('#repair-particle', { attr: { cx: src.x, cy: src.y, r: 5 }, opacity: 0 }, DRAW_START - 0.05);
  tl.to('#repair-particle', { opacity: 1, duration: 0.15 }, DRAW_START);

  // ── 5. THE SYNC: particle and edge draw share the exact same ease + duration ─
  tl.to('#repair-particle', {
    attr: { cx: tgt.x, cy: tgt.y },
    duration: REPAIR_DURATION,
    ease: REPAIR_EASE,
  }, DRAW_START);

  tl.to(`#edge-${BROKEN_EDGE_ID}`, {
    attr: { 'stroke-dashoffset': 0 },
    duration: REPAIR_DURATION,
    ease: REPAIR_EASE,
  }, DRAW_START);

  // Particle fades just before arrival so the burst isn't obscured
  tl.to('#repair-particle', { opacity: 0, attr: { r: 2 }, duration: 0.2 }, ARRIVAL_TIME - 0.2);

  // ── 6. Connection burst when edge arrives at target ───────────────────────
  // Ring explodes outward and fades (power2.out = fast start, decelerate = burst feel)
  tl.to(`#node-${GAP_TARGET_ID}-ring`, {
    attr: { r: 38, stroke: '#06b6d4' },
    opacity: 0,
    duration: 0.55,
    ease: 'power2.out',
  }, ARRIVAL_TIME);

  // Target dot: bounce in with back.out (overshoot then spring)
  tl.to(`#node-${GAP_TARGET_ID}-dot`, {
    attr: { fill: '#06b6d4', r: 13 },
    duration: 0.35,
    ease: 'back.out(2.5)',
  }, ARRIVAL_TIME + 0.02);
  tl.to(`#node-${GAP_TARGET_ID}-dot`, { attr: { r: 9 }, duration: 0.3, ease: 'power2.inOut' }, ARRIVAL_TIME + 0.4);

  // Ring resets to a calm glow after the burst
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

  // Broken edge → bold solid green immediately
  tl.to(`#edge-${BROKEN_EDGE_ID}`, {
    attr: { stroke: '#10b981', 'stroke-width': 3.5, 'stroke-dashoffset': 0 },
    duration: 0.4,
    ease: 'power2.out',
  }, 0);
  tl.set(`#edge-${BROKEN_EDGE_ID}`, { attr: { 'stroke-dasharray': '9999' } }, 0.35);

  // Other edges: restore with a gentle fade
  GRAPH_EDGES.forEach(edge => {
    if (edge.id !== BROKEN_EDGE_ID) {
      tl.to(`#edge-${edge.id}`, {
        attr: { stroke: 'rgba(148, 163, 184, 0.32)', 'stroke-width': 1.5 },
        duration: 0.5,
      }, 0);
    }
  });

  // ── Wave ripple: sort nodes by distance from the repaired edge midpoint ──
  // Nodes closest to the repair are first — creates an "outward ripple" effect
  const midX = (380 + 540) / 2; // ≈ 460
  const midY = (220 + 185) / 2; // ≈ 202

  const waveOrder = [...GRAPH_NODES].sort((a, b) => {
    const dA = Math.hypot(a.x - midX, a.y - midY);
    const dB = Math.hypot(b.x - midX, b.y - midY);
    return dA - dB;
  });

  waveOrder.forEach((node, i) => {
    const color = CATEGORY_COLORS[node.category];
    const d = 0.08 + i * 0.08; // stagger delay: ~80ms apart

    tl.to(`#node-${node.id}`, { opacity: 1, duration: 0.3, ease: 'power2.out' }, d);

    // ── Bounce: dot grows past target (back.out overshoot) then settles ───
    // back.out(2.5) sends r briefly ~20% past 12 before springing back
    tl.to(`#node-${node.id}-dot`, {
      attr: { fill: '#10b981', r: 12 },
      duration: 0.4,
      ease: 'back.out(2.5)',
    }, d);
    // Settle back to category colour
    tl.to(`#node-${node.id}-dot`, {
      attr: { fill: color, r: 8 },
      duration: 0.5,
      ease: 'power2.inOut',
    }, d + 0.45);

    // ── Ring: expands outward and fades (ripple halo) ─────────────────────
    tl.to(`#node-${node.id}-ring`, {
      attr: { r: 26, stroke: '#10b981' },
      opacity: 0.65,
      duration: 0.35,
      ease: 'power2.out',
    }, d);
    // Then shrinks to a calm ambient glow
    tl.to(`#node-${node.id}-ring`, {
      attr: { r: 13, stroke: color },
      opacity: 0.18,
      duration: 0.6,
      ease: 'power3.in',
    }, d + 0.38);
  });

  // ── Keep the repaired nodes distinctly green ─────────────────────────────
  const waveEnd = 0.08 + waveOrder.length * 0.08 + 0.55;
  tl.to(`#node-${GAP_SOURCE_ID}-dot`, { attr: { fill: '#10b981' }, duration: 0.25 }, waveEnd);
  tl.to(`#node-${GAP_TARGET_ID}-dot`, { attr: { fill: '#10b981' }, duration: 0.25 }, waveEnd);
  tl.to(`#node-${GAP_SOURCE_ID}-ring`, { attr: { stroke: '#10b981' }, opacity: 0.22, duration: 0.25 }, waveEnd);
  tl.to(`#node-${GAP_TARGET_ID}-ring`, { attr: { stroke: '#10b981' }, opacity: 0.22, duration: 0.25 }, waveEnd);

  // ── Resume breathing after the wave completes ────────────────────────────
  // Breathing resumes with slightly brighter values to match the success state
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

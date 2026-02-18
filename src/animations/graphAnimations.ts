/**
 * graphAnimations.ts
 *
 * Scroll-driven GSAP animations for the knowledge graph.
 *
 * Three narrative phases:
 *  - Diagnostic: disparate known nodes light up, rest dim, scanning pulse
 *  - Learning:   unknown nodes appear, edges form as dotted orange lines
 *  - Solidify:   green wave, all edges become solid, full graph alive
 *
 * D3 integration:
 *  - getNodePos() reads live DOM attributes so animations stay correct
 *    after nodes have been dragged.
 */

import { gsap } from 'gsap';
import {
  GRAPH_NODES,
  GRAPH_EDGES,
  KNOWN_NODE_IDS,
  classifyEdge,
} from '../data/graphData';

const CATEGORY_COLORS: Record<string, string> = {
  foundational: '#6366f1',
  pathological: '#8b5cf6',
  clinical:     '#3b82f6',
  specialty:    '#06b6d4',
};

const LEARNING_COLOR = '#f97316'; // warm orange for forming connections

/** Read a space-separated RGB value from a CSS custom property, e.g. "44 42 38" */
function getThemeRgb(varName: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

/** Build an rgba() string from space-separated RGB + optional alpha */
function rgba(rgb: string, alpha?: number): string {
  const [r, g, b] = rgb.split(' ');
  return alpha !== undefined
    ? `rgba(${r}, ${g}, ${b}, ${alpha})`
    : `rgb(${r}, ${g}, ${b})`;
}

let _breathing: gsap.core.Tween | null = null;
let _scanPulse: gsap.core.Timeline | null = null;
let _learningGlow: gsap.core.Tween | null = null;

function killAll() {
  _breathing?.kill();    _breathing    = null;
  _scanPulse?.kill();    _scanPulse    = null;
  _learningGlow?.kill(); _learningGlow = null;
}

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

// Partition nodes: known (scattered) vs unknown (gaps to fill)
const knownNodes   = GRAPH_NODES.filter(n => KNOWN_NODE_IDS.has(n.id));
const unknownNodes = GRAPH_NODES.filter(n => !KNOWN_NODE_IDS.has(n.id));

// Partition edges: known (both endpoints known) vs learning (at least one unknown)
const knownEdges    = GRAPH_EDGES.filter(e => classifyEdge(e) === 'known');
const learningEdges = GRAPH_EDGES.filter(e => classifyEdge(e) === 'learning');

// ── AMBIENT - resting state with continuous gentle breathing ─────────────────

export function toAmbient(): gsap.core.Timeline {
  killAll();
  const tl = gsap.timeline();

  const primaryRgb = getThemeRgb('--color-primary-rgb');
  const edgeColor = rgba(primaryRgb, 0.15);

  GRAPH_EDGES.forEach(edge => {
    tl.set(`#edge-${edge.id}`, {
      attr: {
        stroke: edgeColor,
        'stroke-width': 1.5,
        'stroke-dasharray': '9999',
        'stroke-dashoffset': 0,
      },
    }, 0);
  });

  GRAPH_NODES.forEach(node => {
    const color = CATEGORY_COLORS[node.category];
    tl.to(`#node-${node.id}`,      { opacity: 1,                                 duration: 0.5, ease: 'power2.out' }, 0);
    tl.to(`#node-${node.id}-dot`,  { attr: { fill: color, r: 7 },               duration: 0.5, ease: 'power2.out' }, 0);
    tl.to(`#node-${node.id}-ring`, { attr: { r: 13, stroke: color }, opacity: 0.12, duration: 0.5 }, 0);
  });

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

// ── DIAGNOSTIC - "Bloomed maps where you are" ───────────────────────────────
//  Disparate known nodes light up bright, everything else dims down.
//  Shows fragmented knowledge - you know some things but they're scattered.

export function toDiagnostic(): gsap.core.Timeline {
  killAll();
  const tl = gsap.timeline();

  const primaryRgb = getThemeRgb('--color-primary-rgb');

  // Known nodes pop up bright with their category color, staggered
  knownNodes.forEach((node, i) => {
    const color = CATEGORY_COLORS[node.category];
    const delay = i * 0.12;
    tl.to(`#node-${node.id}`, { opacity: 1, duration: 0.5 }, delay);
    tl.to(`#node-${node.id}-dot`, {
      attr: { fill: color, r: 10 },
      duration: 0.4,
      ease: 'back.out(2)',
    }, delay + 0.05);
    tl.to(`#node-${node.id}-dot`, { attr: { r: 8 }, duration: 0.25 }, delay + 0.45);
    tl.to(`#node-${node.id}-ring`, {
      attr: { r: 15, stroke: color },
      opacity: 0.3,
      duration: 0.4,
    }, delay + 0.05);
  });

  // Unknown nodes dim out
  unknownNodes.forEach(node => {
    tl.to(`#node-${node.id}`, { opacity: 0.12, duration: 0.5 }, 0);
    tl.to(`#node-${node.id}-ring`, { opacity: 0.02, duration: 0.4 }, 0);
  });

  // Known edges (anatomy-physiology is the only one) visible
  knownEdges.forEach(edge => {
    tl.to(`#edge-${edge.id}`, {
      attr: { stroke: rgba(primaryRgb, 0.2), 'stroke-width': 1.5 },
      duration: 0.5,
    }, 0);
  });

  // Learning edges nearly invisible
  learningEdges.forEach(edge => {
    tl.to(`#edge-${edge.id}`, {
      attr: { stroke: rgba(primaryRgb, 0.03), 'stroke-width': 1 },
      duration: 0.5,
    }, 0);
  });

  // Scanning pulse: known nodes get a sequential ring flare (one after another)
  tl.call(() => {
    const scanTl = gsap.timeline({ repeat: -1 });
    knownNodes.forEach((node, i) => {
      const color = CATEGORY_COLORS[node.category];
      scanTl.to(`#node-${node.id}-ring`, {
        attr: { r: 26 },
        opacity: 0.55,
        duration: 0.4,
        ease: 'power2.out',
      }, i * 0.55);
      scanTl.to(`#node-${node.id}-ring`, {
        attr: { r: 15, stroke: color },
        opacity: 0.25,
        duration: 0.6,
        ease: 'power2.inOut',
      }, i * 0.55 + 0.4);
    });
    _scanPulse = scanTl;
  }, [], 0.7);

  return tl;
}

// ── LEARNING - "Connections are forming" ─────────────────────────────────────
//  Known nodes stay visible. Unknown nodes appear. Learning edges form as
//  dotted orange lines to show knowledge actively being built.

export function toLearning(): gsap.core.Timeline {
  killAll();
  const tl = gsap.timeline();

  const primaryRgb = getThemeRgb('--color-primary-rgb');

  // Known nodes stay visible but step back slightly
  knownNodes.forEach(node => {
    const color = CATEGORY_COLORS[node.category];
    tl.to(`#node-${node.id}`, { opacity: 0.75, duration: 0.45 }, 0);
    tl.to(`#node-${node.id}-dot`, {
      attr: { fill: color, r: 7 },
      duration: 0.4,
    }, 0);
    tl.to(`#node-${node.id}-ring`, {
      attr: { r: 12, stroke: color },
      opacity: 0.12,
      duration: 0.4,
    }, 0);
  });

  // Known edges stay solid at medium opacity
  knownEdges.forEach(edge => {
    tl.to(`#edge-${edge.id}`, {
      attr: { stroke: rgba(primaryRgb, 0.15), 'stroke-width': 1.5, 'stroke-dasharray': '9999' },
      duration: 0.45,
    }, 0);
  });

  // Unknown nodes appear with orange learning color, staggered bounce-in
  unknownNodes.forEach((node, i) => {
    const delay = 0.2 + i * 0.08;
    tl.to(`#node-${node.id}`, { opacity: 1, duration: 0.35 }, delay);
    tl.to(`#node-${node.id}-dot`, {
      attr: { fill: LEARNING_COLOR, r: 10 },
      duration: 0.4,
      ease: 'back.out(2)',
    }, delay);
    tl.to(`#node-${node.id}-dot`, {
      attr: { r: 7 },
      duration: 0.25,
      ease: 'power2.inOut',
    }, delay + 0.4);
    tl.to(`#node-${node.id}-ring`, {
      attr: { r: 15, stroke: LEARNING_COLOR },
      opacity: 0.3,
      duration: 0.4,
      ease: 'power2.out',
    }, delay);
  });

  // Learning edges appear as dotted orange lines (connections forming)
  learningEdges.forEach((edge, i) => {
    const delay = 0.35 + i * 0.06;
    tl.set(`#edge-${edge.id}`, {
      attr: { 'stroke-dasharray': '6 5' },
    }, delay);
    tl.to(`#edge-${edge.id}`, {
      attr: { stroke: LEARNING_COLOR, 'stroke-width': 1.8 },
      opacity: 0.55,
      duration: 0.5,
    }, delay);
  });

  // Breathing glow on the learning (unknown) nodes
  tl.call(() => {
    _learningGlow = gsap.to(
      unknownNodes.map(n => `#node-${n.id}-ring`),
      {
        attr: { r: 21 },
        opacity: 0.45,
        duration: 2.0,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: { each: 0.25, from: 'start' },
      }
    );
  }, [], 0.9);

  return tl;
}

// ── SOLIDIFY - "Everything is built and reinforced" ──────────────────────────
//  Green wave from center outward. All nodes flash green then settle to
//  category colors. All edges become solid. Full graph alive.

export function toSolidify(): gsap.core.Timeline {
  killAll();
  const tl = gsap.timeline();

  const primaryRgb = getThemeRgb('--color-primary-rgb');
  const edgeColor = rgba(primaryRgb, 0.22);

  // All edges snap to solid and strengthen with green flash
  GRAPH_EDGES.forEach(edge => {
    tl.to(`#edge-${edge.id}`, {
      attr: { stroke: '#30a46c', 'stroke-width': 2.5, 'stroke-dasharray': '9999', 'stroke-dashoffset': 0 },
      opacity: 1,
      duration: 0.4,
    }, 0);
    tl.to(`#edge-${edge.id}`, {
      attr: { stroke: edgeColor, 'stroke-width': 1.5 },
      duration: 0.6,
    }, 0.5);
  });

  // Wave ripple: sort by distance from graph center
  const centerX = 370;
  const centerY = 250;

  const waveOrder = [...GRAPH_NODES].sort((a, b) => {
    const pA = getNodePos(a.id);
    const pB = getNodePos(b.id);
    return Math.hypot(pA.x - centerX, pA.y - centerY) - Math.hypot(pB.x - centerX, pB.y - centerY);
  });

  waveOrder.forEach((node, i) => {
    const color = CATEGORY_COLORS[node.category];
    const d = 0.08 + i * 0.08;

    // Fade in to full
    tl.to(`#node-${node.id}`, { opacity: 1, duration: 0.3, ease: 'power2.out' }, d);

    // Green flash then settle to category color
    tl.to(`#node-${node.id}-dot`, {
      attr: { fill: '#30a46c', r: 12 },
      duration: 0.4,
      ease: 'back.out(2.5)',
    }, d);
    tl.to(`#node-${node.id}-dot`, {
      attr: { fill: color, r: 8 },
      duration: 0.5,
      ease: 'power2.inOut',
    }, d + 0.45);

    // Ring burst then settle
    tl.to(`#node-${node.id}-ring`, {
      attr: { r: 26, stroke: '#30a46c' },
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

  // After wave completes: restore breathing at slightly higher intensity
  const waveEnd = 0.08 + waveOrder.length * 0.08 + 0.55;

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

/**
 * HeroBloom.tsx
 *
 * Full-bleed decorative SVG animation for the hero section.
 * ~86 nodes in a 7-petal flower with a large empty center.
 * Nodes spawn in place with a pulse/ripple, ordered roughly
 * center-outward but with organic noise. ~15% of nodes are
 * subtly vibrant. After the bloom, a subset continues breathing.
 */

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#06b6d4'];
const PETAL_COLORS = [
  COLORS[0], COLORS[1], COLORS[2], COLORS[3],
  COLORS[0], COLORS[2], COLORS[1],
];

const CX = 500;
const CY = 500;
const NUM_PETALS = 7;

// ── Types ───────────────────────────────────────────────────────────────────

interface BNode {
  id: string;
  tx: number;
  ty: number;
  color: string;
  dotR: number;
  ringR: number;
}

interface BEdge {
  id: string;
  src: string;
  tgt: string;
}

// ── Deterministic helpers ───────────────────────────────────────────────────

function srand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function jitter(seed: number, range: number): number {
  return (srand(seed) - 0.5) * 2 * range;
}

// ── Geometry (computed once at module level) ────────────────────────────────

const allNodes: BNode[] = [];
const allEdges: BEdge[] = [];

let _eidx = 0;

function addNode(
  id: string, tx: number, ty: number,
  color: string, dotR: number, ringR: number,
): BNode {
  const n: BNode = { id, tx, ty, color, dotR, ringR };
  allNodes.push(n);
  return n;
}

function addEdge(src: string, tgt: string): void {
  allEdges.push({ id: `hb-e${_eidx++}`, src, tgt });
}

// --- Center stamen (2 small nodes near center) ---

addNode(
  'hb-c0',
  CX + Math.cos(Math.PI * 2 * 0.15) * 25,
  CY + Math.sin(Math.PI * 2 * 0.15) * 25,
  COLORS[0], 4, 8,
);
addNode(
  'hb-c1',
  CX + Math.cos(Math.PI * 2 * 0.65) * 25,
  CY + Math.sin(Math.PI * 2 * 0.65) * 25,
  COLORS[2], 4, 8,
);

addEdge('hb-c0', 'hb-c1');

// --- Petal template (12 nodes per petal) ---

const PETAL_TMPL: {
  role: string; dist: number; perp: number;
  dotR: number; ringR: number;
}[] = [
  { role: 'base',   dist: 150, perp: 0,    dotR: 4.5, ringR: 9  },
  { role: 'innerL', dist: 210, perp: -50,  dotR: 4,   ringR: 8  },
  { role: 'innerR', dist: 210, perp: 50,   dotR: 4,   ringR: 8  },
  { role: 'midL',   dist: 290, perp: -75,  dotR: 4.5, ringR: 9  },
  { role: 'midR',   dist: 290, perp: 75,   dotR: 4.5, ringR: 9  },
  { role: 'midC',   dist: 320, perp: 0,    dotR: 4.5, ringR: 9  },
  { role: 'outerL', dist: 400, perp: -80,  dotR: 4,   ringR: 8  },
  { role: 'outerR', dist: 400, perp: 80,   dotR: 4,   ringR: 8  },
  { role: 'accent', dist: 355, perp: 28,   dotR: 3.5, ringR: 7  },
  { role: 'farL',   dist: 440, perp: -50,  dotR: 3.5, ringR: 7  },
  { role: 'farR',   dist: 440, perp: 50,   dotR: 3.5, ringR: 7  },
  { role: 'tip',    dist: 480, perp: 0,    dotR: 4.5, ringR: 9  },
];

const INNER_PAIRS: [string, string][] = [
  ['base', 'innerL'], ['base', 'innerR'], ['base', 'midC'],
  ['innerL', 'midL'], ['innerR', 'midR'], ['innerL', 'innerR'],
  ['midL', 'midC'], ['midR', 'midC'],
];

const OUTER_PAIRS: [string, string][] = [
  ['midL', 'outerL'], ['midR', 'outerR'], ['midC', 'tip'],
  ['outerL', 'farL'], ['outerR', 'farR'], ['farL', 'tip'],
  ['farR', 'tip'], ['accent', 'midC'], ['accent', 'outerR'],
];

for (let p = 0; p < NUM_PETALS; p++) {
  const petalAngle = (Math.PI * 2 * p) / NUM_PETALS - Math.PI / 2;
  const perpAngle = petalAngle + Math.PI / 2;
  const color = PETAL_COLORS[p];

  for (const tmpl of PETAL_TMPL) {
    const seed = p * 100 + PETAL_TMPL.indexOf(tmpl);
    const dJ = jitter(seed, 20);
    const pJ = jitter(seed + 50, 15);
    const xJ = jitter(seed + 99, 12);
    const yJ = jitter(seed + 77, 12);

    const dist = tmpl.dist + dJ;
    const perp = tmpl.perp + pJ;

    const tx = CX + Math.cos(petalAngle) * dist + Math.cos(perpAngle) * perp + xJ;
    const ty = CY + Math.sin(petalAngle) * dist + Math.sin(perpAngle) * perp + yJ;

    addNode(`hb-p${p}-${tmpl.role}`, tx, ty, color, tmpl.dotR, tmpl.ringR);
  }

  addEdge(p % 2 === 0 ? 'hb-c0' : 'hb-c1', `hb-p${p}-base`);
  for (const [s, t] of INNER_PAIRS) addEdge(`hb-p${p}-${s}`, `hb-p${p}-${t}`);
  for (const [s, t] of OUTER_PAIRS) addEdge(`hb-p${p}-${s}`, `hb-p${p}-${t}`);
}

const nodeMap = Object.fromEntries(allNodes.map(n => [n.id, n]));

// ── Pre-computed animation order & properties (deterministic, module-level) ─

const nodeDist = new Map(allNodes.map(n => {
  const dx = n.tx - CX;
  const dy = n.ty - CY;
  return [n.id, Math.sqrt(dx * dx + dy * dy)] as const;
}));

const vibrantSet = new Set(
  allNodes.filter((n, i) => {
    if ((nodeDist.get(n.id) ?? 0) < 180) return false;
    return srand(i * 31 + 17) < 0.15;
  }).map(n => n.id),
);

const nodeSizeMult = new Map(allNodes.map((n, i) => {
  const vibrant = vibrantSet.has(n.id);
  const mult = vibrant
    ? 1.2 + srand(i * 67 + 41) * 0.4
    : 0.6 + srand(i * 67 + 41) * 0.7;
  return [n.id, mult] as const;
}));

const sortedEntries = allNodes.map((n, i) => {
  const dist = nodeDist.get(n.id) ?? 0;
  const noise = jitter(i * 7 + 13, 55);
  return { node: n, sortDist: dist + noise, idx: i };
}).sort((a, b) => a.sortDist - b.sortDist);

const NODE_START = 0.15;
const NODE_SPREAD = 2.7;

const nodeDelayMap = new Map<string, number>();
sortedEntries.forEach((entry, sortIdx) => {
  const pos = sortIdx / Math.max(sortedEntries.length - 1, 1);
  const curved = Math.pow(pos, 1.8);
  const timeNoise = jitter(entry.idx * 3 + 7, 0.07);
  nodeDelayMap.set(entry.node.id, Math.max(0.05, NODE_START + curved * NODE_SPREAD + timeNoise));
});

const breathNodeIds = new Set(
  allNodes.filter((_, i) => srand(i * 47 + 23) < 0.4).map(n => n.id),
);
const breathEdgeIds = new Set(
  allEdges.filter((_, i) => srand(i * 59 + 31) < 0.25).map(e => e.id),
);

// ── Component ───────────────────────────────────────────────────────────────

export default function HeroBloom() {
  const breathTweens = useRef<gsap.core.Tween[]>([]);

  useEffect(() => {
    const tl = gsap.timeline();

    // --- Initial state: all at target position, invisible, zero-radius ---
    allNodes.forEach(n => {
      gsap.set(`#${n.id}-dot`,  { attr: { cx: n.tx, cy: n.ty, r: 0 }, opacity: 0 });
      gsap.set(`#${n.id}-ring`, { attr: { cx: n.tx, cy: n.ty, r: 0 }, opacity: 0 });
    });
    allEdges.forEach(e => gsap.set(`#${e.id}`, { opacity: 0 }));

    // --- Nodes: pulse in by noisy distance-from-center order ---
    sortedEntries.forEach(({ node: n, idx }) => {
      const d = nodeDelayMap.get(n.id)!;
      const vibrant = vibrantSet.has(n.id);
      const sm = nodeSizeMult.get(n.id) ?? 1;
      const finalDotR = n.dotR * sm;
      const finalRingR = n.ringR * sm;

      const dotOpacity = Math.min(1, (vibrant
        ? 0.92 + srand(idx * 41 + 3) * 0.08
        : 0.22 + srand(idx * 41 + 3) * 0.33) + 0.2);

      const ringPeakOpacity = (vibrant ? 0.6 : 0.25) + 0.2;
      const ringRestOpacity = (vibrant
        ? 0.30 + srand(idx * 53 + 11) * 0.1
        : 0.04 + srand(idx * 53 + 11) * 0.06) + 0.2;

      const dur = 0.4 + srand(idx * 11 + 5) * 0.25;
      const rippleDur = dur * 0.45;
      const settleDur = dur * 0.55;
      const rippleScale = vibrant ? 3.2 : 2.5;

      tl.to(`#${n.id}-dot`, {
        attr: { r: finalDotR }, opacity: dotOpacity,
        duration: dur, ease: 'back.out(3)',
      }, d);

      tl.to(`#${n.id}-ring`, {
        attr: { r: finalRingR * rippleScale }, opacity: ringPeakOpacity,
        duration: rippleDur, ease: 'power2.out',
      }, d);
      tl.to(`#${n.id}-ring`, {
        attr: { r: finalRingR }, opacity: ringRestOpacity,
        duration: settleDur, ease: 'power2.inOut',
      }, d + rippleDur);
    });

    // --- Edges: appear shortly after both connecting nodes ---
    allEdges.forEach((e, i) => {
      const srcD = nodeDelayMap.get(e.src) ?? 0;
      const tgtD = nodeDelayMap.get(e.tgt) ?? 0;
      const edgeDelay = Math.max(srcD, tgtD) + 0.1 + srand(i * 19 + 7) * 0.12;
      const edgeOpacity = 0.5 + srand(i * 23 + 13) * 0.5;
      tl.to(`#${e.id}`, { opacity: edgeOpacity, duration: 0.5 }, edgeDelay);
    });

    // --- Breathing: only a subset of nodes and edges continue pulsing ---
    const breathNodeSels = allNodes
      .filter(n => breathNodeIds.has(n.id))
      .map(n => `#${n.id}-ring`);
    const breathEdgeSels = allEdges
      .filter(e => breathEdgeIds.has(e.id))
      .map(e => `#${e.id}`);

    tl.call(() => {
      if (breathNodeSels.length > 0) {
        breathTweens.current.push(
          gsap.to(breathNodeSels, {
            attr: { r: '+=7' },
            opacity: '+=0.18',
            duration: 2.4,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            stagger: { each: 0.06, from: 'random' },
          }),
        );
      }
      if (breathEdgeSels.length > 0) {
        breathTweens.current.push(
          gsap.to(breathEdgeSels, {
            opacity: '+=0.22',
            duration: 2.8,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            stagger: { each: 0.08, from: 'random' },
          }),
        );
      }
    }, [], 3.2);

    return () => {
      tl.kill();
      breathTweens.current.forEach(tw => tw.kill());
      breathTweens.current = [];
    };
  }, []);

  return (
    <svg
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMid slice"
      className="w-full h-full"
      style={{ overflow: 'visible' }}
      aria-hidden="true"
    >
      <defs>
        <filter id="bloom-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g>
        {allEdges.map(e => {
          const s = nodeMap[e.src];
          const t = nodeMap[e.tgt];
          return (
            <line
              key={e.id}
              id={e.id}
              x1={s.tx} y1={s.ty}
              x2={t.tx} y2={t.ty}
              stroke="var(--color-edge)"
              strokeWidth={1.2}
              strokeLinecap="round"
              opacity={0}
            />
          );
        })}
      </g>

      <g>
        {allNodes.map(n => (
          <g key={n.id}>
            <circle
              id={`${n.id}-ring`}
              cx={n.tx} cy={n.ty} r={0}
              fill="none"
              stroke={n.color}
              strokeWidth={1}
              opacity={0}
            />
            <circle
              id={`${n.id}-dot`}
              cx={n.tx} cy={n.ty} r={0}
              fill={n.color}
              filter="url(#bloom-glow)"
              opacity={0}
            />
          </g>
        ))}
      </g>
    </svg>
  );
}

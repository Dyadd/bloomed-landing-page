/**
 * CtaAustraliaBloom.tsx
 *
 * Decorative SVG node network for the CTA section.
 * ~50 nodes trace Australia's coastline connected by straight edges,
 * using the same dot+ring+glow style as HeroBloom.
 * Scroll-triggered animation draws the outline sequentially, then
 * fills interior structure. Subtle breathing and hover proximity.
 */

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#06b6d4'];

function srand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function jitter(seed: number, range: number): number {
  return (srand(seed) - 0.5) * 2 * range;
}

// ── Coordinate sets (clockwise from NW Cape) ────────────────────────────────

const COAST: [number, number][] = [
  [78, 255],  [110, 185], [162, 135], [234, 110],
  [305, 88],  [357, 65],  [422, 52],
  [448, 85],  [459, 130], [468, 185], [477, 130], [494, 85],
  [542, 62],  [589, 32],  [604, 78],
  [637, 135], [669, 200], [702, 270], [732, 335],
  [754, 395], [767, 445], [758, 498],
  [728, 542], [680, 565],
  [617, 575], [559, 575], [500, 562], [438, 572],
  [364, 590], [279, 578], [214, 562],
  [149, 538], [117, 495], [84, 435],  [61, 365],  [56, 300],
];

const TAS: [number, number][] = [
  [633, 615], [676, 608], [685, 638], [654, 652], [624, 635],
];

const INTERIOR: [number, number][] = [
  [266, 330], [396, 300], [526, 250], [617, 340],
  [526, 420], [370, 450], [604, 480], [318, 210],
];

// ── Types ────────────────────────────────────────────────────────────────────

interface ANode {
  id: string;
  tx: number;
  ty: number;
  color: string;
  dotR: number;
  ringR: number;
}

interface AEdge {
  id: string;
  src: string;
  tgt: string;
}

// ── Build graph (module-level, computed once) ────────────────────────────────

const allNodes: ANode[] = [];
const allEdges: AEdge[] = [];
let _ei = 0;

function addNode(id: string, x: number, y: number, color: string, dotR: number, ringR: number) {
  allNodes.push({ id, tx: x, ty: y, color, dotR, ringR });
}

function addEdge(src: string, tgt: string) {
  allEdges.push({ id: `au-e${_ei++}`, src, tgt });
}

COAST.forEach(([x, y], i) => {
  const s = i * 13 + 7;
  addNode(
    `au-c${i}`,
    x + jitter(s, 3), y + jitter(s + 50, 3),
    COLORS[i % COLORS.length],
    3 + srand(s + 100) * 1.5,
    7 + srand(s + 100) * 3,
  );
});

for (let i = 0; i < COAST.length; i++) {
  addEdge(`au-c${i}`, `au-c${(i + 1) % COAST.length}`);
}

TAS.forEach(([x, y], i) => {
  const s = (i + 100) * 13 + 7;
  addNode(
    `au-t${i}`,
    x + jitter(s, 2), y + jitter(s + 50, 2),
    COLORS[(i + 2) % COLORS.length],
    2.5, 5.5,
  );
});

for (let i = 0; i < TAS.length; i++) {
  addEdge(`au-t${i}`, `au-t${(i + 1) % TAS.length}`);
}

addEdge('au-c22', 'au-t0');

INTERIOR.forEach(([x, y], i) => {
  const s = (i + 200) * 13 + 7;
  addNode(
    `au-i${i}`,
    x + jitter(s, 5), y + jitter(s + 50, 5),
    COLORS[(i + 1) % COLORS.length],
    2.5 + srand(s + 100),
    5 + srand(s + 100) * 2,
  );
});

const INT_EDGES: [string, string][] = [
  ['au-i0', 'au-i1'], ['au-i1', 'au-i2'], ['au-i2', 'au-i3'],
  ['au-i0', 'au-i5'], ['au-i1', 'au-i4'], ['au-i3', 'au-i6'],
  ['au-i4', 'au-i5'], ['au-i4', 'au-i6'], ['au-i0', 'au-i7'],
  ['au-i7', 'au-i1'], ['au-i7', 'au-i2'],
  ['au-i7', 'au-c5'],  ['au-i0', 'au-c34'],
  ['au-i2', 'au-c15'], ['au-i3', 'au-c18'],
  ['au-i6', 'au-c23'], ['au-i5', 'au-c28'],
  ['au-i4', 'au-c26'],
];

INT_EDGES.forEach(([s, t]) => addEdge(s, t));

// ── Pre-computed lookups ─────────────────────────────────────────────────────

const nodeMap = Object.fromEntries(allNodes.map(n => [n.id, n]));

const breathNodeIds = new Set(
  allNodes.filter((_, i) => srand(i * 47 + 23) < 0.3).map(n => n.id),
);

const breathEdgeIds = new Set(
  allEdges.filter((_, i) => srand(i * 59 + 31) < 0.2).map(e => e.id),
);

const HOVER_RADIUS = 90;

// ── Component ────────────────────────────────────────────────────────────────

export default function CtaAustraliaBloom() {
  const svgRef = useRef<SVGSVGElement>(null);
  const breathTweens = useRef<gsap.core.Tween[]>([]);
  const introDone = useRef(false);
  const hoveredIds = useRef(new Set<string>());
  const rafPending = useRef(false);
  const hasPlayed = useRef(false);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    allNodes.forEach(n => {
      gsap.set(`#${n.id}-dot`, { attr: { r: 0 }, opacity: 0 });
      gsap.set(`#${n.id}-ring`, { attr: { r: 0 }, opacity: 0 });
    });
    allEdges.forEach(e => gsap.set(`#${e.id}`, { opacity: 0 }));

    let tl: gsap.core.Timeline | null = null;

    const play = () => {
      if (hasPlayed.current) return;
      hasPlayed.current = true;

      tl = gsap.timeline();
      const coastLen = COAST.length;
      const traceDur = 2.8;

      // Coast nodes — sequential clockwise trace
      for (let i = 0; i < coastLen; i++) {
        const n = nodeMap[`au-c${i}`];
        const delay = 0.2 + (i / coastLen) * traceDur;
        const sm = 0.7 + srand(i * 67) * 0.5;
        const vibrant = srand(i * 31 + 17) < 0.15;

        tl.to(`#${n.id}-dot`, {
          attr: { r: n.dotR * sm },
          opacity: vibrant ? 0.7 : 0.35,
          duration: 0.35,
          ease: 'back.out(2)',
        }, delay);

        tl.to(`#${n.id}-ring`, {
          attr: { r: n.ringR * sm },
          opacity: vibrant ? 0.18 : 0.07,
          duration: 0.4,
          ease: 'power2.out',
        }, delay);
      }

      // Coast edges — appear just after their nodes
      for (let i = 0; i < coastLen; i++) {
        const delay = 0.2 + ((i + 0.5) / coastLen) * traceDur + 0.08;
        const opacity = 0.12 + srand(i * 23 + 13) * 0.15;
        tl.to(`#au-e${i}`, { opacity, duration: 0.4 }, delay);
      }

      // Tasmania — after ~75% of coast
      const tasStart = 0.2 + traceDur * 0.75;
      for (let i = 0; i < TAS.length; i++) {
        const n = nodeMap[`au-t${i}`];
        const delay = tasStart + i * 0.1;
        const sm = 0.7 + srand((i + 100) * 67) * 0.4;

        tl.to(`#${n.id}-dot`, {
          attr: { r: n.dotR * sm }, opacity: 0.3,
          duration: 0.3, ease: 'back.out(2)',
        }, delay);

        tl.to(`#${n.id}-ring`, {
          attr: { r: n.ringR * sm }, opacity: 0.06,
          duration: 0.35,
        }, delay);
      }

      // Tasmania edges + bridge
      const tasEdgeStart = coastLen;
      for (let i = 0; i < TAS.length; i++) {
        tl.to(`#au-e${tasEdgeStart + i}`, {
          opacity: 0.1 + srand((i + 50) * 23) * 0.08,
          duration: 0.35,
        }, tasStart + (i + 0.5) * 0.1);
      }
      tl.to(`#au-e${tasEdgeStart + TAS.length}`, { opacity: 0.08, duration: 0.4 }, tasStart + 0.15);

      // Interior nodes
      const intStart = 1.2;
      for (let i = 0; i < INTERIOR.length; i++) {
        const n = nodeMap[`au-i${i}`];
        const delay = intStart + i * 0.12;
        const sm = 0.6 + srand((i + 200) * 67) * 0.4;

        tl.to(`#${n.id}-dot`, {
          attr: { r: n.dotR * sm }, opacity: 0.2,
          duration: 0.3, ease: 'back.out(2)',
        }, delay);

        tl.to(`#${n.id}-ring`, {
          attr: { r: n.ringR * sm }, opacity: 0.04,
          duration: 0.35,
        }, delay);
      }

      // Interior edges
      const intEdgeStart = tasEdgeStart + TAS.length + 1;
      for (let i = 0; i < INT_EDGES.length; i++) {
        tl.to(`#au-e${intEdgeStart + i}`, {
          opacity: 0.05 + srand((i + 100) * 23) * 0.06,
          duration: 0.4,
        }, 1.5 + i * 0.06);
      }

      // Breathing
      tl.call(() => {
        const bNodeSels = allNodes
          .filter(n => breathNodeIds.has(n.id))
          .map(n => `#${n.id}-ring`);
        const bEdgeSels = allEdges
          .filter(e => breathEdgeIds.has(e.id))
          .map(e => `#${e.id}`);

        if (bNodeSels.length > 0) {
          breathTweens.current.push(
            gsap.to(bNodeSels, {
              attr: { r: '+=4' }, opacity: '+=0.08',
              duration: 2.6, repeat: -1, yoyo: true, ease: 'sine.inOut',
              stagger: { each: 0.08, from: 'random' },
            }),
          );
        }
        if (bEdgeSels.length > 0) {
          breathTweens.current.push(
            gsap.to(bEdgeSels, {
              opacity: '+=0.06',
              duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut',
              stagger: { each: 0.1, from: 'random' },
            }),
          );
        }
        introDone.current = true;
      }, [], 3.5);
    };

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) play(); },
      { threshold: 0.15 },
    );
    observer.observe(svg);

    // Hover proximity
    const onMouseMove = (e: MouseEvent) => {
      if (!introDone.current || !svgRef.current || rafPending.current) return;
      rafPending.current = true;

      requestAnimationFrame(() => {
        rafPending.current = false;
        const s = svgRef.current;
        if (!s) return;

        const rect = s.getBoundingClientRect();
        if (
          e.clientX < rect.left - 60 || e.clientX > rect.right + 60 ||
          e.clientY < rect.top - 60 || e.clientY > rect.bottom + 60
        ) {
          if (hoveredIds.current.size > 0) {
            hoveredIds.current.forEach(id => {
              gsap.to(`#${id}-g`, {
                scale: 1, filter: 'brightness(1)',
                svgOrigin: `${nodeMap[id].tx} ${nodeMap[id].ty}`,
                duration: 0.4, overwrite: true,
              });
            });
            hoveredIds.current.clear();
          }
          return;
        }

        const pt = s.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const ctm = s.getScreenCTM();
        if (!ctm) return;
        const svgPt = pt.matrixTransform(ctm.inverse());

        const newHovered = new Set<string>();

        for (const n of allNodes) {
          const dx = n.tx - svgPt.x;
          const dy = n.ty - svgPt.y;
          const factor = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / HOVER_RADIUS);

          if (factor > 0) {
            newHovered.add(n.id);
            gsap.to(`#${n.id}-g`, {
              scale: 1 + factor * 0.6,
              filter: `brightness(${1 + factor * 0.5})`,
              svgOrigin: `${n.tx} ${n.ty}`,
              duration: 0.2, overwrite: true,
            });
          }
        }

        hoveredIds.current.forEach(id => {
          if (!newHovered.has(id)) {
            gsap.to(`#${id}-g`, {
              scale: 1, filter: 'brightness(1)',
              svgOrigin: `${nodeMap[id].tx} ${nodeMap[id].ty}`,
              duration: 0.4, overwrite: true,
            });
          }
        });

        hoveredIds.current = newHovered;
      });
    };

    document.addEventListener('mousemove', onMouseMove);

    return () => {
      observer.disconnect();
      document.removeEventListener('mousemove', onMouseMove);
      tl?.kill();
      breathTweens.current.forEach(tw => tw.kill());
      breathTweens.current = [];
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 900 700"
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full"
      style={{ overflow: 'visible' }}
      aria-hidden="true"
    >
      <defs>
        <filter id="au-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3" result="blur" />
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
          if (!s || !t) return null;
          return (
            <line
              key={e.id}
              id={e.id}
              x1={s.tx} y1={s.ty}
              x2={t.tx} y2={t.ty}
              stroke="var(--color-edge)"
              strokeWidth={1}
              strokeLinecap="round"
              opacity={0}
            />
          );
        })}
      </g>

      <g>
        {allNodes.map(n => (
          <g key={n.id} id={`${n.id}-g`}>
            <circle
              id={`${n.id}-ring`}
              cx={n.tx} cy={n.ty} r={0}
              fill="none"
              stroke={n.color}
              strokeWidth={0.8}
              opacity={0}
            />
            <circle
              id={`${n.id}-dot`}
              cx={n.tx} cy={n.ty} r={0}
              fill={n.color}
              filter="url(#au-glow)"
              opacity={0}
            />
          </g>
        ))}
      </g>
    </svg>
  );
}

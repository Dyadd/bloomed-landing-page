import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import Icon from './Icon';

/* The animated question on the right of the hero: a real question the visitor
   can answer, which then plays the whole loop - reveal, the concept's mastery
   moving, a zoom out to the map, the answered tile stepping back while the next
   one lights up, and a zoom into it. A ghost cursor answers every question after a short beat unless the
   visitor answers first; a real answer only ever pre-empts the ghost on that question.

   Motion runs through the Web Animations API rather than React state per frame:
   the layered cards are absolutely positioned and each transition is one
   forwards-filling animation keyed on the element, so a re-render never restarts
   one. Ported from the design's HeroSession.dc.html; behaviour and timings are
   the same, apart from the demo constants below. */

type Cell = { n: string; s: number | null } | null;
interface Question {
  concept: string;
  topic: string;
  from: number;
  to: number;
  stem: string;
  options: string[];
  correct: number;
  right: string;
  wrong: string;
  grid: Cell[] | null;
  /* index of the tile the engine routes to next */
  next: number | null;
}

const BAR_STOPS: [number, number[]][] = [[0, [193, 86, 70]], [30, [203, 115, 101]], [52, [214, 154, 95]], [68, [216, 197, 108]], [80, [195, 215, 120]], [92, [211, 250, 112]]];
const TEXT_STOPS: [number, number[]][] = [[0, [150, 54, 42]], [30, [162, 70, 56]], [52, [150, 96, 42]], [68, [122, 104, 34]], [80, [96, 116, 36]], [92, [74, 104, 26]]];

function ramp(stops: [number, number[]][], score: number) {
  const s = Math.max(stops[0][0], Math.min(stops[stops.length - 1][0], score));
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, ca] = stops[i];
    const [b, cb] = stops[i + 1];
    if (s <= b) {
      const t = (s - a) / (b - a);
      const c = ca.map((v, k) => Math.round(v + (cb[k] - v) * t));
      return `rgb(${c[0]},${c[1]},${c[2]})`;
    }
  }
  return `rgb(${stops[stops.length - 1][1].join(',')})`;
}
const barColor = (s: number | null) => ramp(BAR_STOPS, s == null ? 0 : s);
const textColor = (s: number | null) => ramp(TEXT_STOPS, s == null ? 0 : s);
function band(s: number | null) {
  if (s == null) return 'Untouched';
  if (s >= 85) return 'Mastered';
  if (s >= 70) return 'Strong';
  if (s >= 52) return 'Developing';
  if (s >= 30) return 'Weak';
  return 'Struggling';
}

const QUESTIONS: Question[] = [
  {
    concept: 'Asthma step-up therapy', topic: 'Respiratory medicine', from: 34, to: 60,
    stem: 'A 24-year-old woman with asthma uses her salbutamol inhaler four times a week, six months into a low-dose inhaled corticosteroid. What is the most appropriate next step?',
    options: ['Add a long-acting beta agonist', 'Check inhaler technique and adherence', 'Double the inhaled corticosteroid dose', 'Start oral prednisolone'],
    correct: 1,
    right: 'You checked control and adherence before stepping up therapy.',
    wrong: 'You stepped up therapy before checking control and adherence. Let us understand the underpinning physiology.',
    grid: [
      { n: 'Bronchiectasis', s: 71 }, { n: 'Acid-base compensation', s: 51 }, { n: 'Pneumonia severity', s: 84 },
      { n: 'Pulmonary function tests', s: 62 }, null, { n: 'Oxygen therapy targets', s: 88 },
      { n: 'Pleural effusion', s: 44 }, { n: 'ABG interpretation', s: 69 }, { n: 'Asthma in pregnancy', s: null },
    ],
    next: 1,
  },
  {
    concept: 'Acid-base compensation', topic: 'Renal medicine', from: 51, to: 77,
    stem: 'An arterial blood gas shows pH 7.32, PaCO2 30 mmHg and bicarbonate 15 mmol/L. Which disturbance best explains these results?',
    options: ['Respiratory acidosis', 'Metabolic acidosis with respiratory compensation', 'Metabolic alkalosis', 'Mixed respiratory and metabolic alkalosis'],
    correct: 1,
    right: 'You read the compensation in the right direction. A couple more to make sure it sticks.',
    wrong: 'You read the compensation in the wrong direction. The bicarbonate is the primary change here.',
    grid: [
      { n: 'Hyponatraemia', s: 58 }, { n: 'Renal tubular acidosis', s: 47 }, { n: 'AKI staging', s: 76 },
      { n: 'Potassium disorders', s: 66 }, null, { n: 'Warfarin reversal', s: null },
      { n: 'Diuretic pharmacology', s: 81 }, { n: 'Contrast nephropathy', s: 39 }, { n: 'Dialysis indications', s: 72 },
    ],
    next: 5,
  },
  {
    concept: 'Warfarin reversal', topic: 'Haematology', from: 26, to: 52,
    stem: 'A 71-year-old man taking warfarin has an INR of 8.4 and no bleeding. What is the most appropriate management?',
    options: ['Withhold warfarin and give oral vitamin K', 'Give fresh frozen plasma', 'Continue warfarin at a reduced dose', 'Give prothrombin complex concentrate'],
    correct: 0,
    right: 'You asked whether there was bleeding before reaching for a reversal agent.',
    wrong: 'You reached for a reversal agent before asking whether there was bleeding.',
    grid: null, next: null,
  },
];

const CW = 178;
const CH = 104;
const G = 12;
const ZS = 3.05;
/* the count-up runs in six discrete steps, not per frame */
const STEPS = [0, 0.18, 0.38, 0.58, 0.78, 1];

/* Ghost-cursor demo timing (each scaled by `pace`): the cursor appears
   DEMO_ARM_MS after mount, travels for DEMO_TRAVEL_MS, then presses DEMO_PRESS_MS
   later. The design shipped 4200 / 980 / 300 and the hero sat still for five
   seconds; the ask was to make it move sooner while leaving the options live. */
const DEMO_ARM_MS = 1300;
const DEMO_TRAVEL_MS = 720;
const DEMO_PRESS_MS = 240;
const OPTION_NUDGE_MS = 320;
/* the handover (answered tile stepping back, next tile lighting up) transitions over
   ROUTE_DRAW_MS, then holds for ROUTE_HOLD_MS before the zoom in */
const ROUTE_DRAW_MS = 700;
const ROUTE_HOLD_MS = 1000;
/* after the last question's growth card the loop returns to the first question */
const LOOP_HOLD_MS = 1600;

const RISE = 'cubic-bezier(0.2, 0.8, 0.3, 1)';
const TRAVEL = 'cubic-bezier(0.24, 0.62, 0.32, 1)';

type Phase = 'asking' | 'revealed' | 'growth' | 'zoomout' | 'routing' | 'zoomin';
const GROWN: Phase[] = ['growth', 'zoomout', 'routing', 'zoomin'];
const GRID_ON: Phase[] = ['zoomout', 'routing', 'zoomin'];

const PHASE_LABEL: Record<Phase, string> = {
  asking: 'Your turn - pick an answer',
  revealed: 'Reading how you got there',
  growth: 'Your knowledge, updated',
  zoomout: 'Where that sits on your map',
  routing: 'Choosing your next question',
  zoomin: 'Loading that question',
};

interface State {
  mi: number;
  picked: number | null;
  phase: Phase;
  to: number | null;
  /* routing: -1 idle, 0 handing over */
  scanStep: number;
  grow: number;
  w: number;
}

const INITIAL: State = { mi: 0, picked: null, phase: 'asking', to: null, scanStep: -1, grow: 0, w: 660 };

interface Props {
  pace?: number;
  autoRoute?: boolean;
  autoDemo?: boolean;
}

type Keyframe = Record<string, string | number>;

/* One forwards-filling animation per (element, key). The key lives on the
   element so a repaint with the same target is a no-op rather than a restart. */
function play(el: HTMLElement | null, id: string, key: string, from: Keyframe, to: Keyframe, dur: number, easing: string) {
  if (!el) return;
  const stamp = id + ':' + key;
  if (el.dataset.animKey === stamp) return;
  el.dataset.animKey = stamp;
  el.getAnimations().forEach((a) => a.cancel());
  el.animate([from, to], { duration: dur, easing, fill: 'forwards' });
}

export default function HeroSession({ pace = 1, autoRoute = true, autoDemo = true }: Props) {
  const [s, setS] = useState<State>(INITIAL);
  const sRef = useRef(s);
  sRef.current = s;
  const propsRef = useRef({ pace, autoRoute, autoDemo });
  propsRef.current = { pace, autoRoute, autoDemo };

  const rootEl = useRef<HTMLDivElement>(null);
  const frameEl = useRef<HTMLDivElement>(null);
  const cursorEl = useRef<HTMLDivElement>(null);
  const rippleEl = useRef<HTMLDivElement>(null);
  const qEl = useRef<HTMLDivElement>(null);
  const growthEl = useRef<HTMLDivElement>(null);
  const gridEl = useRef<HTMLDivElement>(null);
  const gridInnerEl = useRef<HTMLDivElement>(null);
  const optEls = useRef<(HTMLDivElement | null)[]>([]);

  /* session beats and the ghost-cursor demo keep separate timer lists, so a real
     click mid-demo can drop the demo's pending beats without touching its own */
  const tm = useRef<number[]>([]);
  const dm = useRef<number[]>([]);
  const demoT = useRef<number | undefined>(undefined);

  const go = (patch: Partial<State>) => setS((prev) => ({ ...prev, ...patch }));
  const at = (ms: number, fn: () => void) => { tm.current.push(window.setTimeout(fn, ms * propsRef.current.pace)); };
  const demoAt = (ms: number, fn: () => void) => { dm.current.push(window.setTimeout(fn, ms * propsRef.current.pace)); };
  const clearDemoTimers = () => { dm.current.forEach(clearTimeout); dm.current = []; };
  const clearTimers = () => { tm.current.forEach(clearTimeout); tm.current = []; clearDemoTimers(); };

  const disarmDemo = () => {
    clearTimeout(demoT.current);
    clearDemoTimers();
    /* fade the ghost where it stands: cancelling its travel animation would drop
       it back to the frame's origin for the fade, a flick to the top-left corner */
    const c = cursorEl.current;
    if (c && c.style.opacity === '1') {
      c.style.opacity = '0';
      c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: 'forwards' });
    }
  };

  const answer = (i: number) => {
    disarmDemo();
    optEls.current.forEach((el) => { if (el) delete el.dataset.pressed; });
    const st = sRef.current;
    if (st.phase !== 'asking') return;
    const q = QUESTIONS[st.mi];
    const right = i === q.correct;
    go({ picked: i, phase: 'revealed', to: right ? q.to : Math.max(10, q.from - 8) });
    at(1800, () => {
      go({ phase: 'growth', grow: 0 });
      STEPS.forEach((v, k) => { if (k) at(180 + k * 230, () => go({ grow: v })); });
      at(2400, () => {
        if (!q.grid || propsRef.current.autoRoute === false) {
          at(LOOP_HOLD_MS, () => go({ ...INITIAL, w: sRef.current.w }));
          return;
        }
        go({ phase: 'zoomout', scanStep: -1 });
        at(1600, () => {
          go({ phase: 'routing', scanStep: 0 });
          at(ROUTE_DRAW_MS + ROUTE_HOLD_MS, () => {
            go({ phase: 'zoomin' });
            at(780, () => go({ mi: sRef.current.mi + 1, picked: null, phase: 'asking', scanStep: -1, to: null, grow: 0 }));
          });
        });
      });
    });
  };

  const runDemo = () => {
    const st = sRef.current;
    const q = QUESTIONS[st.mi];
    const target = optEls.current[q.correct];
    const c = cursorEl.current;
    const frame = frameEl.current;
    if (!target || !c || !frame || st.phase !== 'asking') return;
    const f = frame.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    const x = r.left - f.left + 52;
    const y = r.top - f.top + r.height / 2 - 6;
    c.getAnimations().forEach((a) => a.cancel());
    c.style.opacity = '1';
    c.animate(
      [
        { transform: `translate(${f.width - 56}px, ${f.height - 34}px)`, opacity: 0 },
        { transform: `translate(${x}px, ${y}px)`, opacity: 1 },
      ],
      { duration: DEMO_TRAVEL_MS, easing: TRAVEL, fill: 'forwards' },
    );
    demoAt(DEMO_TRAVEL_MS + 40, () => {
      target.dataset.pressed = '1';
      rippleEl.current?.animate(
        [{ transform: 'scale(0.35)', opacity: 0.9 }, { transform: 'scale(1.5)', opacity: 0 }],
        { duration: 520, easing: RISE },
      );
      demoAt(DEMO_PRESS_MS, () => answer(q.correct));
    });
  };

  const armDemo = () => {
    clearTimeout(demoT.current);
    if (propsRef.current.autoDemo === false) return;
    demoT.current = window.setTimeout(runDemo, DEMO_ARM_MS * propsRef.current.pace);
  };

  useEffect(() => {
    const el = rootEl.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (Math.abs(w - sRef.current.w) > 8) go({ w });
    });
    ro.observe(el);
    return () => {
      clearTimers();
      clearTimeout(demoT.current);
      ro.disconnect();
    };
    // mount only: everything it touches is a ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* the ghost arms itself every time a question is asked - the first, each one the
     engine loads, and the first again when the loop comes round - so the whole
     thing plays through unattended */
  useEffect(() => {
    if (s.phase !== 'asking') return;
    armDemo();
    return () => clearTimeout(demoT.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.mi, s.phase]);

  /* the option rows are keyed per question, so each new question mounts fresh
     rows and the nudge replays */
  useEffect(() => {
    if (s.phase !== 'asking') return;
    optEls.current.forEach((el, i) => {
      if (el) el.style.animation = `nudge 620ms ${RISE} ${OPTION_NUDGE_MS + i * 80}ms 1`;
    });
  }, [s.mi, s.phase]);

  const mi = Math.min(s.mi, QUESTIONS.length - 1);
  const q = QUESTIONS[mi];
  const phase = s.phase;
  const revealed = phase !== 'asking';
  const right = s.picked === q.correct;
  const to = s.to == null ? q.from : s.to;
  const grown = GROWN.includes(phase);
  const p = phase === 'growth' ? s.grow : grown ? 1 : 0;
  const live = q.from + (to - q.from) * p;
  const lagged = q.from + (to - q.from) * (p >= 1 ? 1 : Math.max(0, p - 0.2));

  const chosen = q.next == null ? -1 : q.next;
  const decided = phase === 'routing' || phase === 'zoomin';
  const dx = chosen >= 0 ? ((chosen % 3) - 1) * (CW + G) : 0;
  const dy = chosen >= 0 ? (Math.floor(chosen / 3) - 1) * (CH + G) : 0;
  const k = Math.max(0.42, Math.min(1, (s.w - 12) / 570));

  /* paint the layers after every commit, from the committed state */
  useLayoutEffect(() => {
    const asking = phase === 'asking' || phase === 'revealed';
    const showGrowth = phase === 'growth';
    const gridOn = GRID_ON.includes(phase);

    const qTo = asking ? { opacity: 1, transform: 'scale(1)' } : { opacity: 0, transform: 'scale(0.94)' };
    const qFrom = asking ? { opacity: 0, transform: 'scale(0.98)' } : { opacity: 1, transform: 'scale(1)' };
    play(qEl.current, 'q', String(asking), qFrom, qTo, 380, RISE);
    if (qEl.current) qEl.current.style.pointerEvents = phase === 'asking' ? 'auto' : 'none';

    const gKey = showGrowth ? 'on' : phase === 'revealed' ? 'pre' : 'off';
    const gMap: Record<string, Keyframe> = {
      pre: { opacity: 0, transform: 'scale(1.06)' },
      on: { opacity: 1, transform: 'scale(1)' },
      off: { opacity: 0, transform: 'scale(0.72)' },
    };
    const gFrom = showGrowth ? gMap.pre : phase === 'revealed' ? gMap.off : gMap.on;
    play(growthEl.current, 'growth', gKey, gFrom, gMap[gKey], showGrowth ? 460 : 520, TRAVEL);

    play(gridEl.current, 'grid', String(gridOn), { opacity: gridOn ? 0 : 1 }, { opacity: gridOn ? 1 : 0 }, 420, RISE);
    if (gridEl.current) gridEl.current.style.transform = `scale(${k})`;

    const stage = phase === 'zoomout' || phase === 'routing' ? 'out' : phase === 'zoomin' ? 'in' : 'idle';
    const FIELD: Record<string, [Keyframe, Keyframe, number]> = {
      idle: [{ transform: 'scale(3.05)' }, { transform: 'scale(3.05)' }, 1],
      out: [{ transform: 'scale(3.05)' }, { transform: 'scale(1)' }, 1350],
      in: [{ transform: 'translate(0px, 0px) scale(1)' }, { transform: `translate(${-dx * ZS}px, ${-dy * ZS}px) scale(3.05)` }, 780],
    };
    play(gridInnerEl.current, 'field', stage, FIELD[stage][0], FIELD[stage][1], FIELD[stage][2], TRAVEL);
  });

  const showReason = phase === 'revealed' || phase === 'growth';
  const moveLine = to - q.from > 0
    ? `Up from ${band(q.from).toLowerCase()} to ${band(to).toLowerCase()}.`
    : `Re-opened, and dropped from ${band(q.from).toLowerCase()}. A miss here is the useful result of the session.`;

  return (
    <div ref={rootEl} style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '0 2px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 11, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--ink)' }}>
          <Icon name="bolt" size={14} />
          {PHASE_LABEL[phase]}
        </span>
        <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums' }}>
          Question {mi + 1} of {QUESTIONS.length}
        </span>
      </div>

      <div ref={frameEl} className="hs-frame">
        <div ref={cursorEl} aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, width: 34, height: 34, opacity: 0, pointerEvents: 'none', zIndex: 5 }}>
          <div ref={rippleEl} style={{ position: 'absolute', left: -7, top: -7, width: 30, height: 30, borderRadius: '50%', border: '1.5px solid var(--ink)', opacity: 0 }} />
          <div style={{ position: 'absolute', left: 0, top: 0, width: 15, height: 21, background: 'var(--ink)', clipPath: 'polygon(0 0, 0 76%, 27% 58%, 48% 100%, 68% 90%, 47% 49%, 100% 45%)', filter: 'drop-shadow(0 1px 2px rgba(251,255,240,0.9))' }} />
        </div>

        {/* the question card */}
        <div
          ref={qEl}
          style={{ position: 'absolute', inset: 0, opacity: 1, display: 'flex', flexDirection: 'column', gap: 16, background: 'var(--paper-cream)', border: '0.5px solid var(--line)', borderRadius: 18, padding: 26, boxShadow: 'var(--shadow-rest)', boxSizing: 'border-box' }}
        >
          <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{q.topic} · {q.concept}</span>
          <div style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--ink-body-strong)', maxWidth: '64ch' }}>{q.stem}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {q.options.map((label, i) => {
              const pickedThis = s.picked === i;
              const isCorrect = revealed && i === q.correct;
              const isWrong = revealed && pickedThis && !right;
              const emphasised = isCorrect || isWrong || (pickedThis && !revealed);
              return (
                <div
                  key={`${mi}-${i}`}
                  ref={(el) => { optEls.current[i] = el; }}
                  className="hs-opt"
                  role="button"
                  tabIndex={phase === 'asking' ? 0 : -1}
                  data-asking={phase === 'asking' ? '1' : undefined}
                  onClick={() => answer(i)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); answer(i); } }}
                  style={{
                    '--opt-bg': isCorrect ? 'var(--lime)' : 'var(--paper-white)',
                    '--opt-border': emphasised ? '1px solid var(--ink)' : '0.5px solid var(--line)',
                    opacity: revealed && !isCorrect && !isWrong ? 0.5 : 1,
                    cursor: phase === 'asking' ? 'pointer' : 'default',
                  } as CSSProperties}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', flexShrink: 0, fontSize: 12, fontWeight: 500, background: isCorrect || isWrong ? 'var(--ink)' : 'var(--paper-cream)', color: isCorrect || isWrong ? 'var(--on-dark)' : 'var(--ink-muted)', border: '0.5px solid var(--line)' }}>
                    {'ABCD'[i]}
                  </span>
                  <span style={{ fontSize: 14, lineHeight: 1.45, flex: 1 }}>{label}</span>
                  {isCorrect && <Icon name="check" size={17} />}
                  {isWrong && <Icon name="x" size={17} color="var(--terracotta-deep)" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* the growth card */}
        <div
          ref={growthEl}
          style={{ position: 'absolute', inset: 0, opacity: 0, transform: 'scale(1.06)', transformOrigin: 'center', pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 18, background: 'var(--paper-cream)', border: '0.5px solid var(--line)', borderRadius: 18, padding: 30, boxShadow: 'var(--shadow-rest)', boxSizing: 'border-box' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{q.topic} · {q.concept}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, lineHeight: 1.25, letterSpacing: '-0.012em' }}>{q.concept}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 72, lineHeight: 0.95, fontVariantNumeric: 'tabular-nums', color: textColor(live) }}>{Math.round(live)}</span>
              <span style={{ fontSize: 16, color: 'var(--ink-faint)' }}>/100</span>
              <span style={{ marginLeft: 11, fontSize: 19, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: to - q.from > 0 ? 'var(--lime-deep)' : 'var(--terracotta-deep)' }}>
                {(to - q.from > 0 ? '+' : '') + Math.round(live - q.from)}
              </span>
            </div>
            <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.005em', color: textColor(live), paddingBottom: 8 }}>{band(lagged)}</span>
          </div>
          <div style={{ position: 'relative', height: 10, borderRadius: 5, background: 'var(--track)', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: '0 auto 0 0', width: `${Math.max(0, Math.min(100, live))}%`, borderRadius: 5, background: barColor(live), transition: 'width 0.45s var(--ease-fill), background 0.45s var(--ease-fill)' }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${q.from}%`, width: 1, background: 'var(--ink)', opacity: 0.4 }} />
          </div>
          <span style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-body-strong)', maxWidth: '46ch' }}>{moveLine}</span>
          {showReason && (
            <div style={{ display: 'flex', gap: 13, alignItems: 'flex-start', background: 'var(--paper-white)', border: '0.5px solid var(--line-warm)', borderRadius: 12, padding: '18px 20px', marginTop: 'auto' }}>
              <Icon name={right ? 'check' : 'route'} size={19} color={right ? 'var(--lime-deep)' : 'var(--terracotta-deep)'} style={{ marginTop: 1 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.005em' }}>{right ? 'Excellent, you get it now!' : 'Not quite.'}</span>
                <span style={{ fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink-body-strong)' }}>{right ? q.right : q.wrong}</span>
              </div>
            </div>
          )}
        </div>

        {/* the map */}
        <div ref={gridEl} aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, pointerEvents: 'none' }}>
          <div ref={gridInnerEl} style={{ display: 'grid', gridTemplateColumns: `repeat(3, ${CW}px)`, gridAutoRows: CH, gap: G, transform: 'scale(3.05)', transformOrigin: 'center' }}>
            {(q.grid || []).map((c, i) => {
              const isCentre = i === 4;
              const cell = isCentre ? { n: q.concept, s: live } : c;
              if (!cell) return <div key={i} />;
              const isChosen = i === chosen && decided;
              /* the answered tile steps back once the next one is lit */
              const stepped = isCentre && decided;
              const unseen = cell.s == null;
              const showChip = isCentre || isChosen;
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 8, padding: 13, boxSizing: 'border-box', borderRadius: 12,
                    background: isChosen || (isCentre && !stepped) ? 'var(--paper-white)' : 'var(--paper-cream)',
                    border: isChosen || (isCentre && !stepped) ? '1px solid var(--ink)' : '0.5px solid var(--line)',
                    /* the backlight: a lime ring and a soft lime glow behind the next tile */
                    boxShadow: isChosen ? '0 0 0 3px var(--lime), 0 0 30px 8px rgba(211, 250, 112, 0.8)' : '0 0 0 0 rgba(211, 250, 112, 0), 0 0 0 0 rgba(211, 250, 112, 0)',
                    transform: isChosen ? 'scale(1.04)' : 'scale(1)',
                    position: 'relative',
                    zIndex: isChosen ? 1 : 0,
                    opacity: !decided || isChosen ? 1 : stepped ? 0.55 : 0.32,
                    transition: `opacity ${ROUTE_DRAW_MS}ms ease, border-color ${ROUTE_DRAW_MS}ms ease, background ${ROUTE_DRAW_MS}ms ease, box-shadow ${ROUTE_DRAW_MS}ms var(--ease-fill), transform ${ROUTE_DRAW_MS}ms var(--ease-travel)`,
                  }}
                >
                  <span style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.3 }}>{cell.n}</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: unseen ? 'var(--ink-faint)' : textColor(cell.s) }}>
                      {unseen ? '-' : Math.round(cell.s as number)}
                    </span>
                    {showChip && (
                      <span style={{ fontSize: 9.5, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '3px 7px', borderRadius: 6, background: isChosen ? 'var(--lime)' : stepped ? 'var(--paper-white)' : 'var(--lime-soft)', border: '0.5px solid var(--line)', whiteSpace: 'nowrap', transition: `background ${ROUTE_DRAW_MS}ms ease` }}>
                        {isChosen ? 'Next' : 'Just answered'}
                      </span>
                    )}
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--track)', overflow: 'hidden' }}>
                    <div style={{ width: `${unseen ? 0 : Math.max(0, Math.min(100, cell.s as number))}%`, height: '100%', borderRadius: 3, background: barColor(cell.s) }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

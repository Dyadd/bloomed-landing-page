import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import Icon from './Icon';
import { QUESTIONS, band, barColor, textColor, type Question, type Tutor } from '../lib/heroQuestions';

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
/* the tutor beat: a typing pause before the follow-up appears, time to read it,
   the ghost's typing speed per character, a beat before it presses send, the
   hold on the sent reply before the map, and how long a visitor who has taken
   over the keyboard gets before the ghost finishes for them */
const TUTOR_THINK_MS = 700;
const TUTOR_READ_MS = 1500;
const TYPE_MS = 42;
const TUTOR_SEND_MS = 420;
const TUTOR_HOLD_MS = 1300;
const TUTOR_IDLE_MS = 15000;

const RISE = 'cubic-bezier(0.2, 0.8, 0.3, 1)';
const TRAVEL = 'cubic-bezier(0.24, 0.62, 0.32, 1)';

type Phase = 'asking' | 'revealed' | 'growth' | 'tutor' | 'zoomout' | 'routing' | 'zoomin';
const GROWN: Phase[] = ['growth', 'tutor', 'zoomout', 'routing', 'zoomin'];
const GRID_ON: Phase[] = ['zoomout', 'routing', 'zoomin'];

const PHASE_LABEL: Record<Phase, string> = {
  asking: 'Your turn - pick an answer',
  revealed: 'Reading how you got there',
  growth: 'Your knowledge, updated',
  tutor: 'Your tutor has a question',
  zoomout: 'Your mastery of nearby concepts',
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
  /* tutor: 0 thinking, 1 follow-up shown, 2 reply sent */
  tutorStep: number;
  typed: string;
  reply: string;
}

const INITIAL: State = { mi: 0, picked: null, phase: 'asking', to: null, scanStep: -1, grow: 0, w: 660, tutorStep: 0, typed: '', reply: '' };

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
  const tutorEl = useRef<HTMLDivElement>(null);
  const gridEl = useRef<HTMLDivElement>(null);
  const gridInnerEl = useRef<HTMLDivElement>(null);
  const optEls = useRef<(HTMLDivElement | null)[]>([]);

  /* session beats and the ghost-cursor demo keep separate timer lists, so a real
     click mid-demo can drop the demo's pending beats without touching its own */
  const tm = useRef<number[]>([]);
  const dm = useRef<number[]>([]);
  const demoT = useRef<number | undefined>(undefined);
  /* the ghost's typing in the tutor beat has its own list too, so a visitor's first
     keystroke can stop it without touching the session's own beats */
  const tt = useRef<number[]>([]);
  const userTyping = useRef(false);

  const go = (patch: Partial<State>) => setS((prev) => ({ ...prev, ...patch }));
  const at = (ms: number, fn: () => void) => { tm.current.push(window.setTimeout(fn, ms * propsRef.current.pace)); };
  const demoAt = (ms: number, fn: () => void) => { dm.current.push(window.setTimeout(fn, ms * propsRef.current.pace)); };
  const tutorAt = (ms: number, fn: () => void) => { tt.current.push(window.setTimeout(fn, ms * propsRef.current.pace)); };
  const clearDemoTimers = () => { dm.current.forEach(clearTimeout); dm.current = []; };
  const clearTutorTimers = () => { tt.current.forEach(clearTimeout); tt.current = []; };
  const clearTimers = () => { tm.current.forEach(clearTimeout); tm.current = []; clearDemoTimers(); clearTutorTimers(); };

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
      if (q.tutor) {
        userTyping.current = false;
        go({ phase: 'tutor', tutorStep: 0, typed: '', reply: '' });
        runTutor(q.tutor);
        return;
      }
      go({ phase: 'growth', grow: 0 });
      STEPS.forEach((v, k) => { if (k) at(180 + k * 230, () => go({ grow: v })); });
      at(2400, () => routeOn(q));
    });
  };

  /* the zoom out to the map, the handover, and the zoom into the next question */
  const routeOn = (q: Question) => {
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
  };

  /* the tutor beat unattended: the follow-up appears, the ghost types its reply
     a character at a time, presses send, and the session moves on */
  const runTutor = (t: Tutor) => {
    tutorAt(TUTOR_THINK_MS, () => go({ tutorStep: 1 }));
    tutorAt(TUTOR_THINK_MS + TUTOR_READ_MS, () => {
      const chars = [...t.reply];
      chars.forEach((_, k) => tutorAt(k * TYPE_MS, () => go({ typed: t.reply.slice(0, k + 1) })));
      tutorAt(chars.length * TYPE_MS + TUTOR_SEND_MS, () => finishTutor(t.reply));
    });
  };

  const finishTutor = (text: string) => {
    const st = sRef.current;
    if (st.phase !== 'tutor' || st.tutorStep === 2) return;
    clearTutorTimers();
    go({ tutorStep: 2, reply: text, typed: '' });
    at(TUTOR_HOLD_MS, () => routeOn(QUESTIONS[st.mi]));
  };

  /* a visitor at the keyboard: the ghost stops on the first focus or keystroke,
     the follow-up shows at once if it hasn't yet, and send is theirs to press */
  const takeOver = () => {
    const st = sRef.current;
    if (st.phase !== 'tutor' || st.tutorStep === 2 || userTyping.current) return;
    userTyping.current = true;
    clearTutorTimers();
    if (st.tutorStep === 0) go({ tutorStep: 1 });
    const t = QUESTIONS[st.mi].tutor;
    tutorAt(TUTOR_IDLE_MS, () => finishTutor(sRef.current.typed.trim() || (t ? t.reply : '')));
  };

  const sendReply = () => {
    const text = sRef.current.typed.trim();
    if (text) finishTutor(text);
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

    const showTutor = phase === 'tutor';
    const tKey = showTutor ? 'on' : phase === 'revealed' ? 'pre' : 'off';
    const tFrom = showTutor ? gMap.pre : phase === 'revealed' ? gMap.off : gMap.on;
    play(tutorEl.current, 'tutor', tKey, tFrom, gMap[tKey], showTutor ? 460 : 520, TRAVEL);
    if (tutorEl.current) tutorEl.current.style.pointerEvents = showTutor ? 'auto' : 'none';

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
          <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{q.topic}</span>
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
            <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{q.topic}</span>
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

        {/* the tutor card: shown in place of the growth card after a question that carries a tutor beat */}
        <div
          ref={tutorEl}
          className="hs-chat"
          style={{ position: 'absolute', inset: 0, opacity: 0, transform: 'scale(1.06)', transformOrigin: 'center', pointerEvents: 'none', borderRadius: 18, padding: 26, boxShadow: 'var(--shadow-rest)', boxSizing: 'border-box', gap: 16 }}
        >
          <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{q.topic}</span>
          {/* messages hang from the composer, the way a chat does, so the card doesn't gape when the ghost is still typing */}
          <div className="hs-chat-msg" style={{ marginTop: 'auto' }}>
            <span className="hs-chat-avatar"><Icon name="bolt" size={13} /></span>
            <div className="hs-chat-msg-body">
              <span className="hs-chat-who"><span className="hs-chat-online" />Tutor</span>
              {s.tutorStep === 0
                ? <div className="hs-chat-bubble hs-chat-typing" aria-label="Tutor is typing"><span /><span /><span /></div>
                : <div className="hs-chat-bubble">{q.tutor ? (right ? q.tutor.right : q.tutor.wrong) : ''}</div>}
            </div>
          </div>
          {s.reply && (
            <div className="hs-chat-msg hs-chat-msg-you">
              <div className="hs-chat-msg-body">
                <span className="hs-chat-who">You</span>
                <div className="hs-chat-reply">{s.reply}</div>
              </div>
            </div>
          )}
          <form className="hs-chat-composer" onSubmit={(e) => { e.preventDefault(); sendReply(); }}>
            <input
              className="hs-chat-input"
              type="text"
              value={s.typed}
              placeholder={s.tutorStep === 2 ? 'Sent' : 'Reply to your tutor…'}
              aria-label="Reply to your tutor"
              autoComplete="off"
              disabled={s.tutorStep === 2}
              tabIndex={phase === 'tutor' ? 0 : -1}
              onFocus={takeOver}
              onChange={(e) => { takeOver(); go({ typed: e.target.value }); }}
            />
            <button type="submit" className="hs-chat-send" aria-label="Send reply" disabled={s.tutorStep === 2} tabIndex={phase === 'tutor' ? 0 : -1}>
              <Icon name="arrow-right" size={14} color="var(--on-dark)" />
            </button>
          </form>
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

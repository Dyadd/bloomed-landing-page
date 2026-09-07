import { useRef, type MouseEvent, type ReactNode } from 'react';
import Icon from './Icon';
import { QUESTIONS, band, barColor } from '../lib/heroQuestions';
import { SIGN_UP_URL } from '../lib/links';

/* The hero's right-hand side where motion is off: one session laid out as a
   sequence. Three questions down a spine, and between them what Bloomed does
   with an answer - finds the weak spot after a miss, has the tutor ask a
   follow-up, and chooses the next question. Nothing here is timed or tweened;
   the only live control is the chat composer: a real text field whose send goes to sign-up. */

const [ASTHMA, ACID_BASE] = QUESTIONS;

const CONTROL = {
  concept: 'Asthma control assessment', topic: 'Respiratory medicine',
  stem: 'The same patient returns four weeks later. Which finding best indicates her asthma is now well controlled?',
};

const ASTHMA_MISS = Math.max(10, ASTHMA.from - 8);

function Question({ n, topic, stem, outcome }: { n: number; topic: string; stem: string; outcome: 'missed' | 'correct' | 'next' }) {
  const pill = {
    missed: { label: 'Missed', bg: 'var(--paper-white)', color: 'var(--terracotta-deep)', icon: 'x' as const },
    correct: { label: 'Correct', bg: 'var(--paper-white)', color: 'var(--lime-deep)', icon: 'check' as const },
    next: { label: 'Chosen for you', bg: 'var(--lime)', color: 'var(--ink)', icon: 'arrow-right' as const },
  }[outcome];
  return (
    <li className="hs-seq-item">
      <span className="hs-seq-node">Q{n}</span>
      <div className="hs-seq-q" style={outcome === 'next' ? { borderColor: 'var(--ink)', borderWidth: 1 } : undefined}>
        <div className="hs-seq-q-head">
          <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{topic}</span>
          <span className="hs-seq-pill" style={{ background: pill.bg, color: pill.color }}>
            <Icon name={pill.icon} size={12} color={pill.color} />
            {pill.label}
          </span>
        </div>
        <div className="hs-seq-stem">{stem}</div>
      </div>
    </li>
  );
}

/* A card that tilts gently toward the pointer like a trading card. Pure
   transform on hover, so it costs nothing until touched and does nothing at
   all on a touch screen. */
const TILT_DEG = 4;
function TiltCard({ className, children }: { className: string; children: ReactNode }) {
  const el = useRef<HTMLDivElement>(null);
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const c = el.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    c.style.setProperty('--rx', `${((0.5 - py) * TILT_DEG * 2).toFixed(2)}deg`);
    c.style.setProperty('--ry', `${((px - 0.5) * TILT_DEG * 2).toFixed(2)}deg`);
  };
  const onLeave = () => {
    const c = el.current;
    if (!c) return;
    c.style.removeProperty('--rx');
    c.style.removeProperty('--ry');
  };
  return (
    <div ref={el} className={`${className} hs-tilt`} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  );
}

function Beat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <li className="hs-seq-item">
      <span className="hs-seq-dot" />
      <TiltCard className="hs-seq-beat">
        <span className="hs-seq-beat-label">{label}</span>
        {children}
      </TiltCard>
    </li>
  );
}

export default function HeroStill() {
  return (
    <div className="hs-still">
      <ol className="hs-seq">
        <Question n={1} topic={ASTHMA.topic} stem={ASTHMA.stem} outcome="missed" />

        <Beat label="Weak spot found">
          <span className="hs-seq-mark">{ASTHMA.concept}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative', flex: 1, height: 8, borderRadius: 4, background: 'var(--ink)', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: '0 auto 0 0', width: `${ASTHMA_MISS}%`, borderRadius: 4, background: barColor(ASTHMA_MISS) }} />
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${ASTHMA.from}%`, width: 1, background: 'var(--on-dark)', opacity: 0.6 }} />
            </div>
            <span style={{ fontSize: 13.5, fontWeight: 500, whiteSpace: 'nowrap', color: 'var(--terracotta-deep)' }}>{band(ASTHMA_MISS)}</span>
          </div>
        </Beat>

        <Question n={2} topic={CONTROL.topic} stem={CONTROL.stem} outcome="correct" />

        <li className="hs-seq-item">
          <span className="hs-seq-dot" />
          <TiltCard className="hs-chat">
            <div className="hs-chat-msg">
              <span className="hs-chat-avatar"><Icon name="bolt" size={13} /></span>
              <div className="hs-chat-msg-body">
                <span className="hs-chat-who"><span className="hs-chat-online" />Tutor</span>
                <div className="hs-chat-bubble">
                  You checked control first this time. Before adding a long-acting beta agonist, what is the one thing you would want to see her do in front of you?
                </div>
              </div>
            </div>
            <div className="hs-chat-msg hs-chat-msg-you">
              <div className="hs-chat-msg-body">
                <span className="hs-chat-who">You</span>
                <div className="hs-chat-reply">Use her inhaler in front of me</div>
              </div>
            </div>
            {/* the composer is the storyboard's one live control: you can type a reply,
                and sending it goes exactly where the sign-up button goes */}
            <form className="hs-chat-composer" onSubmit={(e) => { e.preventDefault(); window.location.assign(SIGN_UP_URL); }}>
              <input className="hs-chat-input" type="text" placeholder="Reply to your tutor…" aria-label="Reply to your tutor" autoComplete="off" />
              <button type="submit" className="hs-chat-send" aria-label="Send reply and sign up">
                <Icon name="arrow-right" size={14} color="var(--on-dark)" />
              </button>
            </form>
          </TiltCard>
        </li>

        <Question n={3} topic={ACID_BASE.topic} stem={ACID_BASE.stem} outcome="next" />
      </ol>
    </div>
  );
}

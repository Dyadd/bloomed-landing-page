import Icon from './Icon';
import Sparkline from './Sparkline';

const SPARK = [
  { value: 20, color: '#c3d778' },
  { value: 30, color: '#d3fa70' },
  { value: 14, color: '#d8c56c' },
  { value: 24, color: '#c3d778' },
  { value: 10, color: '#d69a5f' },
];

export default function HowItWorks() {
  return (
    <section className="how" id="how-it-works">
      <div className="how-head">
        <div className="how-eyebrow">How it works</div>
        <h2 className="how-title">Three things happen every time you answer.</h2>
      </div>
      <div className="how-grid">
        <div className="how-card">
          <span className="how-num">01</span>
          <div className="how-glyph">
            <Sparkline points={SPARK} maxHeight={30} />
          </div>
          <div className="how-card-title">We watch how you got it wrong</div>
          <div className="how-card-body">
            Getting an answer wrong tells us which part of your reasoning slipped, so we understand what you need to correct it.
          </div>
        </div>
        <div className="how-card">
          <span className="how-num">02</span>
          <div className="how-glyph" aria-hidden="true">
            <span className="how-cell" style={{ background: '#d8c56c' }} />
            <Icon name="arrow-right" size={14} color="var(--ink-faint)" />
            <span className="how-cell" style={{ background: '#c3d778' }} />
            <Icon name="arrow-right" size={14} color="var(--ink-faint)" />
            <span className="how-cell" style={{ background: '#d3fa70' }} />
          </div>
          <div className="how-card-title">Your mastery map redraws itself</div>
          <div className="how-card-body">
            Thousands of concepts, each carrying its own state - strong, shaky, fading, or never seen. As you answer, we
            differentiate your weak spots from where your understanding is solid.
          </div>
        </div>
        <div className="how-card">
          <span className="how-num">03</span>
          <div className="how-glyph" aria-hidden="true">
            <span className="how-cell" style={{ background: '#cb7365', outline: '1.5px solid var(--on-dark)', outlineOffset: 2 }} />
            <span className="how-cell" style={{ background: 'var(--dark-fill)' }} />
            <span className="how-cell" style={{ background: 'var(--dark-fill)' }} />
          </div>
          <div className="how-card-title">You get the questions you need next</div>
          <div className="how-card-body">
            No filters to configure, no decks to build. Sit down, press start, and you're working on exactly the things
            holding you back.
          </div>
        </div>
      </div>
    </section>
  );
}

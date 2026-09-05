import { useEffect, useState } from 'react';
import Button from './Button';
import HeroSession from './HeroSession';
import Icon from './Icon';
import { SIGN_UP_URL } from '../lib/links';

const STACKED = '(max-width: 859px)';

function useStacked() {
  const [stacked, setStacked] = useState(() => typeof window !== 'undefined' && window.matchMedia(STACKED).matches);
  useEffect(() => {
    const mq = window.matchMedia(STACKED);
    const onChange = () => setStacked(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return stacked;
}

export default function Hero() {
  const stacked = useStacked();
  return (
    <section className="hero">
      <div className="hero-copy">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="hero-eyebrow">For Australian medical students and clinicians</div>
          <h1 className="hero-title">
            Your Path to
            <br />
            <span className="hero-title-mark">Medical Mastery</span>
          </h1>
        </div>
        <p className="hero-lede" style={{ margin: 0 }}>
          Bloomed builds a live map of your medical knowledge that always serves your highest-yield question next.
          Designed for study in the Australian medical context.
        </p>
        <div className="hero-actions">
          <Button size="lg" href={SIGN_UP_URL}>Get started</Button>
          <span className="hero-free">
            <Icon name="bolt" size={15} />
            Free while in Early Access
          </span>
        </div>
        <div className="hero-prompt">
          <Icon name="arrow-right" size={16} color="var(--lime-deep)" />
          {stacked ? 'Answer the question below to see how it works.' : 'Answer the question on the right to see how it works.'}
        </div>
      </div>

      <HeroSession />
    </section>
  );
}

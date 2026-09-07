import Button from './Button';
import HeroSession from './HeroSession';
import HeroStill from './HeroStill';
import { SIGN_UP_URL } from '../lib/links';
import { useStillHero } from '../lib/motion';

export default function Hero() {
  const still = useStillHero();
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
          A question bank that analyses your weak spots and serves the best question for your upcoming exam.
        </p>
        <div className="hero-actions">
          <Button size="lg" href={SIGN_UP_URL}>Get started</Button>
        </div>
      </div>

      {still ? <HeroStill /> : <HeroSession />}
    </section>
  );
}

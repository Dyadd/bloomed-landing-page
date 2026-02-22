import { useEffect } from 'react';
import { gsap } from 'gsap';
import HeroBloom from './HeroBloom';

interface Props {
  onOpenForm: () => void;
}

export default function Hero({ onOpenForm }: Props) {
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-headline', { opacity: 0, y: 50, duration: 1,   ease: 'power3.out', delay: 1.15 });
      gsap.from('.hero-sub',      { opacity: 0, y: 30, duration: 0.9, ease: 'power3.out', delay: 1.35 });
      gsap.from('.hero-sub2',     { opacity: 0, y: 20, duration: 0.8, ease: 'power3.out', delay: 1.50 });
      gsap.from('.hero-cta',      { opacity: 0, y: 20, duration: 0.8, ease: 'power3.out', delay: 1.65 });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-20 px-8 lg:px-16 overflow-hidden text-center">
      {/* Subtle dot-grid background */}
      <div className="absolute inset-0 dot-grid opacity-60 pointer-events-none" />

      {/* Accent radial glow from the top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] pointer-events-none opacity-[0.07]"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, var(--color-accent), transparent 65%)' }}
      />

      {/* Bloom node animation — behind text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-full h-full opacity-50">
          <HeroBloom />
        </div>
      </div>

      <div className="relative max-w-3xl">
        {/* Headline */}
        <h1 className="hero-headline font-bold mb-6">
          <span className="text-h3 lg:text-h1 text-primary">Diagnose your weaknesses.</span>
          <br />
          <span className="font-accent italic gradient-text text-display lg:text-display-2xl">Master Medicine.</span>
        </h1>

        <p className="hero-sub text-body-lg text-muted max-w-2xl mx-auto mb-4">
          Answer questions. We spot the gaps. You get exactly what you need to fill them.
        </p>

        <div className="hero-sub2 flex justify-center mb-10">
          <span className="phase-label text-caption">
            <span className="dot" />
            Built for Australian medical students and junior doctors
          </span>
        </div>

        <div className="hero-cta flex justify-center">
          <button onClick={onOpenForm} className="btn-primary text-body px-7 py-[14px]">
            Get early access
          </button>
        </div>
      </div>
    </section>
  );
}

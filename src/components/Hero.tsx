import { useEffect } from 'react';
import { gsap } from 'gsap';

interface Props {
  onOpenForm: () => void;
}

export default function Hero({ onOpenForm }: Props) {
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-headline', { opacity: 0, y: 50, duration: 1,   ease: 'power3.out', delay: 0.15 });
      gsap.from('.hero-sub',      { opacity: 0, y: 30, duration: 0.9, ease: 'power3.out', delay: 0.35 });
      gsap.from('.hero-sub2',     { opacity: 0, y: 20, duration: 0.8, ease: 'power3.out', delay: 0.50 });
      gsap.from('.hero-cta',      { opacity: 0, y: 20, duration: 0.8, ease: 'power3.out', delay: 0.65 });
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

      <div className="relative max-w-3xl">
        {/* Headline */}
        <h1 className="hero-headline font-bold leading-[1.08] mb-6 tracking-tight">
          <span className="text-2xl lg:text-4xl text-primary">Diagnose your weaknesses.</span>
          <br />
          <span className="font-accent gradient-text text-6xl lg:text-8xl">Master Medicine.</span>
        </h1>

        {/* Sub-heading */}
        <p className="hero-sub text-lg lg:text-xl text-muted leading-relaxed max-w-2xl mx-auto mb-4">
          Answer questions. We spot the gaps. You get exactly what you need to fill them.
        </p>

        {/* Sub-heading 2 — styled as a pill tag matching the phase-label pattern */}
        <div className="hero-sub2 flex justify-center mb-10">
          <span className="phase-label text-[12px]">
            <span className="dot" />
            Built for Australian medical students and junior doctors
          </span>
        </div>

        {/* CTA */}
        <div className="hero-cta flex justify-center">
          <button onClick={onOpenForm} className="btn-primary text-base px-7 py-[14px]">
            Get early access
          </button>
        </div>
      </div>
    </section>
  );
}

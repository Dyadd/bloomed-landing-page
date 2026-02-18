import { useEffect } from 'react';
import { gsap } from 'gsap';

interface Props {
  onOpenForm: () => void;
}

export default function Hero({ onOpenForm }: Props) {
  // Entrance animations on mount
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-eyebrow', { opacity: 0, y: 20, duration: 0.8, ease: 'power3.out', delay: 0.1 });
      gsap.from('.hero-headline', { opacity: 0, y: 50, duration: 1,   ease: 'power3.out', delay: 0.25 });
      gsap.from('.hero-sub',      { opacity: 0, y: 30, duration: 0.9, ease: 'power3.out', delay: 0.45 });
      gsap.from('.hero-cta',      { opacity: 0, y: 20, duration: 0.8, ease: 'power3.out', delay: 0.65 });
      gsap.from('.hero-tags',     { opacity: 0,        duration: 0.8,                     delay: 0.85 });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-24 pb-20 px-8 lg:px-16 overflow-hidden">
      {/* Subtle dot-grid background */}
      <div className="absolute inset-0 dot-grid opacity-60 pointer-events-none" />

      {/* Blue radial glow from the top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, #3b82f6, transparent 65%)' }}
      />

      <div className="relative max-w-5xl">
        {/* Eyebrow chip */}
        <div className="hero-eyebrow mb-7">
          <span className="phase-label">
            <span className="dot" />
            For Australian Medical Students
          </span>
        </div>

        {/* Headline */}
        <h1 className="hero-headline text-5xl lg:text-7xl font-bold leading-[1.08] mb-6 tracking-tight">
          <span className="gradient-text">Bridge the gap</span>
          <br />
          <span className="text-[#f0f4ff]">between your textbooks</span>
          <br />
          <span className="text-[#f0f4ff]">and your patients.</span>
        </h1>

        {/* Sub-heading */}
        <p className="hero-sub text-lg lg:text-xl text-muted leading-relaxed max-w-2xl mb-10">
          Bloomed maps your medical knowledge, identifies exactly where your understanding breaks
          down, and rebuilds it — targeted, fast, and permanent. Ready for the wards, the AMC, and beyond.
        </p>

        {/* CTA */}
        <div className="hero-cta flex items-center gap-5 flex-wrap">
          <button onClick={onOpenForm} className="btn-primary text-base px-7 py-[14px]">
            Join the waitlist — free early access
          </button>
          <span className="text-sm text-muted">Takes 2 minutes. No spam.</span>
        </div>

        {/* Social-proof tags */}
        <div className="hero-tags mt-14 flex items-center gap-7 flex-wrap">
          {['AMC-aligned', 'Spaced repetition', 'AI knowledge graph', 'Built in Australia'].map(tag => (
            <div key={tag} className="flex items-center gap-2 text-xs text-muted/60">
              <span className="w-1 h-1 rounded-full bg-accent/50 inline-block" />
              {tag}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { useEffect, useCallback, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HeroBloom from './HeroBloom';

gsap.registerPlugin(ScrollTrigger);

interface Props {
  onOpenForm: () => void;
}

export default function Hero({ onOpenForm }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const bloomRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-headline', { opacity: 0, y: 50, duration: 1,   ease: 'power3.out', delay: 1.15 });
      gsap.from('.hero-sub2',     { opacity: 0, y: 20, duration: 0.8, ease: 'power3.out', delay: 1.35 });
      gsap.from('.hero-sub',      { opacity: 0, y: 30, duration: 0.9, ease: 'power3.out', delay: 1.55 });
      gsap.from('.hero-cta',      { opacity: 0, y: 20, duration: 0.8, ease: 'power3.out', delay: 1.70 });

      if (bloomRef.current) {
        gsap.to(bloomRef.current, {
          y: -500,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }

      if (textRef.current) {
        gsap.to(textRef.current, {
          y: -60,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }
    });
    return () => ctx.revert();
  }, []);

  const handleBtnMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const r = btn.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    btn.style.setProperty('--rx', `${(y - 0.5) * -7}deg`);
    btn.style.setProperty('--ry', `${(x - 0.5) * 7}deg`);
    btn.style.setProperty('--mx', `${x * 100}%`);
    btn.style.setProperty('--my', `${y * 100}%`);
  }, []);

  const handleBtnLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    btn.style.setProperty('--rx', '0deg');
    btn.style.setProperty('--ry', '0deg');
    btn.style.setProperty('--mx', '50%');
    btn.style.setProperty('--my', '50%');
  }, []);

  return (
    <section ref={sectionRef} className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-24 px-8 lg:px-16 text-center">
      {/* Accent radial glow from the top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] pointer-events-none opacity-[0.07]"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, var(--color-accent), transparent 65%)' }}
      />

      {/* Bloom node animation — behind text */}
      <div ref={bloomRef} className="absolute inset-x-0 top-0 bottom-[20%] flex items-center justify-center pointer-events-none">
        <div className="w-full h-full opacity-50">
          <HeroBloom />
        </div>
      </div>

      <div ref={textRef} className="relative max-w-4xl">
        <div className="hero-sub2 flex justify-center mb-6">
          <span className="phase-label text-caption" style={{ color: '#000000' }}>
            <span className="dot" />
            Built for Australian Medical Students & Doctors
          </span>
        </div>

        <h1 className="hero-headline text-h1 lg:text-display font-semibold mb-6" style={{ color: '#000000' }}>
          <span className="font-accent italic">Diagnose</span> Your Weaknesses.
          <br />
          <span className="font-accent italic">Master</span> Medicine.
        </h1>

        <p className="hero-sub text-body-lg max-w-2xl mx-auto mb-10" style={{ color: '#000000' }}>
          Answer questions. We spot the gaps.
          <br />
          You get exactly what you need to fill them.
        </p>

        <div className="hero-cta flex justify-center">
          <button
            onClick={onOpenForm}
            onMouseMove={handleBtnMove}
            onMouseLeave={handleBtnLeave}
            className="btn-primary text-body px-7 py-[14px]"
            style={{ backgroundColor: '#1a32e0' }}
          >
            Get early access
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * DemoKiosk.tsx
 *
 * Full-screen, auto-looping kiosk demo for in-person presentations.
 *
 * Layout:
 *   LEFT  — 6 slides of text that fade in/out sequentially
 *   RIGHT — the KnowledgeGraph, large, with phase-coloured ambient glow
 *
 * A master GSAP timeline orchestrates all text animations and graph phase
 * changes in a seamless ~40-second loop.
 */

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import KnowledgeGraph from './KnowledgeGraph';
import type { GraphPhase } from '../data/graphTypes';

export default function DemoKiosk() {
  const [phase, setPhase] = useState<GraphPhase>('ambient');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // ── One-time entrance animations ──────────────────────────────────────
      gsap.from('.demo-logo', {
        opacity: 0,
        y: -15,
        duration: 0.8,
        ease: 'power2.out',
        delay: 0.3,
      });

      // Subtle floating motion on the graph container
      gsap.to('.demo-graph-float', {
        y: 12,
        x: 8,
        duration: 7,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Slow glow rotation (elliptical shape makes rotation visible)
      gsap.to('.demo-glow', {
        rotation: 360,
        duration: 40,
        repeat: -1,
        ease: 'none',
        transformOrigin: 'center center',
      });

      // ── Master timeline ───────────────────────────────────────────────────
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.8 });

      // ── SLIDE 1: INTRO ─────────────────────────────────────────────────
      tl.call(() => setPhase('ambient'));
      tl.fromTo(
        '.slide-intro .demo-anim',
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.15 },
      );
      tl.to({}, { duration: 4 });
      tl.to('.slide-intro .demo-anim', {
        opacity: 0, y: -25, duration: 0.5, ease: 'power2.in', stagger: 0.06,
      });

      // ── SLIDE 2: PROBLEM ───────────────────────────────────────────────
      tl.fromTo(
        '.slide-problem .demo-title',
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
      );
      tl.fromTo(
        '.slide-problem .demo-item',
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out', stagger: 0.45 },
        '-=0.2',
      );
      tl.to({}, { duration: 2 });
      tl.to('.slide-problem .demo-title, .slide-problem .demo-item', {
        opacity: 0, duration: 0.5, ease: 'power2.in',
      });

      // ── SLIDE 3: DIAGNOSTIC ────────────────────────────────────────────
      tl.call(() => setPhase('diagnostic'));
      tl.fromTo(
        '.slide-diagnostic .demo-anim',
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12 },
      );
      tl.to({}, { duration: 5.5 });
      tl.to('.slide-diagnostic .demo-anim', {
        opacity: 0, y: -25, duration: 0.5, ease: 'power2.in', stagger: 0.06,
      });

      // ── SLIDE 4: LEARNING ──────────────────────────────────────────────
      tl.call(() => setPhase('learning'));
      tl.fromTo(
        '.slide-learning .demo-anim',
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12 },
      );
      tl.to({}, { duration: 5.5 });
      tl.to('.slide-learning .demo-anim', {
        opacity: 0, y: -25, duration: 0.5, ease: 'power2.in', stagger: 0.06,
      });

      // ── SLIDE 5: SOLIDIFY ──────────────────────────────────────────────
      tl.call(() => setPhase('solidify'));
      tl.fromTo(
        '.slide-solidify .demo-anim',
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12 },
      );
      tl.to({}, { duration: 5.5 });
      tl.to('.slide-solidify .demo-anim', {
        opacity: 0, y: -25, duration: 0.5, ease: 'power2.in', stagger: 0.06,
      });

      // ── SLIDE 6: CTA ──────────────────────────────────────────────────
      tl.call(() => setPhase('ambient'));
      tl.fromTo(
        '.slide-cta .demo-anim',
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.15 },
      );
      tl.to({}, { duration: 4 });
      tl.to('.slide-cta .demo-anim', {
        opacity: 0, y: -25, duration: 0.5, ease: 'power2.in', stagger: 0.06,
      });

      // ── Progress bar: spans the full timeline ─────────────────────────
      const totalDur = tl.duration();
      tl.fromTo(
        '.demo-progress-fill',
        { scaleX: 0 },
        { scaleX: 1, duration: totalDur, ease: 'none' },
        0,
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 bg-bg overflow-hidden">
      {/* Dot grid background */}
      <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />

      {/* Floating particles */}
      <Particles />

      {/* Main content */}
      <div className="relative z-10 h-full flex">

        {/* ── LEFT PANEL — text slides ────────────────────────────────── */}
        <div className="w-[42%] h-full flex flex-col justify-between py-8 pl-14 pr-8">
          {/* Persistent URL — always visible, the key takeaway */}
          <div className="demo-logo flex items-center gap-4">
            <img src="/logo.png" alt="Bloomed" className="h-12 w-auto" />
            <span className="text-3xl xl:text-4xl font-bold tracking-tight text-accent">
              bloomed<span className="text-primary/30">.</span>study
            </span>
          </div>

          {/* Slide container */}
          <div className="flex-1 flex items-center">
            <div className="relative w-full min-h-[380px]">

              {/* ── SLIDE: INTRO ──────────────────────────────────── */}
              <div className="slide-intro absolute inset-0 flex flex-col justify-center">
                <div className="demo-anim mb-5" style={{ opacity: 0 }}>
                  <span className="phase-label">
                    <span className="dot" />
                    Early Access
                  </span>
                </div>
                <h1
                  className="demo-anim text-5xl xl:text-6xl font-bold leading-[1.1] mb-5 text-primary tracking-tight"
                  style={{ opacity: 0 }}
                >
                  Diagnose your weaknesses.
                  <br />
                  <span className="font-accent gradient-text text-6xl xl:text-7xl">
                    Master Medicine.
                  </span>
                </h1>
                <p
                  className="demo-anim text-xl xl:text-2xl text-muted leading-relaxed max-w-lg"
                  style={{ opacity: 0 }}
                >
                  The AI-powered learning engine built for Australian medical students.
                </p>
              </div>

              {/* ── SLIDE: PROBLEM ────────────────────────────────── */}
              <div className="slide-problem absolute inset-0 flex flex-col justify-center">
                <h2
                  className="demo-title text-4xl xl:text-5xl font-bold text-primary tracking-tight mb-8"
                  style={{ opacity: 0 }}
                >
                  Most Students Study{' '}
                  <span className="font-accent italic gradient-text">Blind</span>
                </h2>
                <div className="space-y-4">
                  {[
                    "You're drowning in flashcards, not learning from them.",
                    "You study for hours but nothing sticks.",
                    "You don't know what you don't know.",
                    "Your study plan is just guesswork.",
                  ].map((point, i) => (
                    <div
                      key={i}
                      className="demo-item flex items-center gap-4 p-5 rounded-xl border border-primary/[0.06] bg-surface/50"
                      style={{ opacity: 0 }}
                    >
                      <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-danger" />
                      <p className="text-xl font-medium text-primary leading-snug">
                        {point}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── SLIDE: DIAGNOSTIC ─────────────────────────────── */}
              <div className="slide-diagnostic absolute inset-0 flex flex-col justify-center">
                <span
                  className="demo-anim absolute -top-16 left-0 text-[7rem] xl:text-[8rem] font-bold leading-none text-primary/[0.04] select-none pointer-events-none"
                  style={{ opacity: 0 }}
                >
                  01
                </span>
                <p
                  className="demo-anim text-base font-semibold text-accent tracking-wide uppercase mb-3"
                  style={{ opacity: 0 }}
                >
                  Step 01 — The Diagnostic
                </p>
                <h2
                  className="demo-anim text-4xl xl:text-5xl font-bold text-primary tracking-tight mb-5"
                  style={{ opacity: 0 }}
                >
                  We map your knowledge.
                </h2>
                <p
                  className="demo-anim text-xl text-muted leading-relaxed mb-6 max-w-lg"
                  style={{ opacity: 0 }}
                >
                  Practice questions and your course materials build a complete
                  picture. Bloomed finds exactly where to focus.
                </p>
                <div
                  className="demo-anim border-l-2 border-accent/30 pl-5"
                  style={{ opacity: 0 }}
                >
                  <p className="text-base text-accent/70 italic">
                    Most students spend hours studying the wrong things.
                  </p>
                </div>
              </div>

              {/* ── SLIDE: LEARNING ───────────────────────────────── */}
              <div className="slide-learning absolute inset-0 flex flex-col justify-center">
                <span
                  className="demo-anim absolute -top-16 left-0 text-[7rem] xl:text-[8rem] font-bold leading-none text-primary/[0.04] select-none pointer-events-none"
                  style={{ opacity: 0 }}
                >
                  02
                </span>
                <p
                  className="demo-anim text-base font-semibold text-[#f97316] tracking-wide uppercase mb-3"
                  style={{ opacity: 0 }}
                >
                  Step 02 — Targeted Learning
                </p>
                <h2
                  className="demo-anim text-4xl xl:text-5xl font-bold text-primary tracking-tight mb-5"
                  style={{ opacity: 0 }}
                >
                  We fill the gaps.
                </h2>
                <p
                  className="demo-anim text-xl text-muted leading-relaxed mb-6 max-w-lg"
                  style={{ opacity: 0 }}
                >
                  Curated notes, purpose-built flashcards, and mock questions
                  — delivered in the right order, at the right time.
                </p>
                <div
                  className="demo-anim border-l-2 border-[#f97316]/30 pl-5"
                  style={{ opacity: 0 }}
                >
                  <p className="text-base text-[#f97316]/70 italic">
                    Smarter study, not more study.
                  </p>
                </div>
              </div>

              {/* ── SLIDE: SOLIDIFY ───────────────────────────────── */}
              <div className="slide-solidify absolute inset-0 flex flex-col justify-center">
                <span
                  className="demo-anim absolute -top-16 left-0 text-[7rem] xl:text-[8rem] font-bold leading-none text-primary/[0.04] select-none pointer-events-none"
                  style={{ opacity: 0 }}
                >
                  03
                </span>
                <p
                  className="demo-anim text-base font-semibold text-success tracking-wide uppercase mb-3"
                  style={{ opacity: 0 }}
                >
                  Step 03 — Solidification
                </p>
                <h2
                  className="demo-anim text-4xl xl:text-5xl font-bold text-primary tracking-tight mb-5"
                  style={{ opacity: 0 }}
                >
                  Knowledge that sticks.
                </h2>
                <p
                  className="demo-anim text-xl text-muted leading-relaxed mb-6 max-w-lg"
                  style={{ opacity: 0 }}
                >
                  Spaced repetition ensures your knowledge compounds — not just
                  memorised, actually understood. Ready for wards and exams.
                </p>
                <div
                  className="demo-anim border-l-2 border-success/30 pl-5"
                  style={{ opacity: 0 }}
                >
                  <p className="text-base text-success/70 italic">
                    Knowledge that holds under pressure.
                  </p>
                </div>
              </div>

              {/* ── SLIDE: CTA ────────────────────────────────────── */}
              <div className="slide-cta absolute inset-0 flex flex-col justify-center">
                <h2
                  className="demo-anim text-5xl xl:text-6xl font-bold text-primary tracking-tight mb-5 leading-tight"
                  style={{ opacity: 0 }}
                >
                  Study smarter
                  <br />
                  <span className="font-accent gradient-text">from day one.</span>
                </h2>
                <p
                  className="demo-anim text-xl text-muted leading-relaxed mb-8 max-w-lg"
                  style={{ opacity: 0 }}
                >
                  Join early access and get personalised study from your first
                  semester.
                </p>
                <div className="demo-anim" style={{ opacity: 0 }}>
                  <span className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white font-semibold text-xl rounded-[12px]">
                    bloomed.study
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="h-[2px] bg-primary/10 rounded-full overflow-hidden mb-3">
              <div
                className="demo-progress-fill h-full bg-accent/40 rounded-full origin-left"
                style={{ transform: 'scaleX(0)' }}
              />
            </div>
            <p className="text-[11px] text-muted/50 tracking-wider uppercase font-medium">
              bloomed.study
            </p>
          </div>
        </div>

        {/* ── RIGHT PANEL — Knowledge Graph ───────────────────────── */}
        <div className="w-[58%] h-full relative flex items-center justify-center">
          {/* Phase-coloured ambient glow (slightly elliptical so rotation is visible) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="demo-glow w-[650px] h-[520px] rounded-full transition-all duration-[1200ms]"
              style={{
                opacity: 0.12,
                background:
                  phase === 'diagnostic'
                    ? 'radial-gradient(ellipse, var(--color-accent), transparent 70%)'
                    : phase === 'learning'
                    ? 'radial-gradient(ellipse, #f97316, transparent 70%)'
                    : phase === 'solidify'
                    ? 'radial-gradient(ellipse, #30a46c, transparent 70%)'
                    : 'radial-gradient(ellipse, var(--color-accent), transparent 70%)',
              }}
            />
          </div>

          {/* Graph with subtle float */}
          <div className="demo-graph-float relative w-full max-w-[950px] px-2">
            <KnowledgeGraph phase={phase} />
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Floating particles ──────────────────────────────────────────────────────

function Particles() {
  const particles = useRef(
    Array.from({ length: 14 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 12,
      duration: 10 + Math.random() * 8,
      size: 2 + Math.random() * 2,
    })),
  ).current;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full bg-accent"
          style={{
            left: `${p.left}%`,
            bottom: '-10px',
            width: p.size,
            height: p.size,
            opacity: 0,
            animation: `demo-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

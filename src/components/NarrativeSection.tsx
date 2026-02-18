/**
 * NarrativeSection.tsx
 *
 * The main scroll-driven section of the page.
 *
 * Layout:
 *   LEFT  — three scrollable text steps (Diagnostic, Repair, Solidify)
 *   RIGHT — the KnowledgeGraph SVG, sticky (stays in view as text scrolls)
 *
 * How it works:
 *   1. Each text step has a ref.
 *   2. useEffect creates a GSAP ScrollTrigger for each step.
 *   3. When a step enters the viewport centre, setPhase() is called.
 *   4. `phase` is passed as a prop to KnowledgeGraph.
 *   5. KnowledgeGraph runs the appropriate animation when phase changes.
 */

import { useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import KnowledgeGraph from './KnowledgeGraph';
import type { GraphPhase } from '../data/graphTypes';

gsap.registerPlugin(ScrollTrigger);

const PHASES: {
  phase: GraphPhase;
  number: string;
  label: string;
  headline: string;
  body: string;
  callout: string;
}[] = [
  {
    phase: 'diagnostic',
    number: '01',
    label: 'Diagnostic',
    headline: 'Not all gaps are obvious.',
    body: "You know anatomy. You know pathology. But somewhere between basic sciences and clinical reasoning, connections break down. Bloomed maps your entire medical knowledge network and surfaces the exact link that's missing.",
    callout: "The gap between Pathology and Clinical Reasoning affects the majority of medical students — and most never know it's there.",
  },
  {
    phase: 'repair',
    number: '02',
    label: 'Targeted Repair',
    headline: 'Study less. Learn exactly what matters.',
    body: "Instead of reviewing everything, Bloomed rebuilds the specific pathway that's broken. Case-based scenarios, spaced repetition, and targeted exercises that restore the missing connection — fast.",
    callout: 'Focused repair sessions, not passive review.',
  },
  {
    phase: 'solidify',
    number: '03',
    label: 'Solidification',
    headline: 'Retained. Applied. Unshakeable.',
    body: "Once a gap is repaired, Bloomed ensures it stays that way. Longitudinal reinforcement, clinical case patterns, and real-world application cement your understanding — permanently.",
    callout: 'Knowledge that holds under pressure — on the wards, in OSCEs, and in the AMC.',
  },
];

export default function NarrativeSection() {
  const [phase, setPhase] = useState<GraphPhase>('ambient');
  // One ref per step div
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const triggers: ScrollTrigger[] = [];

    stepRefs.current.forEach((step, i) => {
      if (!step) return;

      // Phase-switching trigger: fires when step enters / leaves the centre
      const trigger = ScrollTrigger.create({
        trigger: step,
        start: 'top 58%',
        end: 'bottom 42%',
        onEnter:     () => setPhase(PHASES[i].phase),
        onEnterBack: () => setPhase(PHASES[i].phase),
        onLeaveBack: () => { if (i === 0) setPhase('ambient'); },
      });
      triggers.push(trigger);

      // Content fade-in when the step scrolls into view
      const content = step.querySelector('.step-content');
      if (content) {
        gsap.fromTo(
          content,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: step,
              start: 'top 72%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    });

    return () => {
      triggers.forEach(t => t.kill());
    };
  }, []);

  return (
    <section className="relative">
      <div className="narrative-container max-w-[1400px] mx-auto">

        {/* LEFT — scrollable text steps */}
        <div>
          {PHASES.map((p, i) => (
            <div
              key={p.phase}
              ref={el => { stepRefs.current[i] = el; }}
              className="min-h-screen flex items-center px-8 lg:px-16 py-24"
            >
              <div className="step-content max-w-lg">
                {/* Step label */}
                <div className="flex items-center gap-3 mb-8">
                  <span className="text-xs font-semibold tracking-widest text-muted/60 uppercase">
                    {p.number}
                  </span>
                  <span className="text-muted/40 text-xs">/</span>
                  <span className="phase-label">
                    <span className="dot" />
                    {p.label}
                  </span>
                </div>

                {/* Headline */}
                <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight text-[#f0f4ff]">
                  {p.headline}
                </h2>

                {/* Body */}
                <p className="text-lg text-muted leading-relaxed mb-8">
                  {p.body}
                </p>

                {/* Callout */}
                <div className="border-l-2 border-accent/30 pl-5 py-1">
                  <p className="text-sm text-accent/70 italic leading-relaxed">
                    {p.callout}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT — sticky graph panel (desktop only) */}
        <div className="hidden lg:flex sticky top-0 h-screen items-center justify-center p-10">
          {/* Colour-shifting ambient glow behind the graph */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="w-[420px] h-[420px] rounded-full transition-all duration-[1200ms] opacity-15"
              style={{
                background:
                  phase === 'diagnostic'
                    ? 'radial-gradient(circle, #f43f5e, transparent 70%)'
                    : phase === 'repair'
                    ? 'radial-gradient(circle, #06b6d4, transparent 70%)'
                    : phase === 'solidify'
                    ? 'radial-gradient(circle, #10b981, transparent 70%)'
                    : 'radial-gradient(circle, #3b82f6, transparent 70%)',
              }}
            />
          </div>

          {/* Graph */}
          <div className="relative w-full max-w-[640px]">
            <KnowledgeGraph phase={phase} />
          </div>
        </div>

      </div>
    </section>
  );
}

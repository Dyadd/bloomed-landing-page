/**
 * NarrativeSection.tsx
 *
 * The main scroll-driven section of the page.
 *
 * Layout:
 *   LEFT  — three scrollable text steps (Diagnostic, Learning, Solidify)
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
    headline: 'Before you study, Bloomed gets to know you.',
    body: "Our practice questions and your course materials - lecture slides, readings, unit guides - are processed to build a complete picture of your knowledge across every subject, mapping exactly where to focus next.",
    callout: 'Most students spend hours studying the wrong things. Bloomed makes sure you never do.',
  },
  {
    phase: 'learning',
    number: '02',
    label: 'Targeted Learning Plan',
    headline: 'Study smarter, not harder.',
    body: "Instead of working through a textbook and hoping it's relevant, Bloomed structures your study around what you actually need - mock questions, curated notes, and purpose-built flashcards delivered in the right order, at the right time.",
    callout: 'Smarter study, not more study.',
  },
  {
    phase: 'solidify',
    number: '03',
    label: 'Solidification',
    headline: 'Knowledge that compounds over time.',
    body: "As you learn, Bloomed keeps reinforcing it. Intelligently scheduled questions and spaced repetition flashcards ensure your knowledge compounds over time - not just memorised. Actually understood. Ready for the wards and exams.",
    callout: 'Knowledge that holds under pressure - on the wards, in OSCEs, and in your exams.',
  },
];

export default function NarrativeSection() {
  const [phase, setPhase] = useState<GraphPhase>('ambient');
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const triggers: ScrollTrigger[] = [];

    stepRefs.current.forEach((step, i) => {
      if (!step) return;

      const trigger = ScrollTrigger.create({
        trigger: step,
        start: 'top 58%',
        end: 'bottom 42%',
        onEnter:     () => setPhase(PHASES[i].phase),
        onEnterBack: () => setPhase(PHASES[i].phase),
        onLeaveBack: () => { if (i === 0) setPhase('ambient'); },
      });
      triggers.push(trigger);

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
      {/* Section header — centered, large, with accent serif on brand name */}
      <div className="max-w-[1400px] mx-auto px-8 lg:px-16 pt-20 pb-4 text-center">
        <h2 className="text-h1 lg:text-h1-xl font-bold text-primary mb-5">
          How <span className="font-accent italic gradient-text">Bloomed</span> Works.
        </h2>
        <p className="text-body-lg text-muted max-w-xl mx-auto">
          Uni teaching is one-size-fits-all. Bloomed builds a personalised learning engine around you - mapping what you know, structuring what you need to learn, and making sure it sticks.
        </p>
      </div>

      <div className="narrative-container max-w-[1400px] mx-auto">

        {/* LEFT — scrollable text steps */}
        <div>
          {PHASES.map((p, i) => (
            <div
              key={p.phase}
              ref={el => { stepRefs.current[i] = el; }}
              className="relative min-h-screen flex items-center px-8 lg:px-16 py-24"
            >
              <div className="step-content relative max-w-lg">
                {/* Large faded background number */}
                <span className="absolute -top-32 lg:-top-[9.5rem] left-0 text-[8rem] lg:text-[10rem] font-bold leading-none text-primary/[0.04] select-none pointer-events-none">
                  {p.number}
                </span>
                {/* Headline */}
                <h3 className="text-h2 lg:text-h1 font-bold mb-5 text-primary">
                  The {p.label}
                </h3>

                {/* Body */}
                <p className="text-body-lg text-muted mb-6">
                  {p.body}
                </p>

                {/* Callout */}
                <div className="border-l-2 border-accent/30 pl-5 py-1">
                  <p className="text-body-sm text-accent/70 italic">
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
              className="w-[420px] h-[420px] rounded-full transition-all duration-[1200ms] opacity-10"
              style={{
                background:
                  phase === 'diagnostic'
                    ? 'radial-gradient(circle, var(--color-accent), transparent 70%)'
                    : phase === 'learning'
                    ? 'radial-gradient(circle, #f97316, transparent 70%)'
                    : phase === 'solidify'
                    ? 'radial-gradient(circle, #30a46c, transparent 70%)'
                    : 'radial-gradient(circle, var(--color-accent), transparent 70%)',
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

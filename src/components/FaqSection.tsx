import { useState } from 'react';

const FAQS = [
  {
    q: 'What is Bloomed?',
    a: "Bloomed is a comprehensive learning platform for Australian medical students and junior doctors. You work through diagnostic questions and can upload your course materials - lecture slides, readings, unit guides - so Bloomed understands exactly what you need to know. From there, it maps your knowledge across every subject and delivers what you're missing: curated notes, purpose-built flashcards, and targeted case-based sessions. No more studying blind.",
  },
  {
    q: 'How is Bloomed different from Anki or question banks?',
    a: "Bloomed combines the best of everything: an Anki-style spaced repetition scheduler, a targeted textbook that surfaces the right content per knowledge gap, and a diagnostic process that actually takes your course context into account - your slides, your readings, your curriculum. Rather than grinding through a question bank and hoping it covers what your exam needs, Bloomed builds a study plan around you specifically.",
  },
  {
    q: 'Who is Bloomed built for?',
    a: 'Australian medical students (both pre-clinical and clinical years) and junior doctors. Bloomed covers all content needed for Australian medical school - all organ systems and clinical medicine, grounded in the foundational sciences: anatomy, physiology, biochemistry, pathology, pharmacology, microbiology, and immunology.',
  },
  {
    q: 'When is Bloomed launching?',
    a: 'Currently in early access - sign up to be notified and help shape the product before public launch.',
  },
  {
    q: 'Is it free?',
    a: "Pricing hasn't been announced yet - early access sign-ups might get free access 😉.",
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section id="faq" className="relative py-24 px-8 lg:px-16">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-12 text-center tracking-tight">
          Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="border border-primary/[0.08] rounded-xl overflow-hidden transition-colors duration-200"
                style={{ background: isOpen ? 'rgba(43, 95, 196, 0.03)' : 'transparent' }}
              >
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer"
                >
                  <span className="text-[15px] font-semibold text-primary leading-snug">
                    {faq.q}
                  </span>
                  <span
                    className="shrink-0 w-5 h-5 flex items-center justify-center text-muted transition-transform duration-200"
                    style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <line x1="7" y1="1" x2="7" y2="13" />
                      <line x1="1" y1="7" x2="13" y2="7" />
                    </svg>
                  </span>
                </button>

                <div
                  className="grid transition-all duration-200 ease-in-out"
                  style={{
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-[15px] text-muted leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

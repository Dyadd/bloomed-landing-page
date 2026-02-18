/**
 * LeadForm.tsx
 *
 * Multi-step modal form for early-access sign-ups.
 *
 * Step 1 — Year of medicine
 * Step 2 — Biggest challenge
 * Step 3 — Study style
 * Step 4 — Email capture + submit
 *
 * On submit: POSTs to VITE_FORM_ENDPOINT (your Supabase Edge Function).
 * Falls back to localStorage if the network call fails.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface FormData {
  year: string;
  challenge: string;
  studyStyle: string;
  email: string;
}

const STEPS = [
  {
    field: 'year' as const,
    question: 'What year of medicine are you in?',
    options: [
      { value: 'year1-2',   label: 'Year 1–2',        desc: 'Preclinical' },
      { value: 'year3-4',   label: 'Year 3–4',        desc: 'Clinical rotations' },
      { value: 'year5-6',   label: 'Year 5–6',        desc: 'Final years' },
      { value: 'graduate',  label: 'Graduate entry',  desc: 'AMC / post-grad pathway' },
    ],
  },
  {
    field: 'challenge' as const,
    question: "What's your biggest challenge right now?",
    options: [
      { value: 'basic-to-clinical',  label: 'Applying basic sciences',   desc: 'Connecting theory to clinical practice' },
      { value: 'pharm-pathways',     label: 'Pharmacology & pathways',   desc: 'Too much to memorise' },
      { value: 'clinical-reasoning', label: 'Clinical reasoning',         desc: 'Working through cases and differentials' },
      { value: 'exam-prep',          label: 'Exam preparation',           desc: 'AMC, OSCEs, or university finals' },
    ],
  },
  {
    field: 'studyStyle' as const,
    question: 'How do you currently study?',
    options: [
      { value: 'anki',      label: 'Anki flashcards',     desc: 'Spaced repetition decks' },
      { value: 'qbanks',    label: 'Question banks',       desc: 'AMC Qbank, Pastest, etc.' },
      { value: 'textbooks', label: 'Textbooks & notes',    desc: 'Lecture slides and written notes' },
      { value: 'mixed',     label: 'A mix of methods',     desc: 'I use whatever works' },
    ],
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function LeadForm({ isOpen, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>();

  const watched = watch();
  const isQuizStep = step < STEPS.length;
  const currentStep = STEPS[step];

  function selectOption(field: keyof FormData, value: string) {
    setValue(field, value);
  }

  function handleNext() {
    if (step < STEPS.length) setStep(s => s + 1);
  }

  function handleBack() {
    if (step > 0) setStep(s => s - 1);
  }

  async function onSubmit(data: FormData) {
    // Reject honeypot (hidden field bots fill)
    if ((data as unknown as Record<string, string>)['_trap']) return;

    setIsSubmitting(true);
    setSubmitError(false);

    try {
      const endpoint = import.meta.env.VITE_FORM_ENDPOINT;
      if (endpoint) {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data.email,
            answers: {
              year: data.year,
              challenge: data.challenge,
              studyStyle: data.studyStyle,
            },
            meta: {
              referrer: document.referrer || null,
              timestamp: new Date().toISOString(),
            },
          }),
        });
      }
      setSubmitted(true);
    } catch {
      // Store locally so data isn't lost — user will see success anyway
      localStorage.setItem(
        'bloomed_pending_submission',
        JSON.stringify({ email: data.email, answers: { year: data.year, challenge: data.challenge, studyStyle: data.studyStyle } })
      );
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    if (isSubmitting) return;
    onClose();
    // Reset form state after the close animation
    setTimeout(() => {
      setStep(0);
      setSubmitted(false);
      setSubmitError(false);
    }, 350);
  }

  if (!isOpen) return null;

  const totalSteps = STEPS.length + 1; // quiz steps + email step
  const progress = ((step + (submitted ? 1 : 0)) / totalSteps) * 100;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />

      {/* Modal panel */}
      <div className="relative w-full max-w-[480px] bg-[#0c1120] border border-blue-500/20 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-5 border-b border-white/5">
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-muted uppercase mb-1">
              Early access
            </p>
            <h3 className="text-lg font-bold text-white">Join the Bloomed waitlist</h3>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-white hover:bg-white/8 transition-colors mt-0.5"
          >
            ✕
          </button>
        </div>

        {/* Progress bar */}
        {!submitted && (
          <div className="h-[2px] bg-white/5">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-6">
          {submitted ? (
            /* ─── Success ─── */
            <div className="py-8 text-center">
              <div className="w-14 h-14 rounded-full bg-success/10 border border-success/25 flex items-center justify-center mx-auto mb-5">
                <span className="text-success text-xl">✓</span>
              </div>
              <h4 className="text-xl font-bold text-white mb-2">You're on the list.</h4>
              <p className="text-sm text-muted leading-relaxed">
                We'll reach out when Bloomed launches for Australian medical students. Keep studying — we're building something that'll make it a lot easier.
              </p>
              <button onClick={handleClose} className="btn-primary mt-7 mx-auto">
                Close
              </button>
            </div>

          ) : isQuizStep ? (
            /* ─── Quiz step ─── */
            <div>
              <p className="text-[11px] text-muted font-medium mb-4">
                Question {step + 1} of {totalSteps}
              </p>
              <h4 className="text-[15px] font-semibold text-white mb-4">
                {currentStep.question}
              </h4>

              <div className="space-y-2">
                {currentStep.options.map(opt => {
                  const isSelected = watched[currentStep.field] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => selectOption(currentStep.field, opt.value)}
                      className={`option-card ${isSelected ? 'selected' : ''}`}
                    >
                      {/* Radio indicator */}
                      <span
                        className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
                          isSelected ? 'border-primary bg-primary' : 'border-white/20'
                        }`}
                      />
                      <span>
                        <span className="block text-sm font-medium text-white">{opt.label}</span>
                        <span className="block text-xs text-muted mt-0.5">{opt.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-6">
                {step > 0 ? (
                  <button onClick={handleBack} className="btn-ghost text-sm">← Back</button>
                ) : <div />}
                <button
                  onClick={handleNext}
                  disabled={!watched[currentStep.field]}
                  className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue →
                </button>
              </div>
            </div>

          ) : (
            /* ─── Email step ─── */
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Honeypot — hidden from humans, filled by bots */}
              <input
                type="text"
                {...register('_trap' as keyof FormData)}
                style={{ position: 'absolute', opacity: 0, height: 0, pointerEvents: 'none' }}
                tabIndex={-1}
                autoComplete="off"
              />

              <p className="text-[11px] text-muted font-medium mb-4">
                Question {totalSteps} of {totalSteps}
              </p>
              <h4 className="text-[15px] font-semibold text-white mb-1">
                Last one — where should we reach you?
              </h4>
              <p className="text-sm text-muted mb-5">
                We'll notify you when Bloomed launches. No spam, ever.
              </p>

              <input
                type="email"
                placeholder="your@email.com"
                autoFocus
                className="form-input"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Enter a valid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="text-xs text-danger mt-2">{errors.email.message}</p>
              )}
              {submitError && (
                <p className="text-xs text-danger mt-2">Something went wrong — please try again.</p>
              )}

              <p className="text-[11px] text-muted/55 mt-3 mb-6">
                By submitting you agree to receive Bloomed product updates. Unsubscribe anytime.
              </p>

              <div className="flex items-center justify-between">
                <button type="button" onClick={handleBack} className="btn-ghost text-sm">
                  ← Back
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? 'Joining...' : 'Join the waitlist →'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

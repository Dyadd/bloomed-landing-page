/**
 * LeadForm.tsx — 4-step waitlist modal
 *
 * Step 1 — Name
 * Step 2 — University + Level (Pre-clinical / Clinical / etc.)
 * Step 3 — Why joining + beta interest
 * Step 4 — Email + submit
 *
 * Submits to Supabase Edge Function 'add-waitlist' with the fields:
 *   lister_name, lister_email, lister_university,
 *   lister_level, lister_why, lister_beta
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';

interface WaitlistData {
  lister_name: string;
  lister_email: string;
  lister_university: string;
  lister_level: string;
  lister_why: string;
  lister_beta: boolean;
}

const AUSTRALIAN_MED_SCHOOLS = [
  'Australian National University (ANU)',
  'Bond University',
  'Curtin University',
  'Deakin University',
  'Flinders University',
  'Griffith University',
  'James Cook University',
  'Macquarie University',
  'Monash University',
  'University of Adelaide',
  'University of Melbourne',
  'University of Newcastle',
  'University of New South Wales (UNSW)',
  'University of Notre Dame – Fremantle',
  'University of Notre Dame – Sydney',
  'University of Queensland',
  'University of Sydney',
  'University of Tasmania',
  'University of Western Australia',
  'University of Wollongong',
  'Western Sydney University',
  'Other',
];

const LEVELS = [
  { value: 'Pre-clinical', label: 'Pre-clinical', desc: 'Years 1–2, foundational sciences' },
  { value: 'Clinical',     label: 'Clinical',     desc: 'Years 3+, hospital rotations' },
  { value: 'Graduate',     label: 'Graduate entry', desc: 'Accelerated / post-grad pathway' },
  { value: 'Junior doctor', label: 'Junior doctor', desc: 'Intern or RMO' },
];

// Total number of steps (not counting the email step, which is the final one)
const TOTAL_STEPS = 4;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function LeadForm({ isOpen, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WaitlistData>({ defaultValues: { lister_beta: false } });

  const watched = watch();

  function handleClose() {
    if (isSubmitting) return;
    onClose();
    setTimeout(() => {
      setStep(0);
      setSubmitted(false);
      setSubmitError('');
    }, 350);
  }

  function next() { setStep(s => s + 1); }
  function back() { setStep(s => s - 1); }

  async function onSubmit(data: WaitlistData) {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const { error } = await supabase.functions.invoke('add-waitlist', {
        body: {
          lister_name:       data.lister_name,
          lister_email:      data.lister_email,
          lister_university: data.lister_university,
          lister_level:      data.lister_level,
          lister_why:        data.lister_why,
          lister_beta:       data.lister_beta,
        },
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error('Waitlist submission error:', err);
      setSubmitError("Something went wrong — please try again or email us directly.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-[500px] bg-[#0c1120] border border-blue-500/20 rounded-2xl shadow-2xl overflow-hidden">

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

        {/* Body */}
        <div className="px-6 py-6">

          {/* ── SUCCESS ── */}
          {submitted ? (
            <div className="py-8 text-center">
              <div className="w-14 h-14 rounded-full bg-success/10 border border-success/25 flex items-center justify-center mx-auto mb-5">
                <span className="text-success text-2xl">✓</span>
              </div>
              <h4 className="text-xl font-bold text-white mb-2">You're on the list.</h4>
              <p className="text-sm text-muted leading-relaxed max-w-xs mx-auto">
                We'll reach out when Bloomed launches for Australian medical students.
                Keep studying — we're building something that'll make it a lot easier.
              </p>
              <button onClick={handleClose} className="btn-primary mt-7 mx-auto">
                Close
              </button>
            </div>

          /* ── STEP 1: Name ── */
          ) : step === 0 ? (
            <div>
              <StepHeader current={1} total={TOTAL_STEPS} question="What's your name?" />
              <input
                type="text"
                placeholder="Full name"
                autoFocus
                className="form-input"
                {...register('lister_name', { required: 'Please enter your name' })}
              />
              {errors.lister_name && <FieldError msg={errors.lister_name.message!} />}
              <StepNav
                onNext={next}
                canContinue={!!watched.lister_name?.trim()}
                showBack={false}
              />
            </div>

          /* ── STEP 2: University + Level ── */
          ) : step === 1 ? (
            <div>
              <StepHeader current={2} total={TOTAL_STEPS} question="Tell us about your studies." />

              {/* University select */}
              <label className="block text-xs font-medium text-muted mb-1.5">University</label>
              <select
                className="form-input mb-4 cursor-pointer"
                style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b7ba8\' stroke-width=\'2\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
                {...register('lister_university', { required: 'Please select your university' })}
              >
                <option value="">Select your university...</option>
                {AUSTRALIAN_MED_SCHOOLS.map(school => (
                  <option key={school} value={school}>{school}</option>
                ))}
              </select>
              {errors.lister_university && <FieldError msg={errors.lister_university.message!} />}

              {/* Level radio */}
              <label className="block text-xs font-medium text-muted mb-1.5 mt-4">Where are you in your degree?</label>
              <div className="space-y-2">
                {LEVELS.map(lvl => {
                  const selected = watched.lister_level === lvl.value;
                  return (
                    <button
                      key={lvl.value}
                      type="button"
                      onClick={() => setValue('lister_level', lvl.value)}
                      className={`option-card ${selected ? 'selected' : ''}`}
                    >
                      <span className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${selected ? 'border-primary bg-primary' : 'border-white/20'}`} />
                      <span>
                        <span className="block text-sm font-medium text-white">{lvl.label}</span>
                        <span className="block text-xs text-muted mt-0.5">{lvl.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.lister_level && <FieldError msg="Please select your level" />}

              <StepNav
                onNext={next}
                onBack={back}
                canContinue={!!watched.lister_university && !!watched.lister_level}
              />
            </div>

          /* ── STEP 3: Why + Beta ── */
          ) : step === 2 ? (
            <div>
              <StepHeader current={3} total={TOTAL_STEPS} question="What are you hoping Bloomed will help you with?" />
              <textarea
                placeholder="e.g. Adaptive learning for ward prep, bridging basic science to clinical..."
                rows={4}
                autoFocus
                className="form-input resize-none"
                {...register('lister_why', { required: 'Tell us a little about your goals' })}
              />
              {errors.lister_why && <FieldError msg={errors.lister_why.message!} />}

              {/* Beta checkbox */}
              <label className="flex items-start gap-3 mt-5 cursor-pointer group">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only"
                    {...register('lister_beta')}
                  />
                  <div
                    onClick={() => setValue('lister_beta', !watched.lister_beta)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                      watched.lister_beta
                        ? 'border-primary bg-primary'
                        : 'border-white/20 group-hover:border-white/40'
                    }`}
                  >
                    {watched.lister_beta && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">I'd like to be a beta tester</p>
                  <p className="text-xs text-muted mt-0.5">You'll get early access and we'll ask for feedback as we build.</p>
                </div>
              </label>

              <StepNav
                onNext={next}
                onBack={back}
                canContinue={!!watched.lister_why?.trim()}
              />
            </div>

          /* ── STEP 4: Email + Submit ── */
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <StepHeader current={4} total={TOTAL_STEPS} question="Last one — where should we reach you?" />
              <p className="text-sm text-muted -mt-2 mb-5">
                We'll notify you when Bloomed launches. No spam, ever.
              </p>

              <input
                type="email"
                placeholder="your@email.com"
                autoFocus
                className="form-input"
                {...register('lister_email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Enter a valid email address',
                  },
                })}
              />
              {errors.lister_email && <FieldError msg={errors.lister_email.message!} />}
              {submitError && <FieldError msg={submitError} />}

              <p className="text-[11px] text-muted/50 mt-3 mb-6">
                By submitting you agree to receive Bloomed product updates. Unsubscribe anytime.
              </p>

              <div className="flex items-center justify-between">
                <button type="button" onClick={back} className="btn-ghost text-sm">
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

// ── Small helper components ────────────────────────────────────────────────────

function StepHeader({ current, total, question }: { current: number; total: number; question: string }) {
  return (
    <>
      <p className="text-[11px] text-muted font-medium mb-3">
        Step {current} of {total}
      </p>
      <h4 className="text-[15px] font-semibold text-white mb-5">{question}</h4>
    </>
  );
}

function FieldError({ msg }: { msg: string }) {
  return <p className="text-xs text-danger mt-2 mb-1">{msg}</p>;
}

function StepNav({
  onNext,
  onBack,
  canContinue,
  showBack = true,
}: {
  onNext: () => void;
  onBack?: () => void;
  canContinue: boolean;
  showBack?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mt-6">
      {showBack && onBack ? (
        <button type="button" onClick={onBack} className="btn-ghost text-sm">← Back</button>
      ) : <div />}
      <button
        type="button"
        onClick={onNext}
        disabled={!canContinue}
        className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue →
      </button>
    </div>
  );
}

/**
 * LeadForm.tsx — progressive-reveal waitlist modal
 *
 * Flow:
 *   1. Name + Email
 *   2. Medical student or Junior doctor?
 *   3. University
 *   4. Where in degree? (skipped for junior doctors)
 *   5. "Get started now" (beta) vs "Wait until ready"
 *
 * Each step appears only after the previous one is completed,
 * keeping the form feeling small and conversational.
 *
 * Submits to Supabase Edge Function 'add-waitlist'.
 */

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

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
  { value: 'Clinical', label: 'Clinical', desc: 'Years 3+, hospital rotations' },
  { value: 'Graduate', label: 'Graduate entry', desc: 'Accelerated / post-grad pathway' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function LeadForm({ isOpen, onClose }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'student' | 'junior' | ''>('');
  const [university, setUniversity] = useState('');
  const [level, setLevel] = useState('');
  const [beta, setBeta] = useState<boolean | null>(null);

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new fields appear
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [role, university, level, beta]);

  function handleClose() {
    if (isSubmitting) return;
    onClose();
    setTimeout(() => {
      setName('');
      setEmail('');
      setRole('');
      setUniversity('');
      setLevel('');
      setBeta(null);
      setSubmitted(false);
      setSubmitError('');
    }, 350);
  }

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const hasIdentity = !!name.trim() && isValidEmail;
  const hasRole = !!role;
  const hasUniversity = !!university;
  const hasLevel = role === 'junior' || !!level;
  const isComplete = beta !== null;

  async function submit() {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const { error } = await supabase.functions.invoke('add-waitlist', {
        body: {
          lister_name: name.trim(),
          lister_email: email.trim(),
          lister_university: university || 'N/A',
          lister_level: role === 'junior' ? 'Junior doctor' : level,
          lister_why: '',
          lister_beta: beta === true,
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

  // Auto-submit when final choice is made
  useEffect(() => {
    if (isComplete && !submitted && !isSubmitting) {
      submit();
    }
  }, [beta]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      <div className="relative w-full max-w-[440px] bg-surface border border-primary/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-primary/5">
          <div>
            <h3 className="text-base font-bold text-primary">Get early access</h3>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-primary hover:bg-primary/5 transition-colors"
          >
            &#10005;
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">

          {submitted ? (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-success/10 border border-success/25 flex items-center justify-center mx-auto mb-4">
                <span className="text-success text-xl">&#10003;</span>
              </div>
              <h4 className="text-lg font-bold text-primary mb-2">You're on the list.</h4>
              <p className="text-sm text-muted leading-relaxed max-w-xs mx-auto">
                {beta
                  ? "We'll be in touch soon with beta access. Thanks for helping shape Bloomed."
                  : "We'll email you when Bloomed is ready. Keep studying — we're building something great."}
              </p>
              <button onClick={handleClose} className="btn-primary mt-6 mx-auto text-sm px-5 py-2.5">
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Step 1: Name + Email */}
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Your name"
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="form-input text-sm"
                />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="form-input text-sm"
                />
              </div>

              {/* Step 2: Role — appears after name + email */}
              {hasIdentity && (
                <FadeIn>
                  <label className="block text-xs font-medium text-muted mb-2">I am a...</label>
                  <div className="grid grid-cols-2 gap-2">
                    <ChoiceButton
                      label="Medical student"
                      selected={role === 'student'}
                      onClick={() => { setRole('student'); setLevel(''); }}
                    />
                    <ChoiceButton
                      label="Junior doctor"
                      selected={role === 'junior'}
                      onClick={() => { setRole('junior'); setLevel(''); }}
                    />
                  </div>
                </FadeIn>
              )}

              {/* Step 3: University — appears after role (students only) */}
              {hasRole && role === 'student' && (
                <FadeIn>
                  <label className="block text-xs font-medium text-muted mb-1.5">University</label>
                  <select
                    value={university}
                    onChange={e => setUniversity(e.target.value)}
                    className="form-input text-sm cursor-pointer"
                    style={{
                      appearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2378756e\' stroke-width=\'2\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 14px center',
                    }}
                  >
                    <option value="">Select your university...</option>
                    {AUSTRALIAN_MED_SCHOOLS.map(school => (
                      <option key={school} value={school}>{school}</option>
                    ))}
                  </select>
                </FadeIn>
              )}

              {/* Step 4: Degree level — appears after university, skipped for junior doctors */}
              {hasUniversity && role === 'student' && (
                <FadeIn>
                  <label className="block text-xs font-medium text-muted mb-2">Where are you in your degree?</label>
                  <div className="space-y-1.5">
                    {LEVELS.map(lvl => (
                      <ChoiceButton
                        key={lvl.value}
                        label={lvl.label}
                        desc={lvl.desc}
                        selected={level === lvl.value}
                        onClick={() => setLevel(lvl.value)}
                        full
                      />
                    ))}
                  </div>
                </FadeIn>
              )}

              {/* Step 5: Beta preference — appears when everything above is done */}
              {((role === 'junior') || (hasLevel && hasUniversity)) && (
                <FadeIn>
                  <label className="block text-xs font-medium text-muted mb-2">How would you like to join?</label>
                  <div className="space-y-2">
                    <ChoiceButton
                      label="I'd like to get started now"
                      desc="You'll get early beta access and we'll ask for feedback as we build."
                      selected={beta === true}
                      onClick={() => setBeta(true)}
                      full
                    />
                    <ChoiceButton
                      label="I'd rather wait until it's ready"
                      desc="We'll email you when Bloomed is ready to share."
                      selected={beta === false}
                      onClick={() => setBeta(false)}
                      full
                    />
                  </div>
                  {submitError && <p className="text-xs text-danger mt-2">{submitError}</p>}
                  {isSubmitting && (
                    <p className="text-xs text-muted mt-2 text-center">Joining...</p>
                  )}
                </FadeIn>
              )}

              <div ref={bottomRef} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// -- Helper components --

function FadeIn({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-fade-in">
      {children}
    </div>
  );
}

function ChoiceButton({
  label,
  desc,
  selected,
  onClick,
  full = false,
}: {
  label: string;
  desc?: string;
  selected: boolean;
  onClick: () => void;
  full?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${full ? 'w-full text-left' : ''} px-4 py-3 rounded-xl border-2 transition-all duration-150 cursor-pointer ${
        selected
          ? 'border-accent bg-accent/5'
          : 'border-primary/[0.08] hover:border-accent/30 bg-transparent'
      }`}
    >
      <span className="block text-sm font-medium text-primary">{label}</span>
      {desc && <span className="block text-xs text-muted mt-0.5">{desc}</span>}
    </button>
  );
}

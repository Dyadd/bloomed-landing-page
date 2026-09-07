/* The three hero questions and the mastery colour ramps, shared by the animated
   session and the still storyboard that replaces it where motion is off. */

export type Cell = { n: string; s: number | null } | null;
export interface Question {
  concept: string;
  topic: string;
  from: number;
  to: number;
  stem: string;
  options: string[];
  correct: number;
  right: string;
  wrong: string;
  grid: Cell[] | null;
  /* index of the tile the engine routes to next */
  next: number | null;
  /* when set, the tutor steps in after this question instead of the growth card:
     one follow-up (phrased for a right or a wrong answer) and the reply the ghost types */
  tutor?: Tutor;
}
export interface Tutor {
  right: string;
  wrong: string;
  reply: string;
}

const BAR_STOPS: [number, number[]][] = [[0, [193, 86, 70]], [30, [203, 115, 101]], [52, [214, 154, 95]], [68, [216, 197, 108]], [80, [195, 215, 120]], [92, [211, 250, 112]]];
const TEXT_STOPS: [number, number[]][] = [[0, [150, 54, 42]], [30, [162, 70, 56]], [52, [150, 96, 42]], [68, [122, 104, 34]], [80, [96, 116, 36]], [92, [74, 104, 26]]];

function ramp(stops: [number, number[]][], score: number) {
  const s = Math.max(stops[0][0], Math.min(stops[stops.length - 1][0], score));
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, ca] = stops[i];
    const [b, cb] = stops[i + 1];
    if (s <= b) {
      const t = (s - a) / (b - a);
      const c = ca.map((v, k) => Math.round(v + (cb[k] - v) * t));
      return `rgb(${c[0]},${c[1]},${c[2]})`;
    }
  }
  return `rgb(${stops[stops.length - 1][1].join(',')})`;
}
export const barColor = (s: number | null) => ramp(BAR_STOPS, s == null ? 0 : s);
export const textColor = (s: number | null) => ramp(TEXT_STOPS, s == null ? 0 : s);
export function band(s: number | null) {
  if (s == null) return 'Untouched';
  if (s >= 85) return 'Mastered';
  if (s >= 70) return 'Strong';
  if (s >= 52) return 'Developing';
  if (s >= 30) return 'Weak';
  return 'Struggling';
}

export const QUESTIONS: Question[] = [
  {
    concept: 'Asthma step-up therapy', topic: 'Respiratory medicine', from: 34, to: 60,
    stem: 'A 24-year-old woman with asthma uses her salbutamol inhaler four times a week, six months into a low-dose inhaled corticosteroid. What is the most appropriate next step?',
    options: ['Add a long-acting beta agonist', 'Check inhaler technique and adherence', 'Double the inhaled corticosteroid dose', 'Start oral prednisolone'],
    correct: 1,
    right: 'You checked control and adherence before stepping up therapy.',
    wrong: 'You stepped up therapy before checking control and adherence. Let us understand the underpinning physiology.',
    grid: [
      { n: 'Bronchiectasis', s: 71 }, { n: 'Acid-base compensation', s: 51 }, { n: 'Pneumonia severity', s: 84 },
      { n: 'Pulmonary function tests', s: 62 }, null, { n: 'Oxygen therapy targets', s: 88 },
      { n: 'Pleural effusion', s: 44 }, { n: 'ABG interpretation', s: 69 }, { n: 'Asthma in pregnancy', s: null },
    ],
    next: 1,
  },
  {
    concept: 'Acid-base compensation', topic: 'Renal medicine', from: 51, to: 77,
    stem: 'An arterial blood gas shows pH 7.32, PaCO2 30 mmHg and bicarbonate 15 mmol/L. Which disturbance best explains these results?',
    options: ['Respiratory acidosis', 'Metabolic acidosis with respiratory compensation', 'Metabolic alkalosis', 'Mixed respiratory and metabolic alkalosis'],
    correct: 1,
    right: 'You read the compensation in the right direction. A couple more to make sure it sticks.',
    wrong: 'You read the compensation in the wrong direction. The bicarbonate is the primary change here.',
    grid: [
      { n: 'Hyponatraemia', s: 58 }, { n: 'Renal tubular acidosis', s: 47 }, { n: 'AKI staging', s: 76 },
      { n: 'Potassium disorders', s: 66 }, null, { n: 'Warfarin reversal', s: null },
      { n: 'Diuretic pharmacology', s: 81 }, { n: 'Contrast nephropathy', s: 39 }, { n: 'Dialysis indications', s: 72 },
    ],
    next: 5,
    tutor: {
      right: 'Good, you spotted the bicarbonate as the primary change. If the PaCO2 had come back at 40 instead of 30, what would that tell you?',
      wrong: 'The bicarbonate is the primary change here, so this is a metabolic acidosis. If the PaCO2 had come back at 40 instead of 30, what would that tell you?',
      reply: 'A respiratory acidosis on top of it',
    },
  },
  {
    concept: 'Warfarin reversal', topic: 'Haematology', from: 26, to: 52,
    stem: 'A 71-year-old man taking warfarin has an INR of 8.4 and no bleeding. What is the most appropriate management?',
    options: ['Withhold warfarin and give oral vitamin K', 'Give fresh frozen plasma', 'Continue warfarin at a reduced dose', 'Give prothrombin complex concentrate'],
    correct: 0,
    right: 'You asked whether there was bleeding before reaching for a reversal agent.',
    wrong: 'You reached for a reversal agent before asking whether there was bleeding.',
    grid: null, next: null,
  },
];

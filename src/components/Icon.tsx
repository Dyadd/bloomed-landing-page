import type { CSSProperties } from 'react';

/* The handful of Tabler glyphs the page uses, inlined so the 3MB icon webfont
   never ships. Same 24-unit grid and 2px stroke as the originals. */
const PATHS: Record<string, string[]> = {
  bolt: ['M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11'],
  'arrow-right': ['M5 12l14 0', 'M13 18l6 -6', 'M13 6l6 6'],
  check: ['M5 12l5 5l10 -10'],
  x: ['M18 6l-12 12', 'M6 6l12 12'],
  search: ['M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0', 'M21 21l-6 -6'],
  route: [
    'M3 7a2 2 0 1 0 4 0a2 2 0 1 0 -4 0',
    'M17 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0',
    'M11 19h5.5a3.5 3.5 0 0 0 0 -7h-8a3.5 3.5 0 0 1 0 -7h4.5',
  ],
};

export type IconName = keyof typeof PATHS;

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  style?: CSSProperties;
}

export default function Icon({ name, size = 16, color, style }: Props) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, color: color || 'inherit', ...style }}
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

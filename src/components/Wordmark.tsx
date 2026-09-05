import type { CSSProperties } from 'react';

/* Bloomed has no logo mark. The identity is the word, set in Fraunces 500,
   always lowercase. Never reconstruct or draw a glyph in its place. */
interface Props {
  size?: number;
  onDark?: boolean;
  style?: CSSProperties;
}

export default function Wordmark({ size = 23, onDark = false, style }: Props) {
  return (
    <span aria-label="Bloomed" style={{ display: 'inline-flex', alignItems: 'flex-end', ...style }}>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: size,
          letterSpacing: '-0.01em',
          lineHeight: 1,
          color: onDark ? 'var(--on-dark)' : 'var(--ink)',
        }}
      >
        bloomed
      </span>
    </span>
  );
}

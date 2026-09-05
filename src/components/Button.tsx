import type { CSSProperties, ReactNode } from 'react';
import Icon, { type IconName } from './Icon';

const VARIANTS = {
  primary: { background: 'var(--lime)', color: 'var(--ink)', border: '1px solid var(--ink)' },
  dark: { background: 'var(--ink)', color: 'var(--on-dark)', border: '1px solid var(--ink)' },
} as const;

const SIZES = {
  lg: { fontSize: 16, padding: '15px 26px', borderRadius: 'var(--radius-cta)', iconSize: 17 },
  md: { fontSize: 15.5, padding: '14px 26px', borderRadius: 'var(--radius-button)', iconSize: 17 },
  nav: { fontSize: 14.5, padding: '10px 18px', borderRadius: '9px', iconSize: 15 },
} as const;

interface Props {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  icon?: IconName;
  style?: CSSProperties;
}

/* A link styled as the design system's button. Every call to action on this
   page leaves the site, so the default element is an anchor. */
export default function Button({ children, href, onClick, variant = 'primary', size = 'md', icon, style }: Props) {
  const v = VARIANTS[variant];
  const s = SIZES[size];
  const shared: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    fontSize: s.fontSize,
    padding: s.padding,
    borderRadius: s.borderRadius,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 0.18s ease, border-color 0.18s ease',
    ...v,
    ...style,
  };
  const inner = (
    <>
      {children}
      {icon ? <Icon name={icon} size={s.iconSize} /> : null}
    </>
  );
  if (href) {
    return (
      <a href={href} onClick={onClick} style={shared}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} style={shared}>
      {inner}
    </button>
  );
}

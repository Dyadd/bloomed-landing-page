import { useEffect, useState } from 'react';

/* Whether the hero should stand still. True when the visitor has asked for
   reduced motion (Windows "Show animations" off, macOS "Reduce motion", both
   common on locked-down hospital machines), when the display can only update
   slowly, or when the browser is too old for the Web Animations API and
   ResizeObserver the animated session is built on. In every one of those cases
   the animated hero would either be invisible or throw, so a still storyboard
   takes its place. */
const REDUCED = '(prefers-reduced-motion: reduce)';
const SLOW = '(update: slow), (update: none)';

function matches(query: string) {
  return typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
}

export function heroShouldStand(): boolean {
  if (typeof window === 'undefined') return false;
  const proto = window.HTMLElement && window.HTMLElement.prototype;
  if (!proto || typeof proto.animate !== 'function' || typeof proto.getAnimations !== 'function') return true;
  if (typeof window.ResizeObserver === 'undefined') return true;
  return matches(REDUCED) || matches(SLOW);
}

export function useStillHero() {
  const [still, setStill] = useState(heroShouldStand);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(REDUCED);
    const onChange = () => setStill(heroShouldStand());
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);
  return still;
}

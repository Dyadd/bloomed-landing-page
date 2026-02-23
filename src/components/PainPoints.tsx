import { useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PAIN_POINTS = [
  "You're drowning in flashcards, not learning from them.",
  "You study for hours but nothing sticks.",
  "You memorise facts without understanding them.",
  "You don't know what you don't know.",
  "Your study plan is just guesswork.",
  "You feel behind no matter how hard you work.",
];

function srand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const CARD_TRANSFORMS = PAIN_POINTS.map((_, i) => ({
  rotate: (srand(i * 7 + 3) - 0.5) * 18,
  offsetX: 0,
  offsetY: (srand(i * 13 + 9) - 0.5) * 18,
}));
// Second card: tilt counterclockwise (left)
CARD_TRANSFORMS[1].rotate = -10;
// Third card: rotate clockwise so it doesn't touch the fourth
CARD_TRANSFORMS[2].rotate = 10;

// Order in which cards appear on scroll (seemingly random)
const REVEAL_ORDER = [2, 5, 0, 4, 1, 3];

export default function PainPoints() {
  useEffect(() => {
    const title = document.querySelector('.pain-title');
    if (title) {
      gsap.fromTo(title, { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: title, start: 'top 85%', toggleActions: 'play none none reverse' },
      });
    }

    const items = document.querySelectorAll('.pain-item');
    items.forEach((item, i) => {
      const { rotate, offsetX, offsetY } = CARD_TRANSFORMS[i];
      gsap.fromTo(
        item,
        { opacity: 0, x: offsetX, y: offsetY + 40, rotate, scale: 0.95 },
        {
          opacity: 1,
          x: offsetX,
          y: offsetY,
          rotate,
          scale: 1,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.pain-row',
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
          delay: REVEAL_ORDER.indexOf(i) * 0.12,
        },
      );
    });
  }, []);

  const handleEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, {
      opacity: 1,
      rotate: 0,
      x: 0,
      y: 0,
      scale: 1.55,
      zIndex: 10,
      boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
      duration: 0.35,
      ease: 'back.out(1.4)',
      overwrite: true,
    });
  }, []);

  const handleLeave = useCallback((e: React.MouseEvent<HTMLDivElement>, i: number) => {
    const { rotate, offsetX, offsetY } = CARD_TRANSFORMS[i];
    gsap.to(e.currentTarget, {
      opacity: 1,
      rotate,
      x: offsetX,
      y: offsetY,
      scale: 1,
      zIndex: 0,
      boxShadow: '0 0px 0px rgba(0,0,0,0)',
      duration: 0.45,
      ease: 'power2.inOut',
      overwrite: true,
    });
  }, []);

  return (
    <section className="relative pt-24 pb-32 lg:pb-40 px-8 lg:px-16 overflow-hidden">
      <h2 className="pain-title text-h2 lg:text-h1 font-bold text-primary mb-14 text-center">
        Most Students Study <span className="font-accent italic gradient-text">Blind</span>
      </h2>

      <div className="pain-row flex flex-nowrap justify-center items-center gap-5 lg:gap-7">
        {PAIN_POINTS.map((point, i) => {
          const { rotate, offsetX, offsetY } = CARD_TRANSFORMS[i];
          return (
            <div
              key={i}
              className="pain-item relative w-56 min-w-[14rem] lg:w-60 lg:min-w-[15rem] flex-shrink-0 p-6 rounded-2xl border border-primary/[0.06] bg-surface/60 cursor-default"
              style={{
                transform: `rotate(${rotate}deg) translate(${offsetX}px, ${offsetY}px)`,
                willChange: 'transform',
              }}
              onMouseEnter={handleEnter}
              onMouseLeave={(e) => handleLeave(e, i)}
            >
              <span className="block w-2 h-2 rounded-full bg-danger mb-3" />
              <p className="text-body font-medium text-primary leading-snug">
                {point}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

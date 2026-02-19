import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PAIN_POINTS = [
  "You're drowning in flashcards, not learning from them.",
  "You study for 5 hours when you need 2.",
  "You memorise facts but you don't understand.",
];

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
      gsap.fromTo(
        item,
        { opacity: 0, y: 30, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
          delay: i * 0.15,
        },
      );
    });
  }, []);

  return (
    <section className="relative py-24 px-8 lg:px-16 overflow-hidden">
      <div className="max-w-3xl mx-auto">
        <h2 className="pain-title text-3xl lg:text-4xl font-bold text-primary tracking-tight mb-10 text-center">
          Most students study <span className="font-accent gradient-text">blind</span>.
        </h2>

        <div className="space-y-6">
        {PAIN_POINTS.map((point, i) => (
          <div
            key={i}
            className="pain-item flex items-center gap-4 p-6 rounded-xl border border-primary/[0.06] bg-surface/50"
          >
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-danger" />
            <p className="text-lg lg:text-xl font-medium text-primary leading-snug">
              {point}
            </p>
          </div>
        ))}
        </div>
      </div>
    </section>
  );
}

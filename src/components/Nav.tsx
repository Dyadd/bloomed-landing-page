import { useState, useEffect } from 'react';

interface Props {
  onOpenForm: () => void;
}

export default function Nav({ onOpenForm }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 px-4 sm:px-8 lg:px-16 py-3 sm:py-4 flex items-center justify-between transition-all duration-300 ${
        scrolled
          ? 'bg-bg/80 backdrop-blur-xl border-b border-primary/5'
          : 'bg-transparent'
      }`}
    >
      <a href="#" className="flex items-center" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
        <span className="font-accent italic text-h3 gradient-text">Bloomed</span>
      </a>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* FAQ — hidden on mobile, visible on sm+ */}
        <button
          onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
          className="btn-ghost text-body-sm hidden sm:inline-flex py-[13px]"
        >
          FAQ
        </button>

        <button onClick={onOpenForm} className="btn-primary text-body-sm" style={{ background: '#1a32e0' }}>
          <span className="hidden sm:inline">Get early access</span>
          <span className="sm:hidden">Join</span>
        </button>
      </div>
    </nav>
  );
}

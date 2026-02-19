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
      {/* Logo */}
      <a href="#" className="flex items-center gap-2.5" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
        <img src="/logo.svg" alt="Bloomed" className="h-8 w-auto" />
      </a>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* FAQ — hidden on mobile, visible on sm+ */}
        <button
          onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
          className="btn-ghost text-sm hidden sm:inline-flex"
        >
          FAQ
        </button>

        <button onClick={onOpenForm} className="btn-ghost text-sm">
          <span className="hidden sm:inline">Get early access</span>
          <span className="sm:hidden">Join</span>
        </button>
      </div>
    </nav>
  );
}

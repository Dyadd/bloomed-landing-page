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
      className={`fixed top-0 left-0 right-0 z-40 px-8 lg:px-16 py-4 flex items-center justify-between transition-all duration-300 ${
        scrolled
          ? 'bg-bg/80 backdrop-blur-xl border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-white font-bold text-xs">B</span>
        </div>
        <span className="font-bold text-white tracking-tight">Bloomed</span>
      </div>

      <button onClick={onOpenForm} className="btn-ghost text-sm">
        Join waitlist
      </button>
    </nav>
  );
}

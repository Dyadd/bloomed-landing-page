export default function Footer() {
  return (
    <footer className="border-t border-primary/5 px-6 sm:px-8 lg:px-16 py-8 lg:py-10">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-2">
          <img src="/logo.png" alt="Bloomed" className="h-8 w-auto" />
          <span className="font-accent italic font-bold text-h3 gradient-text">Bloomed</span>
        </a>
        <p className="text-caption text-muted/60">
          &copy; {new Date().getFullYear()} Bloomed. Built for Australian medical students and doctors.
        </p>
      </div>
    </footer>
  );
}

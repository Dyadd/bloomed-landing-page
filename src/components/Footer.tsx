export default function Footer() {
  return (
    <footer className="border-t border-primary/5 px-8 lg:px-16 py-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-accent flex items-center justify-center">
            <span className="text-white font-bold" style={{ fontSize: 9 }}>B</span>
          </div>
          <span className="font-semibold text-primary text-sm">Bloomed</span>
        </div>
        <p className="text-xs text-muted/60">
          &copy; {new Date().getFullYear()} Bloomed. Built for Australian medical students.
        </p>
      </div>
    </footer>
  );
}

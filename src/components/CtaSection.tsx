interface Props {
  onOpenForm: () => void;
}

export default function CtaSection({ onOpenForm }: Props) {
  return (
    <section className="relative py-36 px-8 lg:px-16 overflow-hidden">
      {/* Accent glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[700px] h-[450px] opacity-[0.06]"
          style={{ background: 'radial-gradient(ellipse, var(--color-accent), transparent 68%)' }}
        />
      </div>

      {/* Dot grid */}
      <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />

      <div className="relative max-w-3xl mx-auto text-center">
        <div className="inline-flex mb-8">
          <span className="phase-label">
            <span className="dot" />
            Early access
          </span>
        </div>

        <h2 className="text-4xl lg:text-6xl font-bold text-primary mb-6 leading-tight tracking-tight">
          Built for{' '}
          <span className="gradient-text">Australian</span>
          <br />
          medical students.
        </h2>

        <p className="text-xl text-muted leading-relaxed mb-10 max-w-xl mx-auto">
          Bloomed is launching across MD programs in Australia. Get early access
          and help shape what we build.
        </p>

        <button onClick={onOpenForm} className="btn-primary text-base px-9 py-[15px]">
          Get early access
        </button>

      </div>
    </section>
  );
}

interface Props {
  onOpenForm: () => void;
}

export default function CtaSection({ onOpenForm }: Props) {
  return (
    <section className="relative pt-24 lg:pt-44 pb-24 lg:pb-44 px-6 sm:px-8 lg:px-16 overflow-hidden">
      {/* Accent glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[85vw] max-w-[700px] h-[55vw] max-h-[450px] opacity-[0.06]"
          style={{ background: 'radial-gradient(ellipse, var(--color-accent), transparent 68%)' }}
        />
      </div>

      <div className="relative max-w-3xl mx-auto text-center">
        <h2 className="text-[2.5rem] lg:text-display font-bold text-primary mb-6 leading-[1.1]">
          Built for{' '}
          <span className="gradient-text">Australian</span>
          <br />
          medical students.
        </h2>

        <p className="text-body-lg text-muted mb-10 max-w-xl mx-auto">
          Bloomed is launching across MD programs in Australia. <br /> Get early access
          and help shape what we build.
        </p>

        <button onClick={onOpenForm} className="btn-primary text-body px-7 py-[15px]" style={{ backgroundColor: '#1a32e0' }}>
          Get Early Access
        </button>

      </div>
    </section>
  );
}

import CtaAustraliaBloom from './CtaAustraliaBloom';

interface Props {
  onOpenForm: () => void;
}

export default function CtaSection({ onOpenForm }: Props) {
  return (
    <section className="relative pt-36 lg:pt-44 pb-36 lg:pb-44 px-8 lg:px-16 overflow-hidden">
      {/* Australia node network — behind text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-full max-w-4xl h-full opacity-60">
          <CtaAustraliaBloom />
        </div>
      </div>

      {/* Accent glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[700px] h-[450px] opacity-[0.06]"
          style={{ background: 'radial-gradient(ellipse, var(--color-accent), transparent 68%)' }}
        />
      </div>

      <div className="relative max-w-3xl mx-auto text-center">
        <div className="inline-flex mb-8">
          <span className="phase-label text-caption">
            <span className="dot" />
            Early access
          </span>
        </div>

        <h2 className="text-h1 lg:text-display font-bold text-primary mb-6">
          Built for{' '}
          <span className="gradient-text">Australian</span>
          <br />
          medical students.
        </h2>

        <p className="text-body-lg text-muted mb-10 max-w-xl mx-auto">
          Bloomed is launching across MD programs in Australia. <br /> Get early access
          and help shape what we build.
        </p>

        <button onClick={onOpenForm} className="btn-primary text-body px-7 py-[14px]" style={{ backgroundColor: '#1a32e0' }}>
          Get early access
        </button>

      </div>
    </section>
  );
}

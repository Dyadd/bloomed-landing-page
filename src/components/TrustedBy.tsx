const LOGOS = [
  { src: '/logos/monash-university.png', alt: 'Monash University', height: 46, maxWidth: 130 },
  { src: '/logos/university-of-melbourne.png', alt: 'University of Melbourne', height: 54, maxWidth: 150 },
  { src: '/logos/monash-health.png', alt: 'Monash Health', height: 46, maxWidth: 130 },
  { src: '/logos/austin-health.png', alt: 'Austin Health', height: 84, maxWidth: 210 },
  { src: '/logos/the-alfred.png', alt: 'The Alfred', height: 54, maxWidth: 150 },
];

export default function TrustedBy() {
  return (
    <section className="trusted" aria-label="Trusted by">
      <div className="trusted-eyebrow">Trusted by medical students and clinicians at</div>
      <div className="trusted-logos">
        {LOGOS.map((l) => (
          <img key={l.src} src={l.src} alt={l.alt} loading="lazy" style={{ height: l.height, maxWidth: l.maxWidth }} />
        ))}
      </div>
    </section>
  );
}

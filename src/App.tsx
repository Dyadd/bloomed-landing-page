import ClosingCta from './components/ClosingCta';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import SiteNav from './components/SiteNav';
import TrustedBy from './components/TrustedBy';

export default function App() {
  return (
    <div className="page">
      <div className="hero-wrap">
        <div className="hero-wash" />
        <SiteNav />
        <Hero />
        <div className="hero-tail" />
      </div>
      <TrustedBy />
      <HowItWorks />
      <ClosingCta />
    </div>
  );
}

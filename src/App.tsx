import { useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import Nav from './components/Nav';
import Hero from './components/Hero';
import PainPoints from './components/PainPoints';
import NarrativeSection from './components/NarrativeSection';
import CtaSection from './components/CtaSection';
import FaqSection from './components/FaqSection';
import Footer from './components/Footer';
import LeadForm from './components/LeadForm';

// Register GSAP plugins once at the app root
gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Nav onOpenForm={() => setFormOpen(true)} />
      <Hero onOpenForm={() => setFormOpen(true)} />
      <PainPoints />
      <NarrativeSection />
      <CtaSection onOpenForm={() => setFormOpen(true)} />
      <FaqSection />
      <Footer />
      <LeadForm isOpen={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}

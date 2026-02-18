import { useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import Nav from './components/Nav';
import Hero from './components/Hero';
import NarrativeSection from './components/NarrativeSection';
import CtaSection from './components/CtaSection';
import Footer from './components/Footer';
import LeadForm from './components/LeadForm';

// Register GSAP plugins once at the app root
gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="bg-bg text-white min-h-screen">
      <Nav onOpenForm={() => setFormOpen(true)} />
      <Hero onOpenForm={() => setFormOpen(true)} />
      <NarrativeSection />
      <CtaSection onOpenForm={() => setFormOpen(true)} />
      <Footer />
      <LeadForm isOpen={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}

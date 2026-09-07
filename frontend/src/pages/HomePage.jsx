import React, { useEffect } from 'react';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import BenefitsSection from '../components/landing/BenefitsSection';
import CTASection from '../components/landing/CTASection';
import LandingFooter from '../components/landing/LandingFooter';

export default function HomePage({ onStatusUpdate }) {
  useEffect(() => {
    // Notify parent routes if needed
    if (onStatusUpdate) {
      onStatusUpdate('healthy');
    }
  }, [onStatusUpdate]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white">
      {/* 1. Hero with Product Preview Mockup */}
      <HeroSection />

      {/* 2. Core Feature Cards */}
      <FeaturesSection />

      {/* 3. Simple 3-step How It Works */}
      <HowItWorksSection />

      {/* 4. Core SaaS Benefits Grid */}
      <BenefitsSection />

      {/* 5. Call To Action Banner */}
      <CTASection />

      {/* 6. Landing Footer */}
      <LandingFooter />
    </div>
  );
}

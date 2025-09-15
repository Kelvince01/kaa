// import { HeroSection } from "./components/hero-section";

import { CTASection } from "./components/cta-section";
import { FeaturesSection } from "./components/features-section";
import { HeroSectionV2 } from "./components/hero-section-v2";
import { PricingSection } from "./components/pricing-section";
import { StatsSection } from "./components/stats-section";
import { TestimonialsSection } from "./components/testimonials-section";

// import { HeroSectionV3 } from "./components/hero-section-v3";

function HomeContentContainer() {
  return (
    <>
      {/* <HeroSection /> */}
      <HeroSectionV2 />
      {/* <HeroSectionV3 /> */}
      <FeaturesSection />
      <StatsSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
    </>
  );
}

export default HomeContentContainer;

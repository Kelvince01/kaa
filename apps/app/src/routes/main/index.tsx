import { CTASection } from "./components/cta-section";
import { FeaturesSection } from "./components/features-section";
// import { HeroSection } from "./components/hero-section";
import { HeroSectionV2 } from "./components/hero-section-v2";
// import { HeroSectionV3 } from "./components/hero-section-v3";
// import { HeroSectionV4 } from "./components/hero-section-v4";
import { PricingSection } from "./components/pricing-section";
import { StatsSection } from "./components/stats-section";
import { TestimonialsSection } from "./components/testimonials-section";

function HomeContentContainer() {
  return (
    <>
      {/* <HeroSection /> */}
      <HeroSectionV2 />
      {/* <HeroSectionV3 /> */}
      {/* <HeroSectionV4 /> */}
      <FeaturesSection />
      <StatsSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
    </>
  );
}

export default HomeContentContainer;

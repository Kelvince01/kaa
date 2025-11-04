import { CTASection } from "./components/cta-section";
import FeaturedProperties from "./components/featured-properties";
import { FeaturesSection } from "./components/features-section";
import { HeroSectionV2 } from "./components/hero-section-v2";
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
      <FeaturedProperties />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
    </>
  );
}

export default HomeContentContainer;

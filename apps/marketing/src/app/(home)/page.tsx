import type { Metadata } from "next";
import LogoCarousel from "@/components/marketing/LogoCarousel";
import CTA from "./_components/CTA";
import GrowthBanner from "./_components/GrowthBanner";
import Hero from "./_components/Hero";
import PlatformFeatures from "./_components/PlatformFeatures";
import PlatformStrip from "./_components/PlatformStrip";
import SolutionsSection from "./_components/SolutionsSection";
import StatsBar from "./_components/StatsBar";
import Testimonial from "./_components/Testimonial";
import WhyChoose from "./_components/WhyChoose";
import { DEFAULT_IMAGES } from "./_data/landingData";
import useSiteImages from "@/hooks/useSiteImages";

export const metadata: Metadata = {
  title: "HotelOS - Complete Hospitality Management System",
  description:
    "One connected operating system for your hotel and restaurant operations. Streamline front desk, billing, inventory, and online orders.",
};

export default function LandingPage() {
  const images = useSiteImages("landing", DEFAULT_IMAGES);

  return (
    <>
      <Hero images={images.hero} />
      <PlatformStrip />
      <LogoCarousel
        variant="compact"
        title="Aggregators Connected With Us"
        logos={images.aggregatorLogos}
      />
      <SolutionsSection images={images.solutions} />
      <StatsBar />
      <WhyChoose images={images.why} />
      <PlatformFeatures />
      <GrowthBanner backgroundSrc={images.growthBackground} />
      <Testimonial avatars={images.testimonialAvatars} />
      <CTA backgroundSrc={images.ctaBackground} />
    </>
  );
}

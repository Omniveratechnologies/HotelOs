import useSiteImages from "../../marketing/hooks/useSiteImages.js";
import LogoCarousel from "../../marketing/components/LogoCarousel.jsx";
import CTA from "../components/CTA.jsx";
import GrowthBanner from "../components/GrowthBanner.jsx";
import Hero from "../components/Hero.jsx";
import PlatformFeatures from "../components/PlatformFeatures.jsx";
import PlatformStrip from "../components/PlatformStrip.jsx";
import SolutionsSection from "../components/SolutionsSection.jsx";
import StatsBar from "../components/StatsBar.jsx";
import Testimonial from "../components/Testimonial.jsx";
import WhyChoose from "../components/WhyChoose.jsx";

/**
 * Image URLs for the landing page. Leave empty for now (placeholders are
 * shown). Later the backend (Cloudinary, managed from the admin dashboard)
 * supplies these through useSiteImages.
 *
 * The header and footer come from MarketingLayout, so they are not here.
 */
const DEFAULT_IMAGES = {
  hero: { background: "", mockup: "" },
  aggregatorLogos: [
    { name: "MakeMyTrip", src: "" },
    { name: "Goibibo", src: "" },
    { name: "Booking.com", src: "" },
    { name: "Agoda", src: "" },
    { name: "Expedia", src: "" },
    { name: "Airbnb", src: "" },
    { name: "Zomato", src: "" },
    { name: "Swiggy", src: "" },
    { name: "Google", src: "" },
    { name: "Tripadvisor", src: "" },
  ],
  solutions: { pms: "", pos: "", xFactor: "" },
  why: { hotels: "", restaurants: "", xFactor: "" },
  growthBackground: "",
  testimonialAvatars: ["", "", ""],
  ctaBackground: "",
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

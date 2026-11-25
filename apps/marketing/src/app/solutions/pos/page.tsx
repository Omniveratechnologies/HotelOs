import type { Metadata } from "next";
import CtaBanner from "@/components/marketing/CtaBanner";
import FeatureSection from "@/components/marketing/FeatureSection";
import FeatureStrip from "@/components/marketing/FeatureStrip";
import ProductHero from "@/components/marketing/ProductHero";
import { ROUTES } from "@/data/siteContent";
import useSiteImages from "@/hooks/useSiteImages";
import {
  CTA_PERKS,
  DEFAULT_IMAGES,
  SECTIONS,
  STRIP_ITEMS,
} from "./_data/posData";

export const metadata: Metadata = {
  title: "HotelOS POS - Restaurant & Food Outlets Management",
  description:
    "A powerful, easy-to-use POS designed for modern restaurants, cafes, bars, and cloud kitchens.",
};

export default function PosPage() {
  const images = useSiteImages("pos", DEFAULT_IMAGES);

  return (
    <>
      <ProductHero
        theme="gold"
        breadcrumb={[
          { label: "Home", to: ROUTES.home },
          { label: "Solutions" },
          { label: "POS" },
        ]}
        eyebrow={{
          icon: "utensils",
          tag: "POS",
          text: "Complete Restaurant Management System",
        }}
        title={[
          "Run Your",
          "Restaurant",
          "Smarter with",
          [{ text: "HotelOS POS", accent: true }],
        ]}
        description="A powerful, easy-to-use POS designed for modern restaurants, cafes, bars and cloud kitchens."
        primaryCta={{ label: "Request a Demo", to: ROUTES.requestDemo }}
        checks={[
          "Fast & Easy Billing",
          "Trusted by 1000+ Restaurants",
          "Works Online & Offline",
        ]}
        slides={images.heroSlides}
        slideLabel="POS hero image"
      />

      <FeatureStrip items={STRIP_ITEMS} />

      <div className="py-6">
        {SECTIONS.map((section, index) => (
          <FeatureSection
            key={section.id}
            theme="gold"
            id={section.id}
            label={section.label}
            title={section.title}
            description={section.description}
            items={section.items}
            image={{ src: images[section.imageKey], label: section.title }}
            imageSide={index % 2 === 0 ? "right" : "left"}
          />
        ))}
      </div>

      <CtaBanner
        theme="gold"
        title="Transform Your Restaurant Operations with HotelOS POS"
        description="Join hundreds of restaurants already growing with HotelOS."
        primaryCta={{ label: "Request a Demo", to: ROUTES.requestDemo }}
        secondaryCta={{ label: "Contact Sales", to: ROUTES.requestDemo }}
        perks={CTA_PERKS}
        backgroundSrc={images.ctaBackground}
        backgroundLabel="Restaurant background"
      />
    </>
  );
}

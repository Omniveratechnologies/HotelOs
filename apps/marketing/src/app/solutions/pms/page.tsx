import type { Metadata } from "next";
import CtaBanner from "@/components/marketing/CtaBanner";
import FeatureSection from "@/components/marketing/FeatureSection";
import FeatureStrip from "@/components/marketing/FeatureStrip";
import LogoCarousel from "@/components/marketing/LogoCarousel";
import ProductHero from "@/components/marketing/ProductHero";
import { ROUTES } from "@/data/siteContent";
import useSiteImages from "@/hooks/useSiteImages";
import FeatureCardGrid from "./_components/FeatureCardGrid";
import {
  CTA_PERKS,
  DEFAULT_IMAGES,
  FEATURE_CARDS,
  SECTIONS,
  STRIP_ITEMS,
} from "./_data/pmsData";

export const metadata: Metadata = {
  title: "HotelOS PMS - Complete Property Management System",
  description:
    "Manage reservations, rooms, guests, staff, and operations all in one powerful platform.",
};

export default function PmsPage() {
  const images = useSiteImages("pms", DEFAULT_IMAGES);

  return (
    <>
      <ProductHero
        theme="gold"
        breadcrumb={[
          { label: "Home", to: ROUTES.home },
          { label: "Solutions" },
          { label: "PMS" },
        ]}
        eyebrow={{
          icon: "bed",
          tag: "PMS",
          text: "Complete Property Management System",
        }}
        title={[
          "Run Your Hotel",
          "Smarter with",
          [{ text: "HotelOS PMS", accent: true }],
        ]}
        description="Manage reservations, rooms, guests, staff and operations — all in one powerful platform."
        primaryCta={{ label: "Request a Demo", to: ROUTES.requestDemo }}
        checks={[
          "All-in-One Platform",
          "Trusted by Hotels",
          "Scalable for Any Size",
        ]}
        slides={images.heroSlides}
        slideLabel="PMS hero image"
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
            imageSide={index % 2 === 0 ? "left" : "right"}
          />
        ))}
      </div>

      <LogoCarousel
        className="bg-[#fbf6ec]"
        title="Integrated With Leading OTAs"
        subtitle="Sync your inventory and rates with multiple travel platforms."
        logos={images.otaLogos}
      />

      <FeatureCardGrid
        theme="gold"
        title="Everything Your Hotel Needs"
        subtitle="A complete PMS with powerful features to simplify your operations."
        items={FEATURE_CARDS}
      />

      <CtaBanner
        theme="gold"
        title="Transform Your Hotel Operations with HotelOS PMS"
        description="Join hundreds of hotels already running smarter with HotelOS."
        primaryCta={{ label: "Request a Demo", to: ROUTES.requestDemo }}
        secondaryCta={{ label: "Contact Sales", to: ROUTES.requestDemo }}
        perks={CTA_PERKS}
        backgroundSrc={images.ctaBackground}
        backgroundLabel="Hotel background"
      />
    </>
  );
}

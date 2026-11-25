import type { Metadata } from "next";
import CtaBanner from "@/components/marketing/CtaBanner";
import FeatureSection from "@/components/marketing/FeatureSection";
import FeatureStrip from "@/components/marketing/FeatureStrip";
import LogoCarousel from "@/components/marketing/LogoCarousel";
import ProductHero from "@/components/marketing/ProductHero";
import { ROUTES } from "@/data/siteContent";
import useSiteImages from "@/hooks/useSiteImages";
import {
  CTA_PERKS,
  DEFAULT_IMAGES,
  SECTIONS,
  STRIP_ITEMS,
} from "./_data/nexusPmsData";

export const metadata: Metadata = {
  title: "Nexus PMS - Advanced Hotel Property Management System",
  description:
    "Manage rooms, reservations, guests, staff, housekeeping, billing and reports — all from one unified platform.",
};

export default function NexusPmsPage() {
  const images = useSiteImages("nexus-pms", DEFAULT_IMAGES);

  return (
    <>
      <ProductHero
        theme="rose"
        breadcrumb={[
          { label: "Home", to: ROUTES.home },
          { label: "Solutions" },
          { label: "X Factor", to: ROUTES.xFactor },
          { label: "Nexus PMS" },
        ]}
        eyebrow={{ icon: "xMark", tag: "X FACTOR", text: "NEXUS PMS" }}
        title={[[{ text: "Nexus " }, { text: "PMS", accent: true }]]}
        subtitle="Complete Hotel Property Management System for Modern Hospitality."
        description="Manage rooms, reservations, guests, staff, housekeeping, billing and reports — all from one unified platform. Built to simplify operations and maximize revenue for hotels, resorts and serviced apartments."
        primaryCta={{ label: "Request a Demo", to: ROUTES.requestDemo }}
        checks={[
          "All-in-One Platform",
          "Easy to Use",
          "Scalable for Any Size",
          "Trusted by 1000+ Hotels",
        ]}
        slides={images.heroSlides}
        slideLabel="Nexus PMS dashboard and mobile app"
        showControls={false}
      />

      <FeatureStrip items={STRIP_ITEMS} />

      <div className="py-6">
        {SECTIONS.map((section, index) => (
          <FeatureSection
            key={section.id}
            theme="rose"
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
        className="bg-rose-50/60"
        title="Integrates with Your Favorite OTAs & Tools"
        logos={images.integrationLogos}
      />

      <CtaBanner
        theme="rose"
        title="Take Your Hotel Operations to the Next Level with Nexus PMS"
        description="Get a personalized demo and see how Nexus PMS can increase your revenue and guest satisfaction."
        primaryCta={{ label: "Request a Demo", to: ROUTES.requestDemo }}
        secondaryCta={{ label: "Talk to Sales", to: ROUTES.requestDemo }}
        perks={CTA_PERKS}
        backgroundSrc={images.ctaBackground}
        backgroundLabel="Hotel background"
      />
    </>
  );
}

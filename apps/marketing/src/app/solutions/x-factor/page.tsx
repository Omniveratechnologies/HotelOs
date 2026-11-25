import type { Metadata } from "next";
import CtaBanner from "@/components/marketing/CtaBanner";
import FeatureStrip from "@/components/marketing/FeatureStrip";
import LogoCarousel from "@/components/marketing/LogoCarousel";
import ProductHero from "@/components/marketing/ProductHero";
import SectionHeading from "@/components/marketing/SectionHeading";
import { ROUTES } from "@/data/siteContent";
import useSiteImages from "@/hooks/useSiteImages";
import BenefitGrid from "./_components/BenefitGrid";
import EcosystemBand from "./_components/EcosystemBand";
import SolutionCard from "./_components/SolutionCard";
import {
  BENEFITS,
  DEFAULT_IMAGES,
  ECOSYSTEM_ITEMS,
  HERO_BADGES,
  STRIP_ITEMS,
} from "./_data/xFactorData";

export const metadata: Metadata = {
  title: "HotelOS X Factor - Complete Digital Ordering & Hospitality Suite",
  description:
    "Two powerful solutions under X Factor: Nexus POS for Restaurants and Nexus PMS for Hotels.",
};

export default function XFactorPage() {
  const images = useSiteImages("x-factor", DEFAULT_IMAGES);

  return (
    <>
      <ProductHero
        theme="rose"
        eyebrow={{
          icon: "xMark",
          tag: "X FACTOR",
          text: "Complete Digital Ordering & Management Solution",
        }}
        title={[
          "Give a",
          [{ text: "X Factor", accent: true }],
          "to Your Business.",
        ]}
        description="Two powerful solutions under X Factor — Nexus POS for Restaurants & Nexus PMS for Hotels. Seamless operations, higher revenue and better guest experiences."
        primaryCta={{ label: "Request a Demo", to: ROUTES.requestDemo }}
        checks={[
          "All-in-One Platform",
          "Easy to Use",
          "Trusted by 1000+ Businesses",
        ]}
        slides={images.heroSlides}
        slideLabel="X Factor hero image"
        badges={HERO_BADGES}
      />

      <FeatureStrip items={STRIP_ITEMS} />

      <section className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10">
        <SectionHeading
          theme="rose"
          title={[
            { text: "Two Powerful Solutions Under " },
            { text: "X Factor", accent: true },
          ]}
          subtitle="Choose the solution that fits your business or get both for a complete hospitality ecosystem."
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <SolutionCard
            tone="rose"
            icon="utensils"
            title="Nexus POS"
            subtitle="Smart Restaurant POS for Modern Businesses."
            description="End-to-end restaurant management with billing, menu, KOT, inventory and online ordering — built to increase your revenue and simplify operations."
            items={[
              "Billing & Orders (Dine-in, Takeaway, Delivery)",
              "Menu Management",
              "Table Management & KOT",
              "Kitchen Display System (KDS)",
              "Inventory & Stock Management",
              "Online Ordering (Zomato, Swiggy, Website)",
              "Payments & Integrations",
              "Reports & Analytics",
            ]}
            cta={{ label: "Explore Nexus POS", to: ROUTES.pos }}
            image={{ src: images.nexusPosDevice, label: "Nexus POS device" }}
          />

          <SolutionCard
            tone="blue"
            icon="bed"
            title="Nexus PMS"
            subtitle="Complete Hotel Property Management System."
            description="Manage rooms, reservations, guests and staff with a powerful and easy-to-use PMS designed for modern hotels and resorts."
            items={[
              "Reservations & Booking Engine",
              "Front Desk & Check-in/Check-out",
              "Room & Rate Management",
              "Housekeeping & Maintenance",
              "Guest Management (CRM)",
              "Multi-Property Support",
              "Invoicing & Billing",
              "Reports & Analytics",
            ]}
            cta={{ label: "Explore Nexus PMS", to: ROUTES.nexusPms }}
            image={{ src: images.nexusPmsDevice, label: "Nexus PMS dashboard" }}
          />
        </div>
      </section>

      <EcosystemBand
        title="A Complete Ecosystem for Your Hospitality Business"
        description="Run your restaurant and hotel operations under one platform and unlock more growth."
        items={ECOSYSTEM_ITEMS}
        backgroundSrc={images.ecosystemBackground}
        backgroundLabel="Restaurant background"
      />

      <BenefitGrid
        theme="rose"
        title={[
          { text: "Why Choose " },
          { text: "X Factor", accent: true },
          { text: "?" },
        ]}
        subtitle="Built to simplify operations, increase revenue and deliver exceptional experiences."
        items={BENEFITS}
      />

      <LogoCarousel
        title="Trusted by Leading Hospitality Brands"
        logos={images.brandLogos}
      />

      <CtaBanner
        theme="rose"
        title={[
          { text: "Transform Your Hospitality Business with " },
          { text: "X Factor", accent: true },
        ]}
        description="Get a personalized demo and see how Nexus POS & Nexus PMS can help you grow."
        primaryCta={{ label: "Request a Demo", to: ROUTES.requestDemo }}
        secondaryCta={{ label: "Contact Sales", to: ROUTES.requestDemo }}
        sideImage={{ src: images.ctaDevices, label: "Kiosk and tablet" }}
        backgroundSrc={images.ctaBackground}
        backgroundLabel="Restaurant background"
      />
    </>
  );
}

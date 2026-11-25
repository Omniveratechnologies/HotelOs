import type { Metadata } from "next";
import CtaBanner from "@/components/marketing/CtaBanner";
import SectionHeading from "@/components/marketing/SectionHeading";
import { ROUTES } from "@/data/siteContent";
import useSiteImages from "@/hooks/useSiteImages";
import ComparisonTable from "./_components/ComparisonTable";
import CustomPricingSection from "./_components/CustomPricingSection";
import FaqAccordion from "./_components/FaqAccordion";
import PricingHero from "./_components/PricingHero";
import PricingPlanCard from "./_components/PricingPlanCard";
import {
  COMPARISON_COLUMNS,
  COMPARISON_ROWS,
  CUSTOM_POINTS,
  DEFAULT_IMAGES,
  FAQ_ITEMS,
  HERO_BADGES,
  PMS_FEATURES,
  POS_FEATURES,
} from "./_data/pricingData";

export const metadata: Metadata = {
  title: "Pricing Plans - HotelOS & Nexus Solutions",
  description:
    "Transparent pricing for hotels and restaurants. Fixed plans with all features included or custom packages tailored to your scale.",
};

export default function PricingPage() {
  const images = useSiteImages("pricing", DEFAULT_IMAGES);

  return (
    <>
      <PricingHero
        tag="Pricing"
        title={[
          { text: "Simple Plans." },
          { text: "Complete Hospitality", accent: true },
          { text: "Solutions." },
        ]}
        description="Choose the right solution for your hotel or restaurant. Transparent pricing, no hidden charges."
        badges={HERO_BADGES}
        image={{
          src: images.hero,
          label: "Dashboard and POS on laptop, tablet and phone",
        }}
      />

      <section className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10">
        <SectionHeading
          theme="gold"
          title="Our Products & Pricing"
          subtitle="All plans include full features. Choose the product that fits your business."
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <PricingPlanCard
            tone="blue"
            icon="bed"
            title="HotelOS PMS"
            tag="Fixed Pricing"
            description="Complete hotel property management system with all features included."
            price={{
              currency: "₹",
              amount: "4,999",
              unit: "/ property / month",
            }}
            note="All features included • No hidden charges"
            features={PMS_FEATURES}
            cta={{ label: "Get Started", to: ROUTES.requestDemo }}
          />
          <PricingPlanCard
            tone="gold"
            icon="utensils"
            title="HotelOS POS"
            tag="Fixed Pricing"
            description="Complete restaurant POS system with all features included."
            price={{ currency: "₹", amount: "2,999", unit: "/ outlet / month" }}
            note="All features included • No hidden charges"
            features={POS_FEATURES}
            cta={{ label: "Get Started", to: ROUTES.requestDemo }}
          />
        </div>
      </section>

      <CustomPricingSection
        chip="X Factor"
        title="Nexus POS & Nexus PMS"
        subtitle="Flexible pricing based on your business needs."
        description="Nexus POS and Nexus PMS come under X Factor. Get a custom quote based on your requirements, number of outlets / properties and integrations."
        points={CUSTOM_POINTS}
        cta={{ label: "Request Custom Quote", to: ROUTES.requestDemo }}
        cards={[
          {
            icon: "utensils",
            title: "Nexus POS",
            tag: "Custom Pricing",
            description: "Smart restaurant POS for modern businesses.",
            image: { src: images.nexusPos, label: "Nexus POS" },
            cta: { label: "Get Custom Quote", to: ROUTES.requestDemo },
          },
          {
            icon: "bed",
            title: "Nexus PMS",
            tag: "Custom Pricing",
            description: "Advanced hotel PMS for growing properties.",
            image: { src: images.nexusPms, label: "Nexus PMS" },
            cta: { label: "Get Custom Quote", to: ROUTES.requestDemo },
          },
        ]}
      />

      <ComparisonTable
        title="Quick Comparison"
        subtitle="Find the right product for your hotel or restaurant."
        columns={COMPARISON_COLUMNS}
        rows={COMPARISON_ROWS}
      />

      <FaqAccordion title="Frequently Asked Questions" items={FAQ_ITEMS} />

      <CtaBanner
        theme="gold"
        showBackground={false}
        title="Not sure which plan is right for you?"
        description="Talk to our team and get a personalized recommendation."
        primaryCta={{ label: "Request a Demo", to: ROUTES.requestDemo }}
        secondaryCta={{ label: "Contact Sales", to: ROUTES.requestDemo }}
        checks={["Free Consultation", "Custom Pricing", "Dedicated Support"]}
      />
    </>
  );
}

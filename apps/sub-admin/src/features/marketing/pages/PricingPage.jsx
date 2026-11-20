import ComparisonTable from "../components/ComparisonTable.jsx";
import CtaBanner from "../components/CtaBanner.jsx";
import CustomPricingSection from "../components/CustomPricingSection.jsx";
import FaqAccordion from "../components/FaqAccordion.jsx";
import PricingHero from "../components/PricingHero.jsx";
import PricingPlanCard from "../components/PricingPlanCard.jsx";
import SectionHeading from "../components/SectionHeading.jsx";
import { ROUTES } from "../data/siteContent.js";
import useSiteImages from "../hooks/useSiteImages.js";

/**
 * Image URLs for this page. Leave empty for now (placeholders are shown).
 * Later the backend supplies these through useSiteImages.
 */
const DEFAULT_IMAGES = {
  hero: "",
  nexusPos: "",
  nexusPms: "",
};

const HERO_BADGES = [
  { icon: "layers", label: "All Features\nIncluded" },
  { icon: "checkCircle", label: "No Hidden\nCharges" },
  { icon: "headset", label: "Setup &\nOnboarding Support" },
];

const PMS_FEATURES = [
  "Reservations & Booking Engine",
  "Billing & Invoicing",
  "Front Desk & Check-in/out",
  "Reports & Analytics",
  "Room Management",
  "Multi-staff Access",
  "Housekeeping & Maintenance",
  "OTA Integrations",
  "Guest Management (CRM)",
  "24/7 Support",
];

const POS_FEATURES = [
  "Billing & Orders (Dine-in, Takeaway, Delivery)",
  "Reports & Analytics",
  "Menu Management",
  "Online Ordering Integration",
  "Table Management & KOT",
  "Payment Integrations",
  "Inventory Management",
  "Staff Management",
  "Customer Management",
  "24/7 Support",
];

const CUSTOM_POINTS = [
  "All core features included",
  "Tailored to your business size",
  "Integrations as per requirement",
  "Dedicated onboarding & support",
];

const COMPARISON_COLUMNS = [
  { title: "HotelOS PMS", note: "(Fixed)", kind: "fixed" },
  { title: "HotelOS POS", note: "(Fixed)", kind: "fixed" },
  { title: "Nexus POS", note: "(Custom)", kind: "custom" },
  { title: "Nexus PMS", note: "(Custom)", kind: "custom" },
];

const COMPARISON_ROWS = [
  {
    label: "Pricing Type",
    values: ["Fixed", "Fixed", "Custom", "Custom"],
  },
  {
    label: "All Features Included",
    values: [true, true, true, true],
  },
  {
    label: "Best For",
    values: [
      "Hotels / Resorts",
      "Restaurants / Cafés",
      "Restaurants (Any Size)",
      "Hotels (Any Size)",
    ],
  },
  {
    label: "Custom Integrations",
    values: [false, false, true, true],
  },
  {
    label: "Scalable for Multiple Locations",
    values: [false, false, true, true],
  },
];

// Demo answers: the design only shows the questions. Replace with approved text.
const FAQ_ITEMS = [
  {
    question: "What is the difference between HotelOS and Nexus?",
    answer:
      "HotelOS PMS and HotelOS POS have simple fixed pricing with all features included. Nexus POS and Nexus PMS (X Factor) are custom-priced and tailored to your business size, the number of outlets or properties, and the integrations you need.",
  },
  {
    question: "Is there any installation or setup fee?",
    answer:
      "Setup and onboarding support are part of every plan, and there are no hidden charges. If you need anything extra, we will tell you upfront in your quote.",
  },
  {
    question: "Are all features included in the fixed plans?",
    answer:
      "Yes. Every feature of HotelOS PMS and HotelOS POS is included in the fixed monthly price, with no feature-based tiers.",
  },
  {
    question: "Can I use both PMS and POS together?",
    answer:
      "Yes. The PMS and POS work together, so room charges and restaurant bills stay in one connected system. Talk to our team to put the right combination together.",
  },
  {
    question: "Can I upgrade from Nexus to HotelOS later?",
    answer:
      "Yes. You can change plans as your business changes, and our team will help you move your data across.",
  },
  {
    question: "Do you provide hardware as well?",
    answer:
      "Yes. We offer POS terminals, printers, scanners, kiosks and more, all designed to work with HotelOS software. See the Management Suite page for the full hardware range.",
  },
];

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

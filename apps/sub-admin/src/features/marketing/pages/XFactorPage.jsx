import BenefitGrid from "../components/BenefitGrid.jsx";
import CtaBanner from "../components/CtaBanner.jsx";
import EcosystemBand from "../components/EcosystemBand.jsx";
import FeatureStrip from "../components/FeatureStrip.jsx";
import LogoCarousel from "../components/LogoCarousel.jsx";
import ProductHero from "../components/ProductHero.jsx";
import SectionHeading from "../components/SectionHeading.jsx";
import SolutionCard from "../components/SolutionCard.jsx";
import { ROUTES } from "../data/siteContent.js";
import useSiteImages from "../hooks/useSiteImages.js";

/**
 * Image URLs for this page. Leave empty for now (placeholders are shown).
 * Later the backend (Cloudinary, managed from the admin dashboard) supplies
 * these through useSiteImages.
 */
const DEFAULT_IMAGES = {
  heroSlides: ["", "", ""],
  nexusPosDevice: "",
  nexusPmsDevice: "",
  ecosystemBackground: "",
  ctaBackground: "",
  ctaDevices: "",
  brandLogos: [
    { name: "Zomato", src: "" },
    { name: "Swiggy", src: "" },
    { name: "MakeMyTrip", src: "" },
    { name: "Booking.com", src: "" },
    { name: "Agoda", src: "" },
    { name: "Airbnb", src: "" },
    { name: "Expedia", src: "" },
  ],
};

const HERO_BADGES = [
  {
    icon: "utensils",
    title: "Nexus POS",
    subtitle: "Restaurant POS & Ordering",
    position: "top-left",
  },
  {
    icon: "bed",
    title: "Nexus PMS",
    subtitle: "Hotel Property Management",
    position: "top-right",
  },
];

const STRIP_ITEMS = [
  { icon: "qr", label: "QR & Table Ordering" },
  { icon: "kiosk", label: "Self-Ordering Kiosks" },
  { icon: "tablet", label: "Restaurant POS" },
  { icon: "bed", label: "Hotel PMS" },
  { icon: "cart", label: "Online Ordering" },
  { icon: "tag", label: "Menu & Offer Management" },
  { icon: "barChart", label: "Reports & Analytics" },
  { icon: "puzzle", label: "Integrations" },
];

const ECOSYSTEM_ITEMS = [
  { icon: "utensils", label: "Nexus POS", tone: "rose" },
  { icon: "bed", label: "Nexus PMS", tone: "blue" },
  { icon: "kiosk", label: "Table Kiosk Menu" },
  { icon: "cart", label: "Online Ordering" },
  { icon: "barChart", label: "Analytics & Reports" },
];

const BENEFITS = [
  {
    icon: "layers",
    title: "All-in-One Platform",
    description: "POS, PMS, digital ordering and more — in one place.",
  },
  {
    icon: "barChart",
    title: "Increase Revenue",
    description: "Smart automation and upselling tools to boost sales.",
  },
  {
    icon: "star",
    title: "Better Guest Experience",
    description: "Seamless and fast service for your customers.",
    tone: "orange",
  },
  {
    icon: "cursor",
    title: "Easy to Use",
    description: "Simple and intuitive interface for your team.",
  },
  {
    icon: "trendUp",
    title: "Scalable for Any Size",
    description: "From single outlet to multi-property chains.",
  },
  {
    icon: "headset",
    title: "24/7 Support",
    description: "Always here to help you grow.",
  },
];

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
            cta={{ label: "Explore Nexus POS", to: ROUTES.nexusPos }}
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

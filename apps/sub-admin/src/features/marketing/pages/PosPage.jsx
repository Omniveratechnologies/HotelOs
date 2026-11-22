import CtaBanner from "../components/CtaBanner.jsx";
import FeatureSection from "../components/FeatureSection.jsx";
import FeatureStrip from "../components/FeatureStrip.jsx";
import ProductHero from "../components/ProductHero.jsx";
import { ROUTES } from "../data/siteContent.js";
import useSiteImages from "../hooks/useSiteImages.js";

/**
 * Image URLs for this page. Leave empty for now (placeholders are shown).
 * Later the backend (Cloudinary, managed from the admin dashboard) supplies
 * these through useSiteImages.
 */
const DEFAULT_IMAGES = {
  heroSlides: ["", "", ""],
  billing: "",
  menu: "",
  tables: "",
  kot: "",
  inventory: "",
  payments: "",
  reports: "",
  ctaBackground: "",
};

const STRIP_ITEMS = [
  { icon: "receipt", label: "Billing & Orders" },
  { icon: "utensils", label: "Menu Management" },
  { icon: "table", label: "Table Management" },
  { icon: "monitor", label: "KOT & Kitchen Display" },
  { icon: "box", label: "Inventory Management" },
  { icon: "card", label: "Payments & Integrations" },
  { icon: "barChart", label: "Reports & Analytics" },
];

const SECTIONS = [
  {
    id: "billing",
    imageKey: "billing",
    label: "Billing & Orders",
    title: "Fast & Smart Billing",
    description:
      "Create bills in seconds with an intuitive and user-friendly interface.",
    items: [
      "Dine-in, Takeaway, Delivery & Online orders",
      "Quick item search & custom modifiers",
      "Split bills & multiple payment methods",
      "Supports KOT and live kitchen updates",
    ],
  },
  {
    id: "menu",
    imageKey: "menu",
    label: "Menu Management",
    title: "Digital Menu Management",
    description:
      "Easily manage your menu, categories, variants and pricing from one place.",
    items: [
      "Add / edit items with images",
      "Manage categories & sub-categories",
      "Create combos & meal deals",
      "Set different prices (dine-in / online / takeaway)",
    ],
  },
  {
    id: "tables",
    imageKey: "tables",
    label: "Table Management",
    title: "Visual Table Management",
    description:
      "Get a real-time view of your restaurant with an easy-to-use floor plan.",
    items: [
      "Live table status (free, occupied, reserved)",
      "Drag & drop table management",
      "Merge or split tables",
      "Table-wise order tracking",
    ],
  },
  {
    id: "kot",
    imageKey: "kot",
    label: "KOT & Kitchen Display",
    title: "KOT & Kitchen Display",
    description:
      "Streamline kitchen operations with real-time order management.",
    items: [
      "Instant KOT generation",
      "Live order tracking",
      "Separate KOT for different sections",
      "Works with kitchen display system (KDS)",
    ],
  },
  {
    id: "inventory",
    imageKey: "inventory",
    label: "Inventory Management",
    title: "Track Your Inventory",
    description:
      "Never run out of stock and reduce food waste with smart inventory tracking.",
    items: [
      "Real-time stock updates",
      "Low stock alerts",
      "Recipe and ingredient mapping",
      "Usage reports & cost tracking",
    ],
  },
  {
    id: "payments",
    imageKey: "payments",
    label: "Payments & Integrations",
    title: "Multiple Payment Options",
    description:
      "Accept payments through various methods and integrate with online platforms.",
    items: [
      "UPI, Cards, Wallets, Cash",
      "Integrates with Zomato, Swiggy, Online Ordering",
      "Supports GST billing & e-Invoicing",
      "Works with POS hardware (printer, scanner, etc.)",
    ],
  },
  {
    id: "reports",
    imageKey: "reports",
    label: "Reports & Analytics",
    title: "Data-Driven Growth",
    description: "Get detailed insights into your restaurant's performance.",
    items: [
      "Sales & revenue reports",
      "Best selling items",
      "Inventory usage reports",
      "Staff performance",
      "Custom date range & export options",
    ],
  },
];

const CTA_PERKS = [
  { icon: "zap", label: "Faster Service" },
  { icon: "trendUp", label: "Higher Revenue" },
  { icon: "star", label: "Better Guest Experience" },
  { icon: "shield", label: "Complete Control" },
];

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

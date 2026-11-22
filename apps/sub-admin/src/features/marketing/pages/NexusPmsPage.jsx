import CtaBanner from "../components/CtaBanner.jsx";
import FeatureSection from "../components/FeatureSection.jsx";
import FeatureStrip from "../components/FeatureStrip.jsx";
import LogoCarousel from "../components/LogoCarousel.jsx";
import ProductHero from "../components/ProductHero.jsx";
import { ROUTES } from "../data/siteContent.js";
import useSiteImages from "../hooks/useSiteImages.js";

/**
 * Image URLs for this page. Leave empty for now (placeholders are shown).
 * Later the backend (Cloudinary, managed from the admin dashboard) supplies
 * these through useSiteImages.
 */
const DEFAULT_IMAGES = {
  heroSlides: [""],
  reservations: "",
  frontDesk: "",
  housekeeping: "",
  guests: "",
  billing: "",
  reports: "",
  ctaBackground: "",
  integrationLogos: [
    { name: "Booking.com", src: "" },
    { name: "Agoda", src: "" },
    { name: "Expedia", src: "" },
    { name: "Airbnb", src: "" },
    { name: "MakeMyTrip", src: "" },
    { name: "Google Hotel Ads", src: "" },
    { name: "SiteMinder", src: "" },
  ],
};

const STRIP_ITEMS = [
  { icon: "calendar", label: "Reservations & Booking Engine" },
  { icon: "userCheck", label: "Front Desk Operations" },
  { icon: "door", label: "Room Management" },
  { icon: "broom", label: "Housekeeping & Maintenance" },
  { icon: "users", label: "Guest Management (CRM)" },
  { icon: "fileText", label: "Billing & Invoicing" },
  { icon: "barChart", label: "Reports & Analytics" },
];

const SECTIONS = [
  {
    id: "reservations",
    imageKey: "reservations",
    label: "Reservations & Booking Engine",
    title: "Seamless Reservations, Higher Occupancy",
    description:
      "Manage direct, OTA and walk-in bookings from a single platform. Real-time availability, dynamic pricing and channel manager integration help you maximize revenue.",
    items: [
      "Direct booking engine (website integration)",
      "OTA channel manager (Booking.com, Agoda, Expedia, etc.)",
      "Dynamic pricing & rate plans",
      "Group bookings & corporate rates",
      "Real-time availability across all channels",
    ],
  },
  {
    id: "front-desk",
    imageKey: "frontDesk",
    label: "Front Desk Operations",
    title: "Faster Check-in, Better Guest Experience",
    description:
      "Streamline front desk operations with a simple and intuitive interface. Handle check-ins, check-outs, walk-ins and reservations in seconds.",
    items: [
      "Quick check-in/check-out",
      "Guest profile & history",
      "Room assignment & upgrades",
      "Identity proof & KYC",
      "Integrated billing and payments",
    ],
  },
  {
    id: "housekeeping",
    imageKey: "housekeeping",
    label: "Housekeeping & Maintenance",
    title: "Keep Your Property in Top Shape",
    description:
      "Efficiently manage housekeeping tasks, maintenance requests and room status in real-time.",
    items: [
      "Real-time room status (clean, dirty, in-service, etc.)",
      "Task assignment to staff",
      "Maintenance request tracking",
      "Lost & found management",
      "Minimize turnaround time",
    ],
  },
  {
    id: "guests",
    imageKey: "guests",
    label: "Guest Management (CRM)",
    title: "Build Long-Lasting Guest Relationships",
    description:
      "Maintain detailed guest profiles, track preferences and create personalized experiences to increase repeat bookings.",
    items: [
      "Guest profiles & stay history",
      "Preferences and special requests",
      "Loyalty program & member management",
      "Email & WhatsApp engagement",
      "Feedback and review management",
    ],
  },
  {
    id: "billing",
    imageKey: "billing",
    label: "Billing & Invoicing",
    title: "Flexible Billing & Multiple Payment Options",
    description:
      "Generate detailed invoices, split bills, apply discounts and accept multiple payment methods — all in one place.",
    items: [
      "Room, F&B and other services billing",
      "Split bills (room, restaurant, spa, etc.)",
      "Multiple payment methods (cash, card, UPI, wallet)",
      "POS integration for restaurant & outlets",
      "GST-compliant invoices & e-invoicing",
    ],
  },
  {
    id: "reports",
    imageKey: "reports",
    label: "Reports & Analytics",
    title: "Data-Driven Decisions for Higher Revenue",
    description:
      "Get detailed insights into occupancy, revenue, guest trends and operational performance.",
    items: [
      "Occupancy, ADR, RevPAR reports",
      "Booking source analysis",
      "Revenue & profit reports",
      "Guest demographics & repeat rate",
      "Custom reports and export to Excel/PDF",
    ],
  },
];

const CTA_PERKS = [
  { icon: "building", label: "Higher Occupancy" },
  { icon: "trendUp", label: "Increased Revenue" },
  { icon: "star", label: "Better Guest Experience" },
  { icon: "layers", label: "Seamless Operations" },
];

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

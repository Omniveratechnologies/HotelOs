import CtaBanner from "../components/CtaBanner.jsx";
import FeatureCardGrid from "../components/FeatureCardGrid.jsx";
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
  heroSlides: ["", "", ""],
  booking: "",
  frontDesk: "",
  housekeeping: "",
  guests: "",
  reports: "",
  ctaBackground: "",
  otaLogos: [
    { name: "MakeMyTrip", src: "" },
    { name: "Goibibo", src: "" },
    { name: "Booking.com", src: "" },
    { name: "Agoda", src: "" },
    { name: "Expedia", src: "" },
    { name: "Airbnb", src: "" },
  ],
};

const STRIP_ITEMS = [
  { icon: "calendar", label: "Reservations & Booking Engine" },
  { icon: "bell", label: "Front Desk Operations" },
  { icon: "bed", label: "Room Management" },
  { icon: "broom", label: "Housekeeping & Maintenance" },
  { icon: "users", label: "Guest Management" },
  { icon: "barChart", label: "Reports & Analytics" },
];

const SECTIONS = [
  {
    id: "reservations",
    imageKey: "booking",
    label: "Reservations",
    title: "Powerful Booking Engine",
    description:
      "Manage direct bookings, walk-ins and OTA reservations from a single calendar. Avoid overbookings and maximize occupancy.",
    items: [
      "Real-time availability",
      "Sync with OTAs (MMT, Goibibo, Booking.com etc.)",
      "Custom rates and seasonal pricing",
      "Group and corporate bookings",
    ],
  },
  {
    id: "front-desk",
    imageKey: "frontDesk",
    label: "Front Desk",
    title: "Faster Check-in & Check-out",
    description:
      "Streamline front desk operations with a simple and intuitive interface. Reduce waiting time and deliver a smooth guest experience.",
    items: [
      "Quick check-in/check-out",
      "Digital registration & ID capture",
      "Room key management",
      "Guest history and preferences",
    ],
  },
  {
    id: "housekeeping",
    imageKey: "housekeeping",
    label: "Housekeeping",
    title: "Efficient Housekeeping",
    description:
      "Assign tasks, track status and ensure every room is ready for the next guest.",
    items: [
      "Task assignment and tracking",
      "Real-time room status updates",
      "Maintenance request management",
      "Staff performance monitoring",
    ],
  },
  {
    id: "guests",
    imageKey: "guests",
    label: "Guest Management",
    title: "Build Stronger Guest Relationships",
    description:
      "Keep all guest information in one place and deliver personalized experiences.",
    items: [
      "Guest profiles and history",
      "Loyalty and membership programs",
      "Personalized offers",
      "Feedback and review management",
    ],
  },
  {
    id: "reports",
    imageKey: "reports",
    label: "Reports & Analytics",
    title: "Data-Driven Decisions",
    description:
      "Get real-time insights into your hotel's performance and make smarter decisions.",
    items: [
      "Occupancy, ADR, RevPAR reports",
      "Revenue and booking trends",
      "Source-wise and channel-wise reports",
      "Custom reports and export options",
    ],
  },
];

const FEATURE_CARDS = [
  { icon: "building", label: "Multi-Property Support" },
  { icon: "network", label: "Channel Manager" },
  { icon: "tag", label: "Custom Rate Plans" },
  { icon: "fileText", label: "Invoicing & Billing" },
  { icon: "users", label: "Staff Management" },
  { icon: "box", label: "Inventory & Amenities" },
  { icon: "wrench", label: "Maintenance Tracking" },
  { icon: "smartphone", label: "Mobile Access" },
];

const CTA_PERKS = [
  {
    icon: "barChart",
    label: "Better Operations\nHappier Guests\nHigher Revenue",
  },
];

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

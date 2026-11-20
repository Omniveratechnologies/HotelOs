import { useCallback, useState } from "react";

import ConnectedSystem from "../components/ConnectedSystem.jsx";
import CtaBanner from "../components/CtaBanner.jsx";
import FeatureStrip from "../components/FeatureStrip.jsx";
import HardwareGrid from "../components/HardwareGrid.jsx";
import HospitalityBand from "../components/HospitalityBand.jsx";
import ModuleShowcase from "../components/ModuleShowcase.jsx";
import ProductDetailsModal from "../components/ProductDetailsModal.jsx";
import ProductHero from "../components/ProductHero.jsx";
import SoftwareOnHardware from "../components/SoftwareOnHardware.jsx";
import { ROUTES } from "../data/siteContent.js";
import useSiteImages from "../hooks/useSiteImages.js";

/**
 * Image URLs for this page. Leave empty for now (placeholders are shown).
 * Later the backend (Cloudinary, managed from the admin dashboard) supplies
 * these through useSiteImages.
 */
const DEFAULT_IMAGES = {
  heroSlides: [""],
  hardware: {
    posTerminal: "",
    allInOnePc: "",
    handheldPos: "",
    receiptPrinter: "",
    barcodeScanner: "",
    cashDrawer: "",
    customerDisplay: "",
    checkInKiosk: "",
    menuDisplay: "",
    kitchenDisplay: "",
    operationsTablet: "",
    cardTerminal: "",
    doorLock: "",
  },
  // Gallery shown in the product details popup (blank until the backend supplies images).
  hardwareGallery: ["", "", "", "", ""],
  softwareOnHardware: {
    main: "",
    frontDesk: "",
    counter: "",
    kitchen: "",
    kiosk: "",
  },
  hospitalityBackground: "",
  ctaBackground: "",
};

const STRIP_ITEMS = [
  { icon: "building", label: "Hotel Management" },
  { icon: "utensils", label: "Restaurant POS" },
  { icon: "calendar", label: "Online Bookings" },
  { icon: "userCheck", label: "Guest Experience" },
  { icon: "card", label: "Integrated Payments" },
  { icon: "box", label: "Inventory & Purchase" },
  { icon: "barChart", label: "AI Reports & Analytics" },
  { icon: "headset", label: "Dedicated Support" },
];

const MODULES = [
  {
    icon: "bed",
    title: "Hotel PMS",
    description: "Reservations, check-in, room management",
  },
  {
    icon: "utensils",
    title: "Restaurant POS",
    description: "Billing, menu, orders, KOT & Inventory",
  },
  {
    icon: "network",
    title: "Booking & Channel Manager",
    description: "OTA Integrations",
  },
  {
    icon: "users",
    title: "Guest CRM",
    description: "Guest profiles, loyalty & communication",
  },
  {
    icon: "broom",
    title: "Housekeeping",
    description: "Task management & room status",
  },
  {
    icon: "monitor",
    title: "Kitchen Display",
    description: "Live kitchen orders & preparation",
  },
  {
    icon: "card",
    title: "Payments",
    description: "Multiple payment methods & settlements",
  },
  {
    icon: "barChart",
    title: "AI Reports",
    description: "Smart insights for better decisions",
  },
];

const HARDWARE = [
  {
    imageKey: "posTerminal",
    category: "POS & BILLING",
    title: "POS Terminal",
    description: "Fast & reliable billing for your restaurant",
  },
  {
    imageKey: "allInOnePc",
    category: "POS & BILLING",
    title: "Touchscreen All-in-One PC",
    description: "Elegant and powerful for front desk & POS",
  },
  {
    imageKey: "handheldPos",
    category: "POS & BILLING",
    title: "Handheld POS",
    description: "Take orders and bill anywhere",
  },
  {
    imageKey: "receiptPrinter",
    category: "PRINTING",
    title: "Thermal Receipt Printer",
    description: "High-speed printing for bills and receipts",
  },
  {
    imageKey: "barcodeScanner",
    category: "SCANNING",
    title: "Barcode Scanner",
    description: "Quick and accurate scanning",
  },
  {
    imageKey: "cashDrawer",
    category: "PAYMENTS",
    title: "Cash Drawer",
    description: "Secure and durable cash management",
  },
  {
    imageKey: "customerDisplay",
    category: "POS & BILLING",
    title: "Customer Display",
    description: "Show order details to your customers",
  },
  {
    imageKey: "checkInKiosk",
    category: "SELF SERVICE",
    title: "Self Check-in Kiosk",
    description: "Quick & easy guest check-in experience",
  },
  {
    imageKey: "menuDisplay",
    category: "SELF SERVICE",
    title: "Digital Menu Display",
    description: "Stunning menu display for your restaurant",
  },
  {
    imageKey: "kitchenDisplay",
    category: "KITCHEN DISPLAY",
    title: "Kitchen Display (KDS)",
    description: "Live kitchen orders and preparation",
  },
  {
    imageKey: "operationsTablet",
    category: "POS & BILLING",
    title: "Tablet for Operations",
    description: "Manage rooms, orders and tasks on the go",
  },
  {
    imageKey: "cardTerminal",
    category: "PAYMENTS",
    title: "Card Payment Terminal",
    description: "Support all major payment methods",
  },
  {
    imageKey: "doorLock",
    category: "SECURITY",
    title: "RFID Door Lock",
    description: "Secure and smart access for hotel rooms",
  },
];

// Demo content for the product details popup. Every product shows the same
// text for now (only the name, short line and tag change). When real data is
// ready, give each item in HARDWARE its own details and update buildProductDetails.
const DEMO_HIGHLIGHTS = [
  { icon: "zap", label: "Fast Performance" },
  { icon: "cursor", label: "Touch Interface" },
  { icon: "shield", label: "Durable Build" },
  { icon: "brand", label: "HotelOS Pre-installed" },
];

const DEMO_FEATURES = [
  "High-quality display and responsive performance",
  "Pre-installed with HotelOS software",
  "Works with dine-in, takeaway, delivery and bar orders",
  "Multiple payment method support (UPI, Cards, Cash)",
  "Withstands high-usage hospitality environments",
  "Easy setup and 24/7 technical support",
];

function buildProductDetails(item, gallery) {
  return {
    category: item.category,
    title: item.title,
    summary: item.description,
    description: `Our ${item.title} is designed specifically for the hospitality industry, offering a seamless experience with HotelOS software. Built for busy hotels, restaurants and bars, it is easy to set up and reliable in everyday use.`,
    highlights: DEMO_HIGHLIGHTS,
    features: DEMO_FEATURES,
    images: gallery,
  };
}

const SOFTWARE_POINTS = [
  "Pre-installed and ready to use",
  "Optimized for smooth performance",
  "Reliable hardware with long lifespan",
  "Seamless integration across all modules",
  "On-site setup and training support",
];

const DIAGRAM_NODES = [
  { icon: "bed", title: "Hotel PMS", subtitle: "Reservations, Rooms" },
  { icon: "utensils", title: "Restaurant POS", subtitle: "Billing, Orders" },
  { icon: "network", title: "Booking Engine", subtitle: "OTA Integrations" },
  { icon: "card", title: "Payments", subtitle: "Cards, UPI, Wallets" },
  { icon: "smartphone", title: "Guest App", subtitle: "Booking, Check-in" },
  { icon: "monitor", title: "Kitchen Display", subtitle: "Live Orders" },
  { icon: "receipt", title: "Printers", subtitle: "Bills, KOT, Labels" },
  { icon: "barChart", title: "AI Analytics", subtitle: "Reports & Insights" },
];

const BENEFITS = [
  "Single platform for all operations",
  "Real-time data across all modules",
  "Better guest experience",
  "Increased operational efficiency",
  "Higher revenue and lower costs",
];

const HOSPITALITY_CARDS = [
  {
    icon: "home",
    title: "Complete Solution",
    description: "Software and hardware from a single provider",
  },
  {
    icon: "shield",
    title: "Reliable Hardware",
    description: "Industry-grade devices, tested for hospitality",
  },
  {
    icon: "puzzle",
    title: "Seamless Integrations",
    description: "Works with OTAs, payment providers and more",
  },
  {
    icon: "headset",
    title: "Dedicated Support",
    description: "Setup, training and ongoing assistance",
  },
];

const CTA_STATS = [
  { value: "500+", label: "Happy Customers" },
  { value: "10,000+", label: "Rooms Managed" },
  { value: "99.9%", label: "Uptime" },
];

export default function ManagementSuitePage() {
  const images = useSiteImages("management-suite", DEFAULT_IMAGES);
  const showcase = images.softwareOnHardware;
  const [selectedHardware, setSelectedHardware] = useState(null);
  const closeDetails = useCallback(() => setSelectedHardware(null), []);

  return (
    <>
      <ProductHero
        theme="gold"
        eyebrow={{ tag: "MANAGEMENT SUITE" }}
        title={[
          "One Ecosystem.",
          "Every Hospitality",
          [{ text: "Operation.", accent: true }],
        ]}
        description="A complete ecosystem of software and hardware for hotels and restaurants — designed to work seamlessly together."
        primaryCta={{ label: "Request Demo", to: ROUTES.requestDemo }}
        secondaryCta={{ label: "Contact Sales", to: ROUTES.requestDemo }}
        checks={[
          "Hotels",
          "Restaurants",
          "Resorts",
          "Cloud Based",
          "Easy Setup",
        ]}
        slides={images.heroSlides}
        slideLabel="Management Suite hero image"
        showControls={false}
      />

      <FeatureStrip items={STRIP_ITEMS} />

      <ModuleShowcase
        label="All-in-One Platform"
        title="Everything Works Better Together"
        description="From guest bookings to restaurant billing, housekeeping to payments — all modules are connected in a single ecosystem to give you complete control."
        items={MODULES}
      />

      <HardwareGrid
        label="Hardware Ecosystem"
        title="Explore Our Hardware Range"
        description="A wide range of reliable and industry-grade hardware designed to work seamlessly with HotelOS software."
        ctaLabel="View All Hardware"
        items={HARDWARE}
        images={images.hardware}
        onViewDetails={setSelectedHardware}
      />

      <SoftwareOnHardware
        label="Software on Our Hardware"
        title="Your Software, Running on Our Hardware"
        description="Experience how HotelOS PMS, POS and other modules work seamlessly on our own hardware devices. Designed, tested and optimized to give you the best performance."
        points={SOFTWARE_POINTS}
        mainImage={{ src: showcase.main, label: "POS on the counter" }}
        thumbnails={[
          {
            src: showcase.frontDesk,
            title: "Hotel PMS",
            caption: "on Front Desk Terminal",
          },
          {
            src: showcase.counter,
            title: "Restaurant POS",
            caption: "at Counter",
          },
          {
            src: showcase.kitchen,
            title: "Kitchen Display (KDS)",
            caption: "in Kitchen",
          },
          {
            src: showcase.kiosk,
            title: "Self Check-in",
            caption: "Kiosk for Guests",
          },
        ]}
      />

      <ConnectedSystem
        label="Integrated Ecosystem"
        title="One Connected System"
        description="All modules and hardware work together in a unified ecosystem, giving you a seamless and efficient way to manage your entire hotel and restaurant operations."
        benefits={BENEFITS}
        nodes={DIAGRAM_NODES}
      />

      <HospitalityBand
        label="Built for Hospitality"
        title="Designed for Every Corner of Hospitality"
        description="Whether you run a hotel, restaurant, resort or multi-property chain, HotelOS gives you the complete tools and hardware to operate smarter and grow faster."
        cards={HOSPITALITY_CARDS}
        backgroundSrc={images.hospitalityBackground}
      />

      <CtaBanner
        theme="gold"
        eyebrow="Ready to transform your business?"
        title="Bring Your Hospitality Operations Together"
        description="Get a personalized demo and see how HotelOS can simplify your operations and increase your revenue."
        primaryCta={{ label: "Request a Demo", to: ROUTES.requestDemo }}
        secondaryCta={{ label: "Talk to Sales", to: ROUTES.requestDemo }}
        stats={CTA_STATS}
        backgroundSrc={images.ctaBackground}
        backgroundLabel="Restaurant background"
      />

      {selectedHardware && (
        <ProductDetailsModal
          key={selectedHardware.title}
          product={buildProductDetails(
            selectedHardware,
            images.hardwareGallery,
          )}
          onClose={closeDetails}
        />
      )}
    </>
  );
}

import type {
  ComparisonColumn,
  ComparisonRow,
  FaqItem,
} from "../_types/pricingTypes";

export const DEFAULT_IMAGES = {
  hero: "",
  nexusPos: "",
  nexusPms: "",
};

export const HERO_BADGES = [
  { icon: "layers" as const, label: "All Features\nIncluded" },
  { icon: "checkCircle" as const, label: "No Hidden\nCharges" },
  { icon: "headset" as const, label: "Setup &\nOnboarding Support" },
];

export const PMS_FEATURES = [
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

export const POS_FEATURES = [
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

export const CUSTOM_POINTS = [
  "All core features included",
  "Tailored to your business size",
  "Integrations as per requirement",
  "Dedicated onboarding & support",
];

export const COMPARISON_COLUMNS: ComparisonColumn[] = [
  { title: "HotelOS PMS", note: "(Fixed)", kind: "fixed" },
  { title: "HotelOS POS", note: "(Fixed)", kind: "fixed" },
  { title: "Nexus POS", note: "(Custom)", kind: "custom" },
  { title: "Nexus PMS", note: "(Custom)", kind: "custom" },
];

export const COMPARISON_ROWS: ComparisonRow[] = [
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

export const FAQ_ITEMS: FaqItem[] = [
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

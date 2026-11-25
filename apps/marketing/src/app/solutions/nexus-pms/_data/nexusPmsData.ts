import type { IconName } from "@/types/marketing";

export const DEFAULT_IMAGES = {
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

export const STRIP_ITEMS: Array<{ icon: IconName; label: string }> = [
  { icon: "calendar", label: "Reservations & Booking Engine" },
  { icon: "userCheck", label: "Front Desk Operations" },
  { icon: "door", label: "Room Management" },
  { icon: "broom", label: "Housekeeping & Maintenance" },
  { icon: "users", label: "Guest Management (CRM)" },
  { icon: "fileText", label: "Billing & Invoicing" },
  { icon: "barChart", label: "Reports & Analytics" },
];

export const SECTIONS = [
  {
    id: "reservations",
    imageKey: "reservations" as const,
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
    imageKey: "frontDesk" as const,
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
    imageKey: "housekeeping" as const,
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
    imageKey: "guests" as const,
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
    imageKey: "billing" as const,
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
    imageKey: "reports" as const,
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

export const CTA_PERKS: Array<{ icon: IconName; label: string }> = [
  { icon: "building", label: "Higher Occupancy" },
  { icon: "trendUp", label: "Increased Revenue" },
  { icon: "star", label: "Better Guest Experience" },
  { icon: "layers", label: "Seamless Operations" },
];

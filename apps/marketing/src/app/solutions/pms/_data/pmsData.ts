import type { IconName } from "@/types/marketing";

export const DEFAULT_IMAGES = {
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

export const STRIP_ITEMS: Array<{ icon: IconName; label: string }> = [
  { icon: "calendar", label: "Reservations & Booking Engine" },
  { icon: "bell", label: "Front Desk Operations" },
  { icon: "bed", label: "Room Management" },
  { icon: "broom", label: "Housekeeping & Maintenance" },
  { icon: "users", label: "Guest Management" },
  { icon: "barChart", label: "Reports & Analytics" },
];

export const SECTIONS = [
  {
    id: "reservations",
    imageKey: "booking" as const,
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
    imageKey: "frontDesk" as const,
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
    imageKey: "housekeeping" as const,
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
    imageKey: "guests" as const,
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
    imageKey: "reports" as const,
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

export const FEATURE_CARDS: Array<{ icon: IconName; label: string }> = [
  { icon: "building", label: "Multi-Property Support" },
  { icon: "network", label: "Channel Manager" },
  { icon: "tag", label: "Custom Rate Plans" },
  { icon: "fileText", label: "Invoicing & Billing" },
  { icon: "users", label: "Staff Management" },
  { icon: "box", label: "Inventory & Amenities" },
  { icon: "wrench", label: "Maintenance Tracking" },
  { icon: "smartphone", label: "Mobile Access" },
];

export const CTA_PERKS: Array<{ icon: IconName; label: string }> = [
  {
    icon: "barChart",
    label: "Better Operations\nHappier Guests\nHigher Revenue",
  },
];

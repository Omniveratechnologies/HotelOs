import type { HeroBadge, IconName } from "@/types/marketing";
import type { BenefitItem, EcosystemItem } from "../_types/xFactorTypes";

export const DEFAULT_IMAGES = {
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

export const HERO_BADGES: HeroBadge[] = [
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

export const STRIP_ITEMS: Array<{ icon: IconName; label: string }> = [
  { icon: "qr", label: "QR & Table Ordering" },
  { icon: "kiosk", label: "Self-Ordering Kiosks" },
  { icon: "tablet", label: "Restaurant POS" },
  { icon: "bed", label: "Hotel PMS" },
  { icon: "cart", label: "Online Ordering" },
  { icon: "tag", label: "Menu & Offer Management" },
  { icon: "barChart", label: "Reports & Analytics" },
  { icon: "puzzle", label: "Integrations" },
];

export const ECOSYSTEM_ITEMS: EcosystemItem[] = [
  { icon: "utensils", label: "Nexus POS", tone: "rose" },
  { icon: "bed", label: "Nexus PMS", tone: "blue" },
  { icon: "kiosk", label: "Table Kiosk Menu" },
  { icon: "cart", label: "Online Ordering" },
  { icon: "barChart", label: "Analytics & Reports" },
];

export const BENEFITS: BenefitItem[] = [
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

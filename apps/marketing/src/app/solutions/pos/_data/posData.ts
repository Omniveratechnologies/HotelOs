import type { IconName } from "@/types/marketing";

export const DEFAULT_IMAGES = {
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

export const STRIP_ITEMS: Array<{ icon: IconName; label: string }> = [
  { icon: "receipt", label: "Billing & Orders" },
  { icon: "utensils", label: "Menu Management" },
  { icon: "table", label: "Table Management" },
  { icon: "monitor", label: "KOT & Kitchen Display" },
  { icon: "box", label: "Inventory Management" },
  { icon: "card", label: "Payments & Integrations" },
  { icon: "barChart", label: "Reports & Analytics" },
];

export const SECTIONS = [
  {
    id: "billing",
    imageKey: "billing" as const,
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
    imageKey: "menu" as const,
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
    imageKey: "tables" as const,
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
    imageKey: "kot" as const,
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
    imageKey: "inventory" as const,
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
    imageKey: "payments" as const,
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
    imageKey: "reports" as const,
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

export const CTA_PERKS: Array<{ icon: IconName; label: string }> = [
  { icon: "zap", label: "Faster Service" },
  { icon: "trendUp", label: "Higher Revenue" },
  { icon: "star", label: "Better Guest Experience" },
  { icon: "shield", label: "Complete Control" },
];

import type { IconName } from "@/types/marketing";
import type {
  HardwareItem,
  ProductHighlight,
  ProductModalData,
} from "../_types/managementTypes";

export const DEFAULT_IMAGES = {
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

export const STRIP_ITEMS: Array<{ icon: IconName; label: string }> = [
  { icon: "building", label: "Hotel Management" },
  { icon: "utensils", label: "Restaurant POS" },
  { icon: "calendar", label: "Online Bookings" },
  { icon: "userCheck", label: "Guest Experience" },
  { icon: "card", label: "Integrated Payments" },
  { icon: "box", label: "Inventory & Purchase" },
  { icon: "barChart", label: "AI Reports & Analytics" },
  { icon: "headset", label: "Dedicated Support" },
];

export const MODULES: Array<{
  icon: IconName;
  title: string;
  description: string;
}> = [
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

export const HARDWARE: HardwareItem[] = [
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

export const DEMO_HIGHLIGHTS: ProductHighlight[] = [
  { icon: "zap", label: "Fast Performance" },
  { icon: "cursor", label: "Touch Interface" },
  { icon: "shield", label: "Durable Build" },
  { icon: "brand", label: "HotelOS Pre-installed" },
];

export const DEMO_FEATURES = [
  "High-quality display and responsive performance",
  "Pre-installed with HotelOS software",
  "Works with dine-in, takeaway, delivery and bar orders",
  "Multiple payment method support (UPI, Cards, Cash)",
  "Withstands high-usage hospitality environments",
  "Easy setup and 24/7 technical support",
];

export function buildProductDetails(
  item: HardwareItem,
  gallery: string[],
): ProductModalData {
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

export const SOFTWARE_POINTS = [
  "Pre-installed and ready to use",
  "Optimized for smooth performance",
  "Reliable hardware with long lifespan",
  "Seamless integration across all modules",
  "On-site setup and training support",
];

export const DIAGRAM_NODES: Array<{
  icon: IconName;
  title: string;
  subtitle: string;
}> = [
  { icon: "bed", title: "Hotel PMS", subtitle: "Reservations, Rooms" },
  { icon: "utensils", title: "Restaurant POS", subtitle: "Billing, Orders" },
  { icon: "network", title: "Booking Engine", subtitle: "OTA Integrations" },
  { icon: "card", title: "Payments", subtitle: "Cards, UPI, Wallets" },
  { icon: "smartphone", title: "Guest App", subtitle: "Booking, Check-in" },
  { icon: "monitor", title: "Kitchen Display", subtitle: "Live Orders" },
  { icon: "receipt", title: "Printers", subtitle: "Bills, KOT, Labels" },
  { icon: "barChart", title: "AI Analytics", subtitle: "Reports & Insights" },
];

export const BENEFITS = [
  "Single platform for all operations",
  "Real-time data across all modules",
  "Better guest experience",
  "Increased operational efficiency",
  "Higher revenue and lower costs",
];

export const HOSPITALITY_CARDS: Array<{
  icon: IconName;
  title: string;
  description: string;
}> = [
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

export const CTA_STATS = [
  { value: "500+", label: "Happy Customers" },
  { value: "10,000+", label: "Rooms Managed" },
  { value: "99.9%", label: "Uptime" },
];

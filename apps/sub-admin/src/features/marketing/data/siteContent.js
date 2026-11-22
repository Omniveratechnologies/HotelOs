/**
 * Marketing site content: routes, navigation, menu and footer data.
 * Keeping it here means the header, menu and footer stay in sync and a
 * link can be changed in one place.
 */

/* ------------------------------------------------------------------ */
/* Routes                                                              */
/* ------------------------------------------------------------------ */
export const ROUTES = {
  home: "/",
  login: "/login",
  pricing: "/pricing",

  // Request Demo has no destination yet.
  requestDemo: "#",

  pms: "/solutions/pms",
  pos: "/solutions/pos",
  xFactor: "/x-factor",
  managementSuite: "/management-suite",

  nexusPms: "/x-factor/nexus-pms",
  nexusPos: "/x-factor",
};

/* ------------------------------------------------------------------ */
/* Images                                                              */
/* ------------------------------------------------------------------ */
/**
 * Image URLs for the header/menu.
 * Leave empty for now: empty values show a placeholder. Later these URLs
 * come from the backend (Cloudinary, managed in the admin dashboard).
 */
export const SITE_IMAGES = {
  menuNexusPos: "",
  menuNexusPms: "",
  menuPromoBackground: "",
  menuPromoDevices: "",
};

/* ------------------------------------------------------------------ */
/* Header navigation                                                   */
/* ------------------------------------------------------------------ */
export const NAV_ITEMS = [
  // No design for the Product / Resources menus yet: plain links for now.
  { label: "Product", href: "#", hasMenu: true },
  { label: "Solutions", menu: "solutions" },
  { label: "Management Suite", href: ROUTES.managementSuite },
  { label: "Pricing", href: ROUTES.pricing },
  { label: "Resources", href: "#", hasMenu: true },
];

/* ------------------------------------------------------------------ */
/* Solutions mega menu                                                 */
/* ------------------------------------------------------------------ */
export const SOLUTIONS_MENU = {
  pms: {
    title: "PMS",
    description: "Complete property management for modern hotels.",
    icon: "bed",
    to: ROUTES.pms,
    cta: "Explore PMS",
    items: [
      { label: "Reservations & Booking Engine", icon: "calendar" },
      { label: "Front Desk & Check-in", icon: "home" },
      { label: "Room Management", icon: "door" },
      { label: "Housekeeping", icon: "broom" },
      { label: "Guest Management", icon: "users" },
      { label: "Reports & Analytics", icon: "barChart" },
    ],
  },

  pos: {
    title: "POS",
    description: "Powerful restaurant POS for seamless operations.",
    icon: "utensils",
    to: ROUTES.pos,
    cta: "Explore POS",
    items: [
      { label: "Billing & Orders", icon: "bell" },
      { label: "Menu Management", icon: "list" },
      { label: "Table Management", icon: "fileText" },
      { label: "KOT & Kitchen Display", icon: "kitchen" },
      { label: "Inventory Management", icon: "box" },
      { label: "Payments & Integrations", icon: "card" },
      { label: "Sales Reports", icon: "barChart" },
    ],
  },

  xFactor: {
    title: "X Factor",
    description: "Give a x factor to your business with Nexus POS & PMS.",
    to: ROUTES.xFactor,
    cards: [
      {
        title: "Nexus POS System",
        description:
          "Smart restaurant POS with table & kiosk menu, online ordering and more.",
        icon: "utensils",
        to: ROUTES.nexusPos,
        imageKey: "menuNexusPos",
        imageLabel: "Nexus POS screens",
      },
      {
        title: "Nexus PMS",
        description:
          "Hotel property management system integrated with Nexus POS.",
        icon: "bed",
        to: ROUTES.nexusPms,
        imageKey: "menuNexusPms",
        imageLabel: "Nexus PMS dashboard",
      },
    ],
  },

  promo: {
    eyebrow: "FACTOR",
    lineTop: "Give a",
    lineAccent: "X Factor",
    lineBottom: "to Your Business.",
    description:
      "Nexus POS & Nexus PMS — A complete solution for modern hotels and restaurants.",
    cta: "Learn More",
    to: ROUTES.xFactor,
  },
};

/** Links shown in the mobile menu under "Solutions". */
export const MOBILE_SOLUTION_LINKS = [
  { label: "PMS", to: ROUTES.pms },
  { label: "POS", to: ROUTES.pos },
  { label: "X Factor", to: ROUTES.xFactor },
  { label: "Nexus POS", to: ROUTES.nexusPos },
  { label: "Nexus PMS", to: ROUTES.nexusPms },
];

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */
export const FOOTER = {
  tagline: "One Platform for Hotels, Restaurants & More.",
  newsletterTitle: "Subscribe to our newsletter",
  columns: [
    {
      title: "Product",
      links: [
        { label: "PMS", to: ROUTES.pms },
        { label: "POS", to: ROUTES.pos },
        { label: "X Factor", to: ROUTES.xFactor },
        { label: "Pricing", to: ROUTES.pricing },
      ],
    },
    {
      title: "Solutions",
      // No dedicated pages yet: each points to the closest existing page.
      links: [
        { label: "Hotels", to: ROUTES.pms },
        { label: "Restaurants", to: ROUTES.pos },
        { label: "Cafés", to: ROUTES.pos },
        { label: "Resorts", to: ROUTES.pms },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Blogs", to: "#" },
        { label: "Help Center", to: "#" },
        { label: "Case Studies", to: "#" },
        { label: "Contact Us", to: "#" },
      ],
    },
  ],
  social: [
    { label: "Facebook", icon: "facebook", href: "#" },
    { label: "Instagram", icon: "instagram", href: "#" },
    { label: "LinkedIn", icon: "linkedin", href: "#" },
    { label: "YouTube", icon: "youtube", href: "#" },
  ],
  legal: [
    { label: "Privacy Policy", to: "#" },
    { label: "Terms of Service", to: "#" },
    { label: "Sitemap", to: "#" },
  ],
};

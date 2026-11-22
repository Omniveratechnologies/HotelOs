/**
 * Colour themes for the product pages.
 * gold = POS / PMS pages, rose = X Factor / Nexus PMS pages.
 *
 * Every value is a complete Tailwind class string. To change a colour for
 * a whole page type, change it here only.
 */
export const THEMES = {
  gold: {
    heroBg: "bg-linear-to-b from-[#fbf6ec] to-white",
    accentText: "text-[#c9962c]",
    heroButton: "bg-brand-900 text-white hover:bg-brand-800",
    solidButton: "bg-[#d4a02f] text-white hover:bg-[#c08f22]",
    chip: "bg-[#fdf1dd] text-[#c9962c]",
    chipBorder: "border-[#f0dcb3]",
    tile: "bg-[#fdf1dd] text-[#e0932b]",
    check: "text-[#e0932b]",
    playCircle: "bg-[#d4a02f]",
    dotActive: "bg-[#d4a02f]",
    soft: "bg-[#fbf3e4]",
  },
  rose: {
    heroBg: "bg-linear-to-b from-rose-50/70 to-white",
    accentText: "text-rose-600",
    heroButton: "bg-rose-600 text-white hover:bg-rose-700",
    solidButton: "bg-rose-600 text-white hover:bg-rose-700",
    chip: "bg-rose-50 text-rose-600",
    chipBorder: "border-rose-200",
    tile: "bg-rose-50 text-rose-600",
    check: "text-rose-500",
    playCircle: "bg-rose-600",
    dotActive: "bg-rose-600",
    soft: "bg-rose-50",
  },
};

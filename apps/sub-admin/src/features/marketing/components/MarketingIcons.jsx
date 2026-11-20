/**
 * Small outline icon set for the marketing pages.
 * Usage: <Icon name="bed" className="h-5 w-5" />
 * Icons use `currentColor`, so colour them with a text-* class.
 */
const ICONS = {
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  chevronUp: <path d="M6 15l6-6 6 6" />,
  chevronLeft: <path d="M15 6l-6 6 6 6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  xMark: <path d="M5 4l14 16M19 4L5 20" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l3 3 5-6" />
    </>
  ),
  play: <path d="M9 7l8 5-8 5V7z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
    </>
  ),

  /* Product icons */
  bed: (
    <>
      <path d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 00-3-3h-7v6" />
      <circle cx="7" cy="11" r="1.6" />
    </>
  ),
  utensils: (
    <>
      <path d="M7 3v7M4.5 3v4.5a2.5 2.5 0 005 0V3M7 10v11" />
      <path d="M17 21V3c-2.2 1.2-3.5 3.8-3.5 7v3H17" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8 3v4M16 3v4" />
    </>
  ),
  home: (
    <>
      <path d="M4 11l8-7 8 7M6 10v10h12V10" />
      <path d="M10 20v-6h4v6" />
    </>
  ),
  door: (
    <>
      <path d="M6 21V4h12v17M3 21h18" />
      <path d="M14 12v.01" />
    </>
  ),
  broom: (
    <>
      <path d="M19 3l-7.5 7.5" />
      <path d="M9.5 9l5.5 5.5-3 4.5c-2.5.8-5.5.6-8-.5 1.5-1.5 2-3.5 1.5-5.5l4-4z" />
    </>
  ),
  users: (
    <>
      <path d="M16 20v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 18.5V20" />
      <circle cx="10" cy="8.5" r="3.5" />
      <path d="M20 20v-1.5a3.5 3.5 0 00-2.5-3.4M15.5 5.2a3.5 3.5 0 010 6.6" />
    </>
  ),
  barChart: <path d="M5 20V11M12 20V4M19 20v-6" />,
  bell: (
    <>
      <path d="M4 18h16M6 18a6 6 0 0112 0" />
      <path d="M12 8V6M10 6h4" />
    </>
  ),
  list: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
  fileText: (
    <>
      <path d="M7 3h8l4 4v14H7z" />
      <path d="M15 3v4h4M10 12h6M10 16h6" />
    </>
  ),
  kitchen: (
    <>
      <path d="M4 10l1.5-5h13L20 10" />
      <path d="M4 10a2.5 2.5 0 005 0 2.5 2.5 0 006 0 2.5 2.5 0 005 0" />
      <path d="M5 12v8h14v-8M10 20v-5h4v5" />
    </>
  ),
  box: (
    <>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
      <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18M7 15h4" />
    </>
  ),

  /* Added for the product pages */
  receipt: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  table: (
    <>
      <ellipse cx="12" cy="9" rx="8" ry="3" />
      <path d="M12 12v8M8 20h8" />
    </>
  ),
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  tablet: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  smartphone: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  kiosk: (
    <>
      <rect x="6" y="3" width="12" height="13" rx="2" />
      <path d="M12 16v4M8 20h8M9 7h6M9 10h4" />
    </>
  ),
  qr: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3M21 14v.01M14 21h3M21 17v4" />
    </>
  ),
  cart: (
    <>
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M3 4h2.5l2.2 11h10.3l2-8H6.2" />
    </>
  ),
  building: (
    <>
      <path d="M5 21V4h9v17M14 9h5v12M3 21h18" />
      <path d="M8 8h2M8 12h2M8 16h2M16 13h.01M16 17h.01" />
    </>
  ),
  network: (
    <>
      <circle cx="12" cy="5" r="2" />
      <circle cx="5" cy="18" r="2" />
      <circle cx="19" cy="18" r="2" />
      <path d="M12 7v4M12 11l-6 5M12 11l6 5" />
    </>
  ),
  tag: (
    <>
      <path d="M3 3h9l9 9-9 9-9-9V3z" />
      <circle cx="7.5" cy="7.5" r="1.2" />
    </>
  ),
  wrench: (
    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
  ),
  puzzle: (
    <path d="M10 4a2 2 0 114 0v2h4v4h-2a2 2 0 100 4h2v4h-4v-2a2 2 0 10-4 0v2H6v-4h2a2 2 0 100-4H6V6h4V4z" />
  ),
  layers: (
    <>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 13l9 5 9-5" />
    </>
  ),
  layoutGrid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  cursor: <path d="M5 3l14 7-6 2-2 6L5 3z" />,
  headset: (
    <>
      <path d="M4 14v-2a8 8 0 0116 0v2" />
      <rect x="3" y="13" width="4" height="6" rx="1.5" />
      <rect x="17" y="13" width="4" height="6" rx="1.5" />
      <path d="M19 19c0 1.5-2 2.5-5 2.5" />
    </>
  ),
  userCheck: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2 20v-1a5 5 0 015-5h4a5 5 0 015 5v1M16.5 11l2 2 3.5-4" />
    </>
  ),
  cloud: (
    <path d="M7 18a4 4 0 01-.5-7.97A6 6 0 0118 9.5a3.5 3.5 0 01-.5 8.5H7z" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  zap: <path d="M13 3L5 13.5h6L10 21l8-10.5h-6L13 3z" />,
  trendUp: (
    <>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </>
  ),
  star: (
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5z" />
  ),
  shield: (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),

  phone: (
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
  ),

  /* Social icons */
  facebook: (
    <path d="M14 21v-8h2.5l.5-3H14V8.5c0-.9.4-1.5 1.6-1.5H17V4.2C16.6 4.1 15.7 4 14.8 4 12.6 4 11 5.3 11 7.8V10H8.5v3H11v8h3z" />
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5v.01" />
    </>
  ),
  linkedin: (
    <>
      <path d="M7 10v10M7 6v.01" />
      <path d="M11.5 20v-5.5a3.25 3.25 0 016.5 0V20M11.5 10v10" />
    </>
  ),
  youtube: (
    <>
      <path d="M3 8a3 3 0 013-3h12a3 3 0 013 3v8a3 3 0 01-3 3H6a3 3 0 01-3-3V8z" />
      <path d="M10 9.5l5 2.5-5 2.5v-5z" />
    </>
  ),
};

export function Icon({ name, className = "h-5 w-5", strokeWidth = 1.7 }) {
  const content = ICONS[name];
  if (!content) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {content}
    </svg>
  );
}

export default Icon;

import type { LucideIcon, LucideProps } from "lucide-react";
import * as LucideIcons from "lucide-react";

export type { LucideIcon, LucideProps };

const Facebook = (props: LucideProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={props.strokeWidth || 1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
    aria-hidden="true"
  >
    <path d="M14 21v-8h2.5l.5-3H14V8.5c0-.9.4-1.5 1.6-1.5H17V4.2C16.6 4.1 15.7 4 14.8 4 12.6 4 11 5.3 11 7.8V10H8.5v3H11v8h3z" />
  </svg>
);

const Instagram = (props: LucideProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={props.strokeWidth || 1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <path d="M17.5 6.5v.01" />
  </svg>
);

const Linkedin = (props: LucideProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={props.strokeWidth || 1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
    aria-hidden="true"
  >
    <path d="M7 10v10M7 6v.01" />
    <path d="M11.5 20v-5.5a3.25 3.25 0 016.5 0V20M11.5 10v10" />
  </svg>
);

const Youtube = (props: LucideProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={props.strokeWidth || 1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
    aria-hidden="true"
  >
    <path d="M3 8a3 3 0 013-3h12a3 3 0 013 3v8a3 3 0 01-3 3H6a3 3 0 01-3-3V8z" />
    <path d="M10 9.5l5 2.5-5 2.5v-5z" />
  </svg>
);

export const ICON_MAP: Record<
  string,
  LucideIcon | ((props: LucideProps) => React.ReactNode)
> = {
  arrowRight: LucideIcons.ArrowRight,
  arrowUpRight: LucideIcons.ArrowUpRight,
  chevronDown: LucideIcons.ChevronDown,
  chevronUp: LucideIcons.ChevronUp,
  chevronLeft: LucideIcons.ChevronLeft,
  chevronRight: LucideIcons.ChevronRight,
  menu: LucideIcons.Menu,
  close: LucideIcons.X,
  xMark: LucideIcons.X,
  check: LucideIcons.Check,
  checkCircle: LucideIcons.CheckCircle2,
  play: LucideIcons.Play,
  sparkle: LucideIcons.Sparkles,
  globe: LucideIcons.Globe,
  bed: LucideIcons.Bed,
  utensils: LucideIcons.UtensilsCrossed,
  calendar: LucideIcons.Calendar,
  home: LucideIcons.Home,
  door: LucideIcons.DoorClosed,
  broom: LucideIcons.Sparkles,
  users: LucideIcons.Users,
  barChart: LucideIcons.BarChart3,
  bell: LucideIcons.Bell,
  list: LucideIcons.List,
  fileText: LucideIcons.FileText,
  kitchen: LucideIcons.CookingPot,
  box: LucideIcons.Package,
  card: LucideIcons.CreditCard,
  receipt: LucideIcons.Receipt,
  table: LucideIcons.LayoutGrid,
  monitor: LucideIcons.Monitor,
  tablet: LucideIcons.Tablet,
  smartphone: LucideIcons.Smartphone,
  kiosk: LucideIcons.Store,
  qr: LucideIcons.QrCode,
  cart: LucideIcons.ShoppingCart,
  building: LucideIcons.Building2,
  network: LucideIcons.Network,
  tag: LucideIcons.Tag,
  wrench: LucideIcons.Wrench,
  puzzle: LucideIcons.Puzzle,
  layers: LucideIcons.Layers,
  layoutGrid: LucideIcons.LayoutGrid,
  cursor: LucideIcons.MousePointer2,
  headset: LucideIcons.Headphones,
  userCheck: LucideIcons.UserCheck,
  cloud: LucideIcons.Cloud,
  clock: LucideIcons.Clock,
  zap: LucideIcons.Zap,
  trendUp: LucideIcons.TrendingUp,
  star: LucideIcons.Star,
  shield: LucideIcons.ShieldCheck,
  phone: LucideIcons.Phone,
  brand: LucideIcons.Building2,
  facebook: Facebook as unknown as LucideIcon,
  instagram: Instagram as unknown as LucideIcon,
  linkedin: Linkedin as unknown as LucideIcon,
  youtube: Youtube as unknown as LucideIcon,
};

export interface IconProps extends LucideProps {
  name?: string;
  icon?: LucideIcon;
  className?: string;
  strokeWidth?: number;
}

export function Icon({
  name,
  icon,
  className = "h-5 w-5",
  strokeWidth = 1.7,
  ...rest
}: IconProps) {
  const Component =
    icon ||
    (name
      ? ICON_MAP[name] ||
        ((LucideIcons as unknown as Record<string, LucideIcon>)[
          name
        ] as LucideIcon)
      : null);

  if (!Component) return null;

  return (
    <Component
      className={className}
      strokeWidth={strokeWidth}
      aria-hidden="true"
      focusable="false"
      {...rest}
    />
  );
}

export default Icon;

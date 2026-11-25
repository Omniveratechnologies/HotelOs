import type { ReactNode } from "react";

export type IconName =
  | "arrowRight"
  | "arrowUpRight"
  | "chevronDown"
  | "chevronUp"
  | "chevronLeft"
  | "chevronRight"
  | "menu"
  | "close"
  | "xMark"
  | "check"
  | "checkCircle"
  | "play"
  | "sparkle"
  | "globe"
  | "bed"
  | "utensils"
  | "calendar"
  | "home"
  | "door"
  | "broom"
  | "users"
  | "barChart"
  | "bell"
  | "list"
  | "fileText"
  | "kitchen"
  | "box"
  | "card"
  | "receipt"
  | "table"
  | "monitor"
  | "tablet"
  | "smartphone"
  | "kiosk"
  | "qr"
  | "cart"
  | "building"
  | "network"
  | "tag"
  | "wrench"
  | "puzzle"
  | "layers"
  | "layoutGrid"
  | "cursor"
  | "headset"
  | "userCheck"
  | "cloud"
  | "clock"
  | "zap"
  | "trendUp"
  | "star"
  | "shield"
  | "phone"
  | "brand"
  | "facebook"
  | "instagram"
  | "linkedin"
  | "youtube";

export interface NavItem {
  label: string;
  href?: string;
  menu?: "solutions";
  hasMenu?: boolean;
}

export interface SolutionMenuItem {
  label: string;
  icon: IconName;
}

export interface SolutionCardItem {
  title: string;
  description: string;
  icon: IconName;
  to: string;
  imageKey: string;
  imageLabel: string;
}

export interface FooterLink {
  label: string;
  to: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface SocialItem {
  label: string;
  icon: IconName;
  href: string;
}

export interface ThemeColors {
  heroBg: string;
  accentText: string;
  heroButton: string;
  solidButton: string;
  chip: string;
  chipBorder: string;
  tile: string;
  check: string;
  playCircle: string;
  dotActive: string;
  soft: string;
}

export interface ImageSlotProps {
  src?: string;
  alt?: string;
  label?: string;
  className?: string;
  fit?: "cover" | "contain";
  tone?: "light" | "dark";
  children?: ReactNode;
}

export interface HeroBadge {
  icon: IconName;
  title: string;
  subtitle: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

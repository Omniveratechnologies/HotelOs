import {
  BedDouble,
  BellRing,
  Briefcase,
  Building2,
  Car,
  Dumbbell,
  Layers,
  Megaphone,
  Monitor,
  ShieldCheck,
  Sparkles,
  Users,
  Utensils,
  Wallet,
  Wine,
  Wrench,
} from "lucide-react";

export const DEPARTMENT_ICONS = {
  building: { label: "Building", Icon: Building2 },
  bell: { label: "Reception", Icon: BellRing },
  bed: { label: "Rooms", Icon: BedDouble },
  sparkles: { label: "Cleaning", Icon: Sparkles },
  utensils: { label: "Kitchen", Icon: Utensils },
  wine: { label: "Restaurant", Icon: Wine },
  shield: { label: "Security", Icon: ShieldCheck },
  wrench: { label: "Maintenance", Icon: Wrench },
  wallet: { label: "Accounts", Icon: Wallet },
  users: { label: "HR", Icon: Users },
  megaphone: { label: "Marketing", Icon: Megaphone },
  monitor: { label: "IT", Icon: Monitor },
  car: { label: "Transport", Icon: Car },
  dumbbell: { label: "Spa & Gym", Icon: Dumbbell },
  briefcase: { label: "Management", Icon: Briefcase },
  layers: { label: "Others", Icon: Layers },
};

export const DEPARTMENT_COLORS = [
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#10b981",
  "#14b8a6",
  "#0ea5e9",
  "#64748b",
];

export const DEFAULT_ICON = "building";
export const DEFAULT_COLOR = "#3b82f6";

export const suggestCode = (name = "") => {
  const words = name
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "";
  const letters =
    words.length > 1
      ? words.map((word) => word[0]).join("")
      : words[0].slice(0, 2);
  return letters.slice(0, 4);
};

export const departmentKey = (department) =>
  department?.code || department?._id || "";

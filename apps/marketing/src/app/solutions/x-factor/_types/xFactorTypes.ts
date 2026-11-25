import type { IconName } from "@/types/marketing";

export interface BenefitItem {
  icon: IconName;
  title: string;
  description: string;
  tone?: "orange" | "rose" | "blue" | "gold";
}

export interface EcosystemItem {
  icon: IconName;
  label: string;
  tone?: "rose" | "blue" | "white";
}

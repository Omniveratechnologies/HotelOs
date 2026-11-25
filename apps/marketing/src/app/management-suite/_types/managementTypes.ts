import type { IconName } from "@/types/marketing";

export interface ProductHighlight {
  icon: IconName | "brand";
  label: string;
}

export interface ProductModalData {
  category?: string;
  title: string;
  summary?: string;
  description?: string;
  highlights?: ProductHighlight[];
  features?: string[];
  images?: string[];
}

export interface HardwareItem {
  title: string;
  description: string;
  imageKey: string;
  category: string;
  summary?: string;
  highlights?: { icon: unknown; label: string }[];
  features?: string[];
  images?: string[];
}

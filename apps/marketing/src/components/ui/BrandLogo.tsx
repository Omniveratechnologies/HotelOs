import Link from "next/link";
import { ROUTES } from "@/data/siteContent";

interface BrandLogoProps {
  onClick?: () => void;
  className?: string;
}

export default function BrandLogo({ onClick, className = "" }: BrandLogoProps) {
  return (
    <Link
      href={ROUTES.home}
      onClick={onClick}
      aria-label="HotelOS home"
      className={`flex items-center gap-2.5 ${className}`}
    >
      <span className="font-display border-primary-400 bg-brand-900 text-primary-400 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-2xl leading-none font-bold">
        H
      </span>
      <span className="font-display text-brand-900 text-[28px] leading-none font-semibold tracking-tight">
        Hotel<span className="text-primary-500">OS</span>
      </span>
    </Link>
  );
}

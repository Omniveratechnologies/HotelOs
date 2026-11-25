"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  Building2,
  Home,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from "lucide-react";

interface PortalOption {
  role: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUB_ADMIN_URL =
  process.env.NEXT_PUBLIC_SUB_ADMIN_URL || "http://localhost:5174";
const RECEPTIONIST_URL =
  process.env.NEXT_PUBLIC_RECEPTIONIST_URL || "http://localhost:5175";
const KITCHEN_URL =
  process.env.NEXT_PUBLIC_KITCHEN_URL || "http://localhost:5176";

const PORTALS: PortalOption[] = [
  {
    role: "Hotel Owner / Admin",
    title: "Hotel Management Portal",
    description:
      "Property administration, rates, room inventory, and executive metrics.",
    href: `${SUB_ADMIN_URL}/login`,
    icon: Building2,
    badge: "Sub-Admin",
  },
  {
    role: "Front Desk & Receptionist",
    title: "Receptionist Front Desk",
    description:
      "Guest check-ins, reservations desk, room allocations, and daily folio billing.",
    href: `${RECEPTIONIST_URL}/login`,
    icon: Home,
    badge: "Reception Desk",
  },
  {
    role: "Kitchen & Restaurant Staff",
    title: "Kitchen & POS Terminal",
    description:
      "Live Kitchen Order Tickets (KOT), station displays, and restaurant orders.",
    href: `${KITCHEN_URL}/login`,
    icon: UtensilsCrossed,
    badge: "Kitchen Display",
  },
];

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="bg-brand-950/60 fixed inset-0 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog */}
      <div
        ref={dialogRef}
        className="border-surface-200 relative w-full max-w-lg rounded-2xl border bg-white p-6 shadow-2xl transition-all sm:p-8"
      >
        <div className="border-surface-200 flex items-center justify-between border-b pb-4">
          <div>
            <h2
              id="login-modal-title"
              className="text-brand-900 text-xl font-bold tracking-tight sm:text-2xl"
            >
              Log in to HotelOS
            </h2>
            <p className="text-brand-700/70 mt-1 text-sm">
              Select your role to access your dedicated terminal or dashboard.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-brand-700/60 hover:bg-surface-100 hover:text-brand-900 rounded-lg p-2 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Portals list */}
        <div className="mt-6 flex flex-col gap-3">
          {PORTALS.map((portal) => {
            const IconComponent = portal.icon;
            return (
              <a
                key={portal.role}
                href={portal.href}
                className="group border-surface-200 hover:bg-primary-50/30 relative flex items-start gap-4 rounded-xl border p-4 transition-all hover:border-[#d4a02f] hover:shadow-sm"
              >
                <div className="bg-brand-900 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white transition-colors group-hover:bg-[#d4a02f]">
                  <IconComponent className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-primary-600 text-xs font-semibold tracking-wider uppercase">
                      {portal.badge}
                    </span>
                    <ArrowRight className="text-brand-700/40 group-hover:text-brand-900 h-4 w-4 transition-all group-hover:translate-x-0.5" />
                  </div>
                  <h3 className="text-brand-900 group-hover:text-primary-700 text-base font-bold transition-colors">
                    {portal.role}
                  </h3>
                  <p className="text-brand-700/70 mt-0.5 text-xs leading-relaxed">
                    {portal.description}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}

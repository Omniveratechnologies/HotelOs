"use client";

import { useState } from "react";
import type { ImageSlotProps } from "@/types/marketing";

export default function ImageSlot({
  src,
  alt = "",
  label = "Image",
  className = "",
  fit = "cover",
  tone = "light",
}: ImageSlotProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && failedSrc !== src;

  const placeholderTone =
    tone === "dark"
      ? "from-brand-800 to-brand-950 text-white/40"
      : "from-background-100 to-background-200 text-brand-700/50";

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailedSrc(src || "")}
          className={`h-full w-full ${
            fit === "contain" ? "object-contain" : "object-cover"
          }`}
        />
      ) : (
        <div
          role="img"
          aria-label={alt || label}
          className={`flex h-full w-full flex-col items-center justify-center gap-1.5 bg-linear-to-br ${placeholderTone}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <circle cx="8.5" cy="9.5" r="1.5" />
            <path d="M21 16l-5-5-8 8" />
          </svg>
          <span className="text-[11px] font-medium tracking-wide uppercase">
            {label}
          </span>
        </div>
      )}
    </div>
  );
}

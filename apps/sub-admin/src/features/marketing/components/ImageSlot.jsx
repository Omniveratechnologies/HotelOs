import { useState } from "react";

/**
 * ImageSlot
 *
 * A fixed-shape image area used all over the marketing pages.
 *
 * - Pass `src` (later: the Cloudinary URL controlled from the admin
 *   dashboard) and the image is shown.
 * - With no `src` (or if the image fails to load) a clean empty placeholder
 *   is shown, so the layout always matches the design.
 *
 * Size and shape are controlled by `className`, for example:
 *   className="aspect-[16/10] w-full rounded-2xl"
 */
export default function ImageSlot({
  src,
  alt = "",
  label = "Image",
  className = "",
  fit = "cover",
  tone = "light",
}) {
  const [failedSrc, setFailedSrc] = useState(null);
  const showImage = Boolean(src) && failedSrc !== src;

  const placeholderTone =
    tone === "dark"
      ? "from-brand-800 to-brand-950 text-white/40"
      : "from-background-100 to-background-200 text-brand-700/50";

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailedSrc(src)}
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
            <circle cx="9" cy="10" r="1.6" />
            <path d="M3 17l5-4.5 4 3.5 3-2.5 6 5" />
          </svg>
          <span className="px-2 text-center text-[11px] font-medium tracking-wide">
            {label}
          </span>
        </div>
      )}
    </div>
  );
}

import { clsx } from "clsx";
import { twMerge, twJoin } from "tailwind-merge";

/** @typedef {import("clsx").ClassValue} ClassValue */

/**
 * Merge conditional class names and dedupe conflicting Tailwind utilities.
 *
 * Uses `clsx` for conditional branching (strings, arrays, objects, falsy
 * values) and `tailwind-merge` to resolve conflicting utilities — later
 * values win. The default way to compose `className` strings across HotelOS.
 *
 * @param {...ClassValue} inputs - Class values, typically a mix of template
 *   literals, booleans, and objects keyed by className.
 * @returns {string} A single conflict-free className string for `className`.
 *
 * @example
 * cn("px-2 p-3", isActive && "bg-brand-900", ["rounded-lg"]); // "p-3 bg-brand-900 rounded-lg"
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Merge two className strings, deduping conflicting utilities (see {@link cn}). */
export { twMerge };

/** Join className strings with no deduping of conflicting utilities. */
export { twJoin };

/** Tiny helper for constructing conditional className strings. */
export { clsx };

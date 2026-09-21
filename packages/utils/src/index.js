/**
 * @fileoverview This file serves as the entry point for the utils package, re-exporting various utility functions and modules.
 * It provides a centralized location for importing commonly used utilities, making it easier to manage dependencies and maintain code organization.
 *
 * @module utils
 */

// Re-export utility functions and modules from their respective files
export { cn, clsx, twMerge, twJoin } from "./cn.js";

// Re-export rate plan code utilities from the ratePlanCode.js file
export {
  deriveRatePlanCode,
  parseRatePlanCode,
  OCCUPANCY_LETTER_BY_TYPE,
  OCCUPANCY_TYPE_BY_LETTER,
} from "./ratePlanCode.js";

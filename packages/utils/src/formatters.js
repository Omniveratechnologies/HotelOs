/**
 * Formats a timestamp into a 12-hour or 24-hour localized time string (HH:MM).
 *
 * @param {string|number|Date|null} value - Date or timestamp to format
 * @returns {string} Formatted time string
 */
export const formatTime = (value) => {
  if (!value) return "";

  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Converts a date or timestamp to a local "YYYY-MM-DD" string.
 * Avoids UTC date shifts from .toISOString().split('T')[0].
 *
 * @param {string|number|Date|null} value
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const toLocalDateString = (value) => {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Formats a date into localized date string (e.g. "15 Aug 2026").
 *
 * @param {string|number|Date|null} value - Date or timestamp to format
 * @returns {string} Formatted date string
 */
export const formatDate = (value) => {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const [year, month, day] = value.trim().split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Formats a numeric amount into localized currency (e.g. "₹1,200").
 *
 * @param {number|string} amount - Monetary amount
 * @param {string} [currency='INR'] - Currency code
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = "INR") => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(num);
};

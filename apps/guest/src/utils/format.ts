export function formatMoney(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/** "just now" / "5 min ago" / "2 hr ago" */
export function relTime(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  return `${Math.floor(seconds / 3600)} hr ago`;
}

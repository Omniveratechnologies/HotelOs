export const money = (v?: number | string | null): string =>
  `₹${Math.round(Number(v) || 0).toLocaleString("en-IN")}`;

export const pctStr = (v?: number | null): string => `${(v || 0).toFixed(1)}%`;

export const num = (v?: number | null): string =>
  Math.round(v || 0).toLocaleString("en-IN");

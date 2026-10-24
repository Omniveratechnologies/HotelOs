export const money = (v) => `₹${Math.round(v || 0).toLocaleString("en-IN")}`;
export const pctStr = (v) => `${(v || 0).toFixed(1)}%`;
export const num = (v) => Math.round(v || 0).toLocaleString("en-IN");

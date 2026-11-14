/**
 * Run oxlint with each workspace's own config.
 * Kiosk is excluded because it uses ESLint.
 */
export default {
  "*.{ts,tsx,js,jsx,mjs}": (files) => {
    const lintable = files
      .filter(
        (file) => file.startsWith("apps/") || file.startsWith("packages/"),
      )
      .filter((file) => !file.startsWith("apps/kiosk/"));

    return lintable.length > 0 ? `oxlint --fix ${lintable.join(" ")}` : [];
  },
  "*.{ts,tsx,js,jsx,mjs,json,md,css}": "prettier --write",
};

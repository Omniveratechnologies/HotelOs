import { browserConfig } from "./browser.js";
import { composeConfig } from "./compose.js";

export const reactPlugins = [...browserConfig.plugins, "react"];

/**
 * Preset for React code.
 *
 * React Compiler rules are downgraded to warnings because the existing
 * codebase predates them. Rules from the react plugin are explicit since
 * the plugin is disabled by default.
 */
export const reactConfig = composeConfig(browserConfig, {
  plugins: reactPlugins,
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/exhaustive-deps": "warn",
    "react/set-state-in-effect": "warn",
    "react/refs": "warn",
    "react/use-memo": "warn",
    "react/incompatible-library": "warn",
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { allowConstantExport: true }],
  },
});

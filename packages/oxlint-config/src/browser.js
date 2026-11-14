import { baseConfig } from "./base.js";
import { composeConfig } from "./compose.js";

/**
 * Preset for browser code.
 *
 * `node` is kept enabled because a few shared modules defensively read
 * `process.env` while also running in the browser.
 */
export const browserConfig = composeConfig(baseConfig, {
  env: {
    browser: true,
    node: true,
    es2024: true,
  },
});

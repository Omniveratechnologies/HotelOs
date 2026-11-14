import { baseConfig } from "./base.js";
import { composeConfig } from "./compose.js";

export const nodePlugins = [...baseConfig.plugins, "node", "promise"];

/**
 * Preset for Node.js code such as backend services, workers, and scripts.
 */
export const nodeConfig = composeConfig(baseConfig, {
  plugins: nodePlugins,
  env: {
    node: true,
    es2024: true,
  },
});

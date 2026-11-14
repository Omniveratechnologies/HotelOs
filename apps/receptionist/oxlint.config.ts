import { defineConfig } from "oxlint";
import {
  commonIgnorePatterns,
  reactConfig,
  reactPlugins,
} from "@hotelos/oxlint-config";

export default defineConfig({
  extends: [reactConfig],
  plugins: [...reactPlugins, "node"],
  ignorePatterns: [...commonIgnorePatterns, "release/**"],
  overrides: [
    {
      // Electron main-process files run in Node and log to the terminal.
      files: ["electron/**"],
      env: {
        node: true,
      },
      rules: {
        "no-console": "off",
      },
    },
  ],
});

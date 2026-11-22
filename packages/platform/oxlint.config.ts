import { defineConfig } from "oxlint";
import { browserConfig, commonIgnorePatterns } from "@hotelos/oxlint-config";

export default defineConfig({
  extends: [browserConfig],
  ignorePatterns: commonIgnorePatterns,
  rules: {
    "eslint/no-console": "off",
    "typescript/no-explicit-any": "off",
  },
});

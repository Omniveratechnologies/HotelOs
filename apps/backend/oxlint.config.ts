import { defineConfig } from "oxlint";
import { commonIgnorePatterns, nodeConfig } from "@hotelos/oxlint-config";

export default defineConfig({
  extends: [nodeConfig],
  ignorePatterns: commonIgnorePatterns,
  overrides: [
    {
      // Seed and script files log progress and run steps sequentially.
      files: ["src/seed/**", "src/scripts/**"],
      rules: {
        "no-console": "off",
        "no-await-in-loop": "off",
      },
    },
  ],
});

import { defineConfig } from "oxlint";
import { commonIgnorePatterns, nodeConfig } from "@hotelos/oxlint-config";

export default defineConfig({
  extends: [nodeConfig],
  ignorePatterns: commonIgnorePatterns,
  rules: {
    // Side-effect imports are intentional for env bootstrap and Mongoose
    // model registration (schemas must be registered before populate runs).
    "import/no-unassigned-import": [
      "warn",
      {
        allow: [
          "dotenv/config",
          "#/config/env.js",
          "**/config/env.js",
          "#/modules/**/models/*.js",
        ],
      },
    ],
  },
  overrides: [
    {
      // Seed and script files log progress and run steps sequentially.
      files: ["src/seed/**", "src/scripts/**"],
      rules: {
        "no-console": "off",
        "no-await-in-loop": "off",
        "import/no-unassigned-import": "off",
      },
    },
    {
      // Central model registry: imports exist purely to register schemas.
      files: ["src/config/models.js"],
      rules: {
        "import/no-unassigned-import": "off",
      },
    },
  ],
});

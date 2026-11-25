import { defineConfig } from "oxlint";
import {
  commonIgnorePatterns,
  reactConfig,
  reactPlugins,
} from "@hotelos/oxlint-config";

export default defineConfig({
  extends: [reactConfig],
  plugins: [...reactPlugins, "nextjs"],
  ignorePatterns: [...commonIgnorePatterns, ".next/**"],
  overrides: [
    {
      files: ["src/app/**"],
      rules: {
        "react/only-export-components": "off",
      },
    },
  ],
});

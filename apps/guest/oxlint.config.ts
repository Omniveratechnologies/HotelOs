import { defineConfig } from "oxlint";
import { commonIgnorePatterns, reactConfig } from "@hotelos/oxlint-config";

export default defineConfig({
  extends: [reactConfig],
  ignorePatterns: [
    ...commonIgnorePatterns,
    "src/routeTree.gen.ts",
    ".tanstack/**",
    ".output/**",
    ".vinxi/**",
  ],
  overrides: [
    {
      // TanStack route files export route objects, not only components.
      files: ["src/routes/**"],
      rules: {
        "react/only-export-components": "off",
      },
    },
  ],
});

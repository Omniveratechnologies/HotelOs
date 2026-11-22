import { defineConfig } from "oxlint";
import { browserConfig, commonIgnorePatterns } from "@hotelos/oxlint-config";

export default defineConfig({
  extends: [browserConfig],
  ignorePatterns: commonIgnorePatterns,
});

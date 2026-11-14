import { defineConfig } from "oxlint";
import { baseConfig, commonIgnorePatterns } from "./src/index.js";

export default defineConfig({
  extends: [baseConfig],
  ignorePatterns: commonIgnorePatterns,
});

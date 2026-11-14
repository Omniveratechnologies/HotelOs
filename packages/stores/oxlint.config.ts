import { defineConfig } from "oxlint";
import { commonIgnorePatterns, reactConfig } from "@hotelos/oxlint-config";

export default defineConfig({
  extends: [reactConfig],
  ignorePatterns: commonIgnorePatterns,
});

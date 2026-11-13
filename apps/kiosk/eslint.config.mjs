import { defineConfig } from "eslint/config";
import expoConfig from "eslint-config-expo/flat.js";

const eslintConfig = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "android/*", ".expo/*"],
  },
]);

export default eslintConfig;

import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["react", "oxc", "unicorn"],
  categories: {
    correctness: "warn", // currently set to warn, but will be set to error in the future
    suspicious: "warn",
    perf: "warn",
  },
  rules: {
    "react/react-in-jsx-scope": "off",
    "eslint/no-underscore-dangle": ["error", { allow: ["_id"] }], // allow _id for MongoDB documents
  },
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  ignorePatterns: [
    "**/dist/**",
    "**/build/**",
    "**/node_modules/**",
    "**/.next/**",
    "**/coverage/**",
  ],
});

/*
  Note: after the app becomes more stable, we will change the rules to error instead of warn. This is to ensure that the code is of high quality and maintainable.
  also add the lint-staged package to the project to ensure that the code is linted before committing.
  Add the following to the package.json file's lint-staged section before the format command:
  ```
    "*.{ts,tsx,js,jsx,mjs}": "oxlint --fix --deny-warnings"
  ```
  The above command will lint the code and fix any issues that can be fixed automatically. It will also deny any warnings, which means that the commit will fail if there are any warnings. This is to ensure that the code is of high quality and maintainable.
*/

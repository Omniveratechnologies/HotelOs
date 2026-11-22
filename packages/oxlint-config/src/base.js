export const basePlugins = ["eslint", "oxc", "typescript", "unicorn", "import"];

/**
 * Rules shared by every workspace.
 *
 * Oxlint already enables its default correctness rules (no-debugger,
 * no-unused-vars, no-useless-catch, and similar), so this preset only adds
 * non-default rules and intentional severity changes.
 */
export const baseConfig = {
  plugins: basePlugins,
  categories: {
    // Oxlint defaults to warnings; projects treat correctness issues as errors.
    correctness: "error",
    suspicious: "warn",
    perf: "warn",
  },
  rules: {
    // Code quality rules that are not enabled by default.
    // console.error is legitimate diagnostics; console.log/warn stay flagged.
    "no-console": ["warn", { allow: ["error"] }],
    "no-var": "error",
    "prefer-const": "warn",
    eqeqeq: ["warn", "smart"],
    "typescript/no-explicit-any": "warn",

    // The import plugin is off by default, so these rules must be explicit.
    "import/no-cycle": "error",
    "import/no-duplicates": "warn",

    // Enabled by the suspicious category; Mongo documents use `_id`.
    "no-underscore-dangle": [
      "warn",
      { allow: ["_id", "__v", "_doc", "_def", "__filename", "__dirname"] },
    ],
  },
  env: {
    es2024: true,
  },
  overrides: [
    {
      files: ["**/*.test.*", "**/*.spec.*", "**/__tests__/**", "tests/**"],
      rules: {
        "no-console": "off",
        "typescript/no-explicit-any": "off",
        "no-await-in-loop": "off",
      },
    },
  ],
};

/**
 * Generated and build output directories inside a workspace.
 */
export const commonIgnorePatterns = [
  "**/node_modules/**",
  "**/dist/**",
  "**/dist-electron/**",
  "**/build/**",
  "**/coverage/**",
  "**/.turbo/**",
  "**/*.tsbuildinfo",
];

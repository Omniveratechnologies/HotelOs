import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["react", "typescript", "oxc", "unicorn", "import"],
  categories: {
    correctness: "error",
    suspicious: "warn",
    perf: "warn",
  },
  rules: {
    // React rules
    "react/react-in-jsx-scope": "off",
    "react/rules-of-hooks": "error",
    "react/exhaustive-deps": "warn",
    "react/only-export-components": ["warn", { allowConstantExport: true }],

    // TypeScript rules
    "typescript/no-explicit-any": "warn",

    // Import rules (pragmatic, production-ready ESM/CommonJS setup)
    "import/no-cycle": "error",
    "import/no-self-import": "error",
    "import/no-unassigned-import": "off", // allow CSS, dotenv, and side-effect imports
    "import/no-named-as-default-member": "off", // allow standard CJS/ESM interop (e.g., bcrypt.hash)
    "import/no-named-as-default": "off",

    // General code quality & project conventions
    "no-underscore-dangle": ["error", { allow: ["_id"] }],
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "server-only",
            message:
              "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
          },
        ],
      },
    ],
  },
  overrides: [
    {
      files: ["**/*.test.*", "**/*.spec.*", "**/__tests__/**"],
      rules: {
        "no-console": "off",
        "typescript/no-explicit-any": "off",
      },
    },
  ],
  env: {
    browser: true,
    node: true,
    es2024: true,
  },
  ignorePatterns: [
    "**/dist/**",
    "**/build/**",
    "**/node_modules/**",
    "**/.next/**",
    "**/.output/**",
    "**/.vinxi/**",
    "**/.tanstack/**",
    "**/.turbo/**",
    "**/coverage/**",
    "**/routeTree.gen.ts",
    "**/*.tsbuildinfo",
  ],
});

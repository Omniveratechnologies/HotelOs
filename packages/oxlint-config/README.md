# @hotelos/oxlint-config

Shared oxlint presets for the monorepo.

## Presets

- `baseConfig` — shared rules for all JavaScript and TypeScript code.
- `browserConfig` — base config plus browser globals.
- `nodeConfig` — base config plus Node.js and Promise plugins.
- `reactConfig` — browser config plus React rules.

`commonIgnorePatterns` covers build output. `basePlugins`, `nodePlugins`, and
`reactPlugins` are exported for configs that need to add plugins.

## Usage

Create `oxlint.config.ts` in the workspace:

```ts
import { defineConfig } from "oxlint";
import { commonIgnorePatterns, reactConfig } from "@hotelos/oxlint-config";

export default defineConfig({
  extends: [reactConfig],
  ignorePatterns: commonIgnorePatterns,
});
```

Oxlint is installed at the repo root. Run one workspace with
`pnpm --filter <workspace> lint`, or all workspaces with `pnpm lint`.

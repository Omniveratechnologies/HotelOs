# HotelOS Marketing Application

Public landing page and marketing website for **HotelOS**.

- **Package name**: `marketing`
- **Framework**: Next.js 16 (App Router, Turbopack, React Compiler)
- **Styling**: Tailwind CSS v4 + `@hotelos/styles`
- **Port**: Default Next.js port (`3000`)

---

## Getting Started

### 1. Install dependencies

From the monorepo root:

```bash
pnpm install
```

### 2. Run the development server

```bash
pnpm dev -F marketing
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 3. Check types and linting

```bash
# Typecheck with TypeScript
pnpm typecheck -F marketing

# Lint with Oxlint
pnpm lint -F marketing

# Auto-fix lint issues
pnpm lint:fix -F marketing
```

### 4. Build for production

```bash
pnpm build -F marketing
pnpm start -F marketing
```

---

## Shared Workspace Packages

This app integrates with the centralized monorepo packages:

- **`@hotelos/styles`**: Shared design tokens (brand navy, primary gold, background cream), base styles, and utility classes.
- **`@hotelos/ui`**: Shared UI component library.
- **`@hotelos/oxlint-config`**: Standardized oxlint linting preset for React and Next.js applications.
- **`@hotelos/utils`**: Formatting and class merging helpers (`cn`).

---

## Project Structure

```
apps/marketing/
├── public/                 Static assets (favicons, media)
├── src/
│   ├── app/
│   │   ├── globals.css     Tailwind v4 & @hotelos/styles entry
│   │   ├── layout.tsx      Root layout shell with fonts & metadata
│   │   └── page.tsx        Landing page entry
│   └── declarations.d.ts   Module declarations for monorepo packages
├── next.config.ts          Next.js Turbopack configuration
├── oxlint.config.ts        Oxlint configuration extending @hotelos/oxlint-config
├── package.json            Dependencies and workspace scripts
├── README.md               Project documentation
└── tsconfig.json           TypeScript compiler configuration
```

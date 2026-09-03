# HotelOS

A multi-role, multi-tenant hotel management platform. HotelOS is a monorepo
that ships a single backend API and several role-specific frontend
dashboards, all sharing a common codebase and a shared API client package.

The system supports five distinct roles with hotel (tenant) isolation
enforced entirely on the backend:

```
                SUPER ADMIN        (platform operator, manages all hotels)
                     |
                     | creates / manages hotels & Sub Admins
                     v
                SUB ADMIN          (administrates ONE hotel)
                     |
        +------------+----------------+
        |                             |
        v                             v
   RECEPTIONIST                    KITCHEN        (hotel staff)
        |
        | creates guest account during check-in
        v
     GUEST
```

The most important rule: **a frontend must never decide which hotel a user
belongs to.** The backend always derives hotel ownership from the
authenticated user's JWT (`req.user.hotelId`).

---

## Repository layout

This is a **pnpm + Turborepo** monorepo. Workspaces are defined in
`pnpm-workspace.yaml` (`apps/*` and `packages/*`).

| Path                | Name              | Description                                              | Dev port |
| ------------------- | ----------------- | -------------------------------------------------------- | -------- |
| `apps/backend`      | `backend`         | Express + MongoDB REST API                               | `5001`   |
| `apps/super-admin`  | `super-admin`     | Platform operator dashboard (React + Vite)               | `5173`   |
| `apps/sub-admin`    | `sub-admin`       | Hotel admin dashboard + marketing site (React + Vite)    | `5174`   |
| `apps/receptionist` | `receptionist`    | Front-desk dashboard (React + Vite)                      | `5175`   |
| `apps/kitchen`      | `kitchen`         | Kitchen display system & live order board (React + Vite) | `5176`   |
| `apps/guest`        | `guest`           | Hotel room guest dashboard & portal (React + Vite)       | `5177`   |
| `packages/api`      | `@hotelos/api`    | Shared fetch client used by frontends                    | —        |
| `packages/styles`   | `@hotelos/styles` | Shared Tailwind CSS v4 design tokens and theme styles    | —        |

The `packages/auth`, `packages/lib`, `packages/ui`, and `packages/utils`
directories are reserved workspaces for future modularization.

---

## Roles

| Role           | Scope     | Responsibilities                                                  |
| -------------- | --------- | ----------------------------------------------------------------- |
| `SUPER_ADMIN`  | Platform  | Create/manage hotels and Sub Admins, platform administration      |
| `SUB_ADMIN`    | One hotel | Manage rooms, invite staff (Receptionist/Kitchen), hotel settings |
| `RECEPTIONIST` | One hotel | Register guests, assign rooms, check-in/check-out                 |
| `KITCHEN`      | One hotel | Kitchen operations (live food orders, order lifecycle & KDS)      |
| `GUEST`        | One hotel | Guest room dashboard, amenity booking, and food ordering          |

Every role is validated on the backend. Frontend role checks are for UI
navigation only and are never a security boundary.

---

## Technology stack

- **Monorepo tooling** — pnpm workspaces, Turborepo
- **Backend** — Node.js, Express 5, MongoDB / Mongoose, JWT, bcryptjs, Multer,
  Nodemailer, Pino (struct/log + HTTP request logging), Cloudflare R2, Razorpay
- **Frontend** — React 19, Vite, Tailwind CSS v4, React Router / TanStack Router
- **Shared packages** — `@hotelos/api` (fetch client), `@hotelos/styles` (Tailwind v4 tokens)
- **Quality** — oxlint, Prettier, Husky + lint-staged

---

## Requirements

- **Node.js** >= `24.15.0` (see `engines` in `package.json`)
- **pnpm** `11.1.1` (see `packageManager` in `package.json`)
- **MongoDB** — a running instance or a MongoDB Atlas connection string

---

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Copy the example env files and fill them in with your real values:

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env

# Frontends (point at your backend, default is http://localhost:5001)
cp apps/super-admin/.env.example apps/super-admin/.env
cp apps/sub-admin/.env.example apps/sub-admin/.env
cp apps/receptionist/.env.example apps/receptionist/.env
cp apps/kitchen/.env.example apps/kitchen/.env
cp apps/guest/.env.example apps/guest/.env
```

Required backend variables (see `apps/backend/.env.example`):

- `MONGODB_URI` — MongoDB connection string (required)
- `JWT_SECRET` — long random secret (required)
- `PORT` — defaults to `5000`, the frontends expect `5001`
- `JWT_EXPIRES_IN` — defaults to `1d`
- `CLIENT_URL` — allowed frontend origin
- `SUB_ADMIN_FRONTEND_URL` — base URL used when building invite / password
  reset links (defaults to `http://localhost:5175`)
- `NODE_ENV` — `development` (default) or `production`; controls log formatting
- `LOG_LEVEL` — minimum log level, defaults to `info` (e.g. `debug`, `warn`)

Never commit real `.env` files. The repository's `.gitignore` ignores `.env`
and keeps `.env.example` versions.

### 3. Seed the super admin

Run the seed script to create the first `SUPER_ADMIN` account:

```bash
pnpm seed -F backend
```

### 4. Run the development servers

```bash
pnpm dev
```

This starts all apps via Turborepo in parallel. Each app is served on its
own port:

| App            | Scope / Role                | Local URL               |
| -------------- | --------------------------- | ----------------------- |
| `backend`      | Express 5 API & MongoDB     | `http://localhost:5001` |
| `super-admin`  | Platform Operator Dashboard | `http://localhost:5173` |
| `sub-admin`    | Hotel Admin Dashboard       | `http://localhost:5174` |
| `receptionist` | Front-Desk Operations       | `http://localhost:5175` |
| `kitchen`      | Kitchen Display System      | `http://localhost:5176` |
| `guest`        | Guest Harmony Portal        | `http://localhost:5177` |

The backend health check is available at:

```text
GET http://localhost:5001/api/v1/health
```

---

## Scripts

All scripts run from the repository root:

| Command             | Description                                            |
| ------------------- | ------------------------------------------------------ |
| `pnpm dev`          | Start all apps in development mode (Turbo, persistent) |
| `pnpm build`        | Build all apps for production (Turbo, cached)          |
| `pnpm preview`      | Preview production builds locally                      |
| `pnpm lint`         | Lint the whole repo with oxlint                        |
| `pnpm lint:fix`     | Lint and auto-fix with oxlint                          |
| `pnpm format`       | Format all source files with Prettier                  |
| `pnpm format:check` | Check formatting without writing                       |

### Install pnpm

New to pnpm? If `pnpm` is not already installed on your machine, install it
globally with npm:

```bash
npm install -g pnpm
```

Check the installed version against the repo (see `packageManager` in
`package.json`, currently `11.1.1`):

```bash
pnpm --version
```

---

## pnpm & Turborepo explained

This repo uses **pnpm workspaces** (defined in `pnpm-workspace.yaml`) for
packaging and **Turborepo** (defined in `turbo.json`) to run tasks across all
workspaces efficiently.

- **`pnpm`** installs and manages dependencies for the whole monorepo. From
  the root, `pnpm install` installs everything at once and creates a shared
  lockfile (`pnpm-lock.yaml`).
- **`turbo`** runs the `dev` / `build` / `preview` scripts. Because all of
  these map to `turbo <task>`, you can run a task for **one**, **several**, or
  **all** workspaces from the root without ever changing directories.

### Running a task

| Command                                   | What it runs                                     |
| ----------------------------------------- | ------------------------------------------------ |
| `pnpm dev`                                | `dev` for **all** workspaces (Turbo, persistent) |
| `pnpm build`                              | `build` for **all** workspaces (Turbo, cached)   |
| `pnpm dev -F backend`                     | `dev` for **only** the backend                   |
| `pnpm dev -F super-admin`                 | `dev` for **only** the super admin app           |
| `pnpm build -F sub-admin -F receptionist` | `build` for **several** apps at once             |

The `-F` flag is Turbo's shorthand for `--filter <workspace>`. It can be
repeated to target multiple workspaces:

```bash
pnpm dev -F backend                        # one workspace
pnpm build -F sub-admin -F receptionist    # several workspaces at once
pnpm dev                                   # all workspaces
```

You never need to `cd` into an app to run it — always run these commands from
the repository root.

---

## Frontend <> backend wiring

Frontends talk to the backend using either the shared `@hotelos/api` client or
role-specific fetch wrappers:

- **`super-admin`**, **`sub-admin`**, and **`receptionist`** use the shared
  **`@hotelos/api`** package (`packages/api`). It reads `VITE_API_URL` (falls
  back to `http://localhost:5001`), attaches `Authorization: Bearer <token>`,
  unwraps responses, and handles automatic 401 logout.
- **`kitchen`** connects directly via `src/config/api.js` using
  `VITE_API_BASE_URL` (defaults to `http://localhost:5001/api`).
- **`guest`** connects via `src/config/api.ts` using `VITE_API_URL` (defaults to
  `http://localhost:5001/api/v1`).
- **`@hotelos/styles`** (`packages/styles`) provides centralized Tailwind CSS v4
  design tokens (brand, primary, surface color scales and semantic aliases)
  shared across frontends.

See `packages/api/README.md` and `packages/styles/README.md` for package details.

---

## Environment variables used by Turborepo

Turbo passes the following `globalEnv` variables into builds (see
`turbo.json`):

```text
PORT, NODE_ENV, MONGODB_URI, JWT_SECRET, JWT_EXPIRES_IN, CLIENT_URL,
FRONTEND_URL, EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER,
EMAIL_PASSWORD, SUPER_ADMIN_PASSWORD, VITE_API_URL
```

---

## Tooling & git hooks

- **oxlint** — configured at the root in `oxlint.config.ts`. Runs via
  `pnpm lint`.
- **Prettier** — configured in `.prettierrc.json` (semi-colons, double
  quotes, trailing commas, `printWidth: 80`, Tailwind plugin). Runs via
  `pnpm format`.
- **Husky + lint-staged** — a `pre-commit` hook runs Prettier on staged
  files. Configured in `package.json`.

---

## API design notes

All endpoints are versioned under `/api/v1`. Responses use a consistent
envelope and protected routes require a JWT Bearer token.

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Detailed endpoint documentation, DTOs, role permissions, and testing
examples live in [`apps/backend/README.md`](apps/backend/README.md).

---

## Learning path for a new developer

1. Read this README to understand the monorepo, roles, and architecture.
2. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) for branch strategy, PR workflow, and commit rules.
3. Read `apps/backend/README.md` for the full API contract.
4. Start the backend, hit `/api/v1/health`, then login and test a protected
   endpoint.
5. Open the app you own (`super-admin`, `sub-admin`, `receptionist`, `kitchen`, or `guest`) and read its README.
6. Read `packages/api/README.md` before writing API calls and `packages/styles/README.md` for design tokens.

The backend routes and controller contracts are the source of truth for
what is actually implemented — never guess an endpoint exists.

---

## Contributors & Documentation

Each app and package documents its own setup and scope:

- [Contributing Guidelines](CONTRIBUTING.md)
- [Backend](apps/backend/README.md)
- [Super Admin](apps/super-admin/README.md)
- [Sub Admin](apps/sub-admin/README.md)
- [Receptionist](apps/receptionist/README.md)
- [Kitchen](apps/kitchen/README.md)
- [Guest](apps/guest/README.md)
- [@hotelos/api](packages/api/README.md)
- [@hotelos/styles](packages/styles/README.md)

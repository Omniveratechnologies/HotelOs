# Super Admin Dashboard

The platform-operator dashboard for **HotelOS**. This is the React + Vite +
Tailwind CSS app used by `SUPER_ADMIN` accounts to manage the hotel network:
create hotels, manage subscriptions, and invite Sub Admins.

- Port: `5173`
- Package name: `super-admin`
- Backend: `apps/backend` (Express API on `5001`)

---

## Role

A **Super Admin** is a platform-level operator who works across all hotels.
Capabilities exercised in this app:

- Create hotels and manage their status (active / inactive)
- Set subscription dates & plan for each hotel
- Send Sub Admin invitations
- Manage hotels (details, credentials)

> The backend enforces authorization (`authorize("SUPER_ADMIN")`) on the
> hotel-management endpoints. A non-Super-Admin login is rejected by this
> app.

---

## Features / pages

| Route                | Page              | Notes                                                               |
| -------------------- | ----------------- | ------------------------------------------------------------------- |
| `/login`             | Login             | Super Admin sign-in; rejects non-`SUPER_ADMIN` roles                |
| `/`                  | Overview          | Dashboard home with summary stats + health check                    |
| `/hotels`            | Hotels            | Create hotels, list, activate/deactivate, credentials, Aiosell cfg  |
| `/channel-manager`   | Channel Manager   | Aiosell Live Matrix (rates, inventory, restrictions, property sync) |
| `/channel-approvals` | Channel Approvals | Verify queued roomCode & ratePlanCode mappings across hotels        |
| `/transactions`      | Transactions      | Food-transaction revenue per hotel (TanStack Query + mock data)     |
| `/subscriptions`     | Subscriptions     | Per-hotel plan & subscription dates (from backend hotels)           |
| `/service-requests`  | Service Requests  | Platform service request inbox (TanStack Query + mock data)         |
| `/settings`          | Settings          | Admin profile & preferences                                         |
| `/reset-password`    | ResetPassword     | Password reset                                                      |

---

## Current backend integration

All API calls go through the shared **`@hotelos/api`** package (`packages/api`) with data fetching managed by **TanStack Query v5** (`@hotelos/query`). Session tokens (`localStorage.auth_token`) are automatically passed via `Authorization: Bearer <token>`.

Feature hooks under `src/features/<feature>/hooks/`:

| Feature Hook                   | Purpose                                     | Backend / Source                                 |
| ------------------------------ | ------------------------------------------- | ------------------------------------------------ |
| `useHotels`                    | CRUD hotels, status, credentials, invites   | `GET/POST/PATCH/DELETE /hotels`, `POST /invites` |
| `useChannelManager`            | Channel config, live rates, inventory, sync | `/channel-manager/*` endpoints                   |
| `useSuperAdminDashboard`       | Platform overview metrics & system health   | `GET /health`, `/dashboard/*`                    |
| `useSuperAdminTransactions`    | Transaction summary metrics                 | `src/data/mockData.js` (Query hook wrapped)      |
| `useSuperAdminServiceRequests` | Platform service requests inbox             | `src/data/mockData.js` (Query hook wrapped)      |

Real-time cache invalidation is managed by `<RealtimeSubscriber />` via `@hotelos/socket`.

### Expected API shapes

The mock data documents the intended response shapes to work toward when the
backend modules are implemented.

**Hotel**

```json
{
  "id": "htl_001",
  "name": "The Grand Meridian",
  "email": "admin@grandmeridian.com",
  "status": "active",
  "createdAt": "2025-11-02",
  "subscription": {
    "plan": "Pro",
    "expiresOn": "2026-09-14",
    "status": "active"
  }
}
```

**Transaction summary row**

```json
{
  "id": "txn_1001",
  "hotelId": "htl_001",
  "hotelName": "The Grand Meridian",
  "amount": 84250,
  "transactions": 312,
  "lastTransactionAt": "2026-08-14"
}
```

**Service request**

```json
{
  "id": "req_501",
  "hotelName": "The Grand Meridian",
  "subject": "POS terminal not syncing",
  "priority": "high",
  "status": "open",
  "createdAt": "2026-08-14"
}
```

Enum values:

- `status` for hotels: `"active" | "deactivated"`
- `status` for subscriptions: `"active" | "expiring_soon" | "expired"`
- `status` for service requests: `"open" | "in_progress" | "resolved"`
- `priority` for service requests: `"high" | "medium" | "low"`

---

## Getting started

### 1. Install dependencies

From the repository root:

```bash
pnpm install
```

### 2. Configure the environment

Copy the example env file and point it at your backend:

```bash
cp apps/super-admin/.env.example apps/super-admin/.env
```

```text
VITE_API_URL=http://localhost:5001
```

### 3. Run the dev server

```bash
pnpm dev -F super-admin
```

Open `http://localhost:5173`. (Or run everything with `pnpm dev` from the
root.)

> New to pnpm / Turbo? `pnpm <task> -F <workspace>` is Turbo's
> `--filter` shorthand (task first, filter after), run from the repository
> root. If pnpm isn't installed, run `npm install -g pnpm` first. See the root
> `README.md` ("pnpm & Turborepo explained") for details.

---

## Build for production

```bash
pnpm build -F super-admin
```

Outputs static files to `dist/` — deploy to any static host or serve behind
your backend.

---

## Project structure

```
src/
│
├── app/
│   ├── App.jsx             Root application entry
│   ├── AppProviders.jsx    QueryProvider & RealtimeSubscriber
│   ├── AuthLayout.jsx      Unauthenticated auth shell
│   ├── router.jsx          Lazy-loaded React Router routes
│   └── layouts/            DashboardLayout with Header & Sidebar
│
├── components/             Shared UI widgets & modals
├── data/
│   └── mockData.js         Mock datasets for transactions & service requests
│
├── features/               Domain feature modules
│   ├── auth/               Login, ResetPassword, session hooks
│   ├── channel-approvals/  Approval queue, filter bar, verification actions
│   ├── channel-manager/    AiosellLiveMatrix, rates, inventory & sync
│   ├── dashboard/          Overview cards, metrics, health status
│   ├── hotels/             HotelsPage, CreateHotelModal, EditHotelModal
│   ├── service-requests/   Service request inbox & details
│   ├── settings/           Admin profile & preferences
│   ├── subscriptions/      Subscription plans & expiry management
│   └── transactions/       Revenue feeds & transaction metrics
│
├── index.css               Tailwind CSS v4 theme entry
└── main.jsx                Vite entry point
```

---

## Environment variables

| Variable       | Description                           | Default                                     |
| -------------- | ------------------------------------- | ------------------------------------------- |
| `VITE_API_URL` | Backend base URL (see `.env.example`) | `http://localhost:5001` (in `@hotelos/api`) |

---

## Tech stack

- React 19 + Vite (`@tailwindcss/vite`)
- Tailwind CSS v4 + `@hotelos/styles`
- React Router (lazy-loaded routes)
- lucide-react icons
- `@hotelos/api` shared client
- `@hotelos/query` (TanStack Query v5)
- `@hotelos/socket` (Socket.IO client & realtime sync)
- `@hotelos/stores` (Zustand)
- `@hotelos/ui` (Header, Sidebar, ErrorScreen)
- `@hotelos/utils` (Formatters, helpers)

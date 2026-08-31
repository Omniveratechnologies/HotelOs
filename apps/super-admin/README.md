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

| Route               | Page             | Notes                                                     |
| ------------------- | ---------------- | --------------------------------------------------------- |
| `/login`            | Login            | Super Admin sign-in; rejects non-`SUPER_ADMIN` roles      |
| `/`                 | Overview         | Dashboard home with summary stats + health check          |
| `/hotels`           | Hotels           | Create hotels, list, activate/deactivate, credentials     |
| `/transactions`     | Transactions     | Food-transaction revenue per hotel — **mock data**        |
| `/subscriptions`    | Subscriptions    | Per-hotel plan & subscription dates (from backend hotels) |
| `/service-requests` | Service Requests | Inbox of hotel requests — **mock data**                   |
| `/settings`         | Settings         | Admin profile & preferences                               |
| `/reset-password`   | ResetPassword    | Password reset                                            |

---

## Current backend integration

All API calls go through the shared **`@hotelos/api`** package
(`packages/api`), which reads `VITE_API_URL` and attaches the
`Authorization` header from `localStorage.auth_token` when `{ auth: true }`
is passed.

Domain service files in `src/services/`:

| File                         | Purpose                                        | Backend                                          |
| ---------------------------- | ---------------------------------------------- | ------------------------------------------------ |
| `auth.service.js`            | Login, logout, session helpers                 | `POST /auth/login`                               |
| `hotel.service.js`           | CRUD hotels, status, credentials, invites      | `GET/POST/PATCH/DELETE /hotels`, `POST /invites` |
| `subscriptions.service.js`   | Subscription view (derived from hotel records) | `GET/PATCH /hotels`                              |
| `user.service.js`            | Create staff users                             | `POST /users`                                    |
| `dashboard.service.js`       | Health check                                   | `GET /health`                                    |
| `transactions.service.js`    | **Mock data** — not yet connected              | —                                                |
| `serviceRequests.service.js` | **Mock data** — not yet connected              | —                                                |

Transactions and Service Requests currently read from in-memory mock data in
`src/data/mockData.js`. Wire these to real endpoints (e.g. `/api/v1/...`)
when the backend modules are implemented.

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
├── App.jsx                 Route definitions / providers
├── main.jsx                Vite entry point
├── index.css               Global styles (Tailwind)
│
├── components/             Reusable UI & layout components
├── data/
│   └── mockData.js         Mock data for Transactions & Service Requests
├── hooks/                  Custom hooks
│
├── pages/
│   ├── Login.jsx           Super Admin login
│   ├── Overview.jsx        Dashboard home
│   ├── Hotels.jsx          Hotel list + create/status/credentials
│   ├── Transactions.jsx    Food-transaction revenue
│   ├── Subscriptions.jsx   Subscription expiry tracking
│   ├── ServiceRequests.jsx Hotel service request inbox
│   ├── Settings.jsx        Admin profile & preferences
│   └── ResetPassword.jsx   Password reset
│
└── services/               Domain API calls (see table above)
```

---

## Environment variables

| Variable       | Description                           | Default                                     |
| -------------- | ------------------------------------- | ------------------------------------------- |
| `VITE_API_URL` | Backend base URL (see `.env.example`) | `http://localhost:5001` (in `@hotelos/api`) |

---

## Tech stack

- React 19 + Vite
- Tailwind CSS v4
- React Router
- lucide-react icons
- `@hotelos/api` shared client

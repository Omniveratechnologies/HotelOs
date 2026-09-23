# Sub Admin Dashboard

The hotel-level administration app for **HotelOS**. It combines a marketing
site with the `SUB_ADMIN` dashboard used to run a single hotel. A Sub Admin
is tied to exactly one hotel — hotel ownership is always derived from the
authenticated user's JWT, never from the frontend.

- Port: `5174`
- Package name: `sub-admin`
- Backend: `apps/backend` (Express API on `5001`)
- Brand palette: navy / antique-gold / ivory

---

## Role

A **Sub Admin** manages one hotel. Capabilities exercised in this app:

- Log in to the Sub Admin dashboard
- View hotel dashboard stats (rooms, guests, occupancy, staff, activity)
- Invite Receptionist staff to the hotel
- Manage (list/delete) hotel members / staff
- Manage room types and room inventory with `roomCode` mappings
- Manage rate plans with Aiosell live comparison matrix & sync
- Monitor channel approval queue status (`under_review`)
- Configure hotel settings (profile, policies, Aiosell room types)
- Accept a pending invitation and choose credentials
- Recover username / reset password

> The backend enforces that a Sub Admin can only interact with users,
> rooms, guests and stats belonging to their own hotel.

---

## Features / pages

### Public / auth

| Route                                   | Page             | Notes                                                  |
| --------------------------------------- | ---------------- | ------------------------------------------------------ |
| `/`                                     | Landing          | Marketing page (hero, features, pricing, testimonials) |
| `/login`                                | Login            | Sub Admin sign-in; rejects non-`SUB_ADMIN` roles       |
| `/accept-invitation`                    | AcceptInvitation | Accept an emailed invitation, set credentials          |
| `/reset-password`                       | ResetPassword    | Reset password via emailed token                       |
| `/forgot-username` / `/forgot-password` | Recovery         | Request username reminder / password reset             |

### Authenticated dashboard

| Route                   | Page       | Notes                                                              |
| ----------------------- | ---------- | ------------------------------------------------------------------ |
| `/dashboard`            | Dashboard  | Stat cards + recent activity feed (from `/dashboard/stats`)        |
| `/dashboard/members`    | Members    | List / delete hotel staff (e.g. Receptionists), send invitations   |
| `/dashboard/rooms`      | Rooms      | Room list, CRUD modals with `roomCode` & channel status indicators |
| `/dashboard/room-types` | Room Types | Room types CRUD & Aiosell mapping (`under_review` badges)          |
| `/dashboard/rate-plans` | Rate Plans | Rate plans CRUD, code generator & Aiosell live rates matrix        |
| `/dashboard/settings`   | Settings   | Hotel profile, check-in/out policies, Aiosell property setup       |

---

## Current backend integration

All API calls go through the shared **`@hotelos/api`** package (`packages/api`) with data fetching managed by **TanStack Query v5** (`@hotelos/query`). Session tokens (`localStorage.auth_token`) are automatically passed via `Authorization: Bearer <token>`.

Feature hooks under `src/features/<feature>/hooks/`:

| Feature Hook           | Purpose                                          | Backend                                          |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------ |
| `useSubAdminDashboard` | Dashboard stats & recent activity                | `GET /dashboard/stats`                           |
| `useMembers`           | Staff listing, invitations, deletion             | `GET/DELETE /users`, `POST /invites`             |
| `useRooms`             | Room CRUD & roomCode mappings                    | `GET/POST/PATCH/DELETE /rooms`                   |
| `useRoomTypes`         | Room types CRUD & channel approval               | `GET/POST/PATCH/DELETE /room-types`              |
| `useRatePlans`         | Rate plans CRUD & Aiosell live matrix            | `GET/POST/PATCH/DELETE /rate-plans`, sync        |
| `useHotelSettings`     | Hotel profile & Aiosell room types query         | `GET/PATCH /hotels/me`, aiosell room types       |
| `useSubAdminOS`        | Composite hook aggregating all sub-admin queries | Facade over feature hooks for unified view state |

Real-time query invalidation is handled by `<RealtimeSubscriber />` via `@hotelos/socket`.

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
cp apps/sub-admin/.env.example apps/sub-admin/.env
```

```text
VITE_API_URL=http://localhost:5001
```

### 3. Run the dev server

```bash
pnpm dev -F sub-admin
```

Open `http://localhost:5174`. (Or run everything with `pnpm dev` from the
root.)

> New to pnpm / Turbo? `pnpm <task> -F <workspace>` is Turbo's
> `--filter` shorthand (task first, filter after), run from the repository
> root. If pnpm isn't installed, run `npm install -g pnpm` first. See the root
> `README.md` ("pnpm & Turborepo explained") for details.

---

## Build for production

```bash
pnpm build -F sub-admin
pnpm preview -F sub-admin
```

---

## Project structure

```
src/
│
├── app/
│   ├── App.jsx             Root application entry
│   ├── AuthLayout.jsx      Auth layout shell
│   ├── providers.jsx       Global QueryProvider & RealtimeSubscriber
│   ├── router/             React Router configuration
│   ├── layouts/            HotelLayout with Header & Sidebar
│   └── useSubAdminOS.js    Re-export for backward compatibility
│
├── components/             Shared UI pieces (ChannelStatusBadge, StatCard)
├── hooks/
│   └── useSubAdminOS.js    Composite hook aggregating all feature hooks
│
├── features/               Domain feature modules
│   ├── auth/               Login, AcceptInvitation, ResetPassword
│   ├── dashboard/          Overview stat cards, metrics, activity feed
│   ├── landing/            Public marketing site
│   ├── members/            Staff list, invite receptionist, member actions
│   ├── rate-plans/         Rate plans CRUD & AiosellRatesMatrix
│   ├── room-types/         Room types CRUD & Aiosell mapping
│   ├── rooms/              Room CRUD with roomCode & status badges
│   └── settings/           Hotel profile, notifications & Aiosell room types
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
- React Router
- `@hotelos/api` shared client
- `@hotelos/query` (TanStack Query v5)
- `@hotelos/socket` (Socket.IO realtime sync)
- `@hotelos/stores` (Zustand UI stores)
- `@hotelos/ui` (Header, Sidebar, ErrorScreen)
- `@hotelos/utils` (Rate plan code helpers, formatters, cn)

## Brand palette

The app is styled with a navy / antique-gold / ivory palette:

| Token      | Hex       |
| ---------- | --------- |
| Navy       | `#22324E` |
| Navy Dark  | `#1E3252` |
| Gold       | `#766242` |
| Gold Hover | `#826A42` |
| Ivory      | `#F4F4E4` |
| Cream      | `#FCFCFC` |
| Beige      | `#ECECE4` |
| Border     | `#E4E4DC` |
| Muted text | `#8A8878` |

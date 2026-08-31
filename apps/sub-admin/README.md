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

| Route                | Page      | Notes                                                       |
| -------------------- | --------- | ----------------------------------------------------------- |
| `/dashboard`         | Dashboard | Stat cards + recent activity feed (from `/dashboard/stats`) |
| `/dashboard/members` | Members   | List / delete hotel staff (e.g. Receptionists)              |

---

## Current backend integration

All API calls go through the shared **`@hotelos/api`** package
(`packages/api`), reading `VITE_API_URL` and attaching the
`Authorization` header from `localStorage.auth_token` when `{ auth: true }`
is passed.

Domain service files in `src/services/`:

| File                    | Purpose                                       | Backend                                                      |
| ----------------------- | --------------------------------------------- | ------------------------------------------------------------ |
| `auth.service.js`       | Login, session helpers, forgot/reset password | `POST /auth/login`, `/auth/forgot-*`, `/auth/reset-password` |
| `dashboard.service.js`  | Dashboard stats                               | `GET /dashboard/stats`                                       |
| `invitation.service.js` | Send Receptionist invite, verify/accept       | `POST /invites`, `/invites/verify`, `/invites/accept`        |
| `member.service.js`     | List / delete hotel members                   | `GET/DELETE /users`                                          |

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
│   ├── App.jsx             Provider & layout wiring
│   ├── AuthLayout.jsx      Auth-page layout
│   ├── router.jsx          Route definitions
│   ├── providers.jsx       Global providers
│   ├── subAdminContext.js  Sub Admin session context
│   └── ErrorScreen.jsx     Error boundary / fallback
│
├── components/             Reusable UI pieces
├── layouts/                App shell (sidebar, topbar, etc.)
│
├── pages/
│   ├── landing/LandingPage.jsx     Marketing site
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   ├── AcceptInvitationPage.jsx
│   │   └── ResetPasswordPage.jsx
│   └── dashboard/
│       ├── DashboardPage.jsx       Summary stats + activity
│       └── MembersPage.jsx         Hotel staff management
│
├── services/               Domain API calls (see table above)
└── index.css               Tailwind + global styles
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
- `@hotelos/api` shared client

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

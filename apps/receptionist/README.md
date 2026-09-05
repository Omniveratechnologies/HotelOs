# Receptionist Dashboard

The front-desk dashboard for **HotelOS**. This is the React + Vite + Tailwind
CSS app used by `RECEPTIONIST` staff to run a hotel's daily operations:
manage rooms, register guests at check-in, and view housekeeping, food
orders, and reports.

- Port: `5175`
- Package name: `receptionist`
- Backend: `apps/backend` (Express API on `5001`)

---

## Role

A **Receptionist** works at the front desk of one hotel. Capabilities
exercised in this app:

- Log in (and accept an emailed invitation to set credentials)
- View hotel dashboard stats
- Manage rooms (create, update status, delete)
- Register guests (with optional ID documents), check guests in/out,
  manage guest details and credentials
- View food orders and housekeeping queues
- View reports
- Manage hotel settings (contact details, check-in/check-out times)

> Room and guest data is always scoped to the receptionist's own hotel by
> the backend via `req.user.hotelId`.

---

## Features / pages

### Auth

| Route                                   | Page             | Notes                                                  |
| --------------------------------------- | ---------------- | ------------------------------------------------------ |
| `/login`                                | Login            | Receptionist sign-in; rejects non-`RECEPTIONIST` roles |
| `/accept-invitation`                    | AcceptInvitation | Accept an emailed invitation, set credentials          |
| `/forgot-username` / `/forgot-password` | Recovery         | Request username reminder / password reset             |

### Dashboard

| Area         | Page                            | Notes                                            |
| ------------ | ------------------------------- | ------------------------------------------------ |
| Dashboard    | `dashboard/DashboardPage`       | Summary stats + activity feed                    |
| Guests       | `guests/GuestsPage`             | List / register / check-in / check-out guests    |
| Rooms        | `rooms/RoomsPage`               | Room list + add / update / delete (modals)       |
| Food Orders  | `food-orders/FoodOrdersPage`    | Food order queue                                 |
| Housekeeping | `housekeeping/HousekeepingPage` | Housekeeping queue                               |
| Reports      | `reports/ReportsPage`           | Reports                                          |
| Settings     | `settings/SettingsPage`         | Hotel contact details, check-in/out times, staff |

---

## Current backend integration

All API calls go through the shared **`@hotelos/api`** package
(`packages/api`), reading `VITE_API_URL` and attaching the
`Authorization` header from `localStorage.auth_token` when `{ auth: true }`
is passed. Guest documents are uploaded directly to Cloudflare R2 via
presigned URLs.

Domain service files in `src/services/`:

| File                    | Purpose                                        | Backend                                                                                                                                                 |
| ----------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.service.js`       | Login, session helpers, forgot/reset password  | `POST /auth/login`, `/auth/forgot-*`                                                                                                                    |
| `invitation.service.js` | Verify / accept invitation                     | `POST /invites/verify`, `/invites/accept`                                                                                                               |
| `dashboard.service.js`  | Dashboard stats                                | `GET /dashboard/stats`                                                                                                                                  |
| `room.service.js`       | Room CRUD                                      | `GET/POST/PATCH/DELETE /rooms`                                                                                                                          |
| `guest.service.js`      | Guest stays + profiles, documents, credentials | `GET/POST/PATCH/DELETE /bookings`, `PATCH /guests/:id`, `/guests/:id/credentials`, `/guests/documents/upload-urls`, `/guests/:guestId/documents/:docId` |
| `settings.service.js`   | My hotel + staff                               | `GET/PATCH /hotels/me`, `GET /users`                                                                                                                    |

---

## Guest registration & documents

Registering a guest creates a **stay** (a `Booking`) and a fresh `GUEST`
login account for that stay. Use `POST /api/v1/bookings` with a JSON body.

ID documents are uploaded directly to Cloudflare R2 via presigned URLs:

1. Call `POST /api/v1/guests/documents/upload-urls` with the files'
   metadata to get upload URLs.
2. PUT each file to its returned `uploadUrl`.
3. Include the returned keys (`{ key, filename, docType, size, mimeType }`)
   as the `documents` field of the registration request.

Document upload constraints (enforced by the backend):

- Allowed types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`
- Max file size: **5 MB** each
- Max **5 files** per request

> Each stay creates its own guest login with a unique username; the same
> email may be reused across stays (e.g. a returning guest books again).

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
cp apps/receptionist/.env.example apps/receptionist/.env
```

```text
VITE_API_URL=http://localhost:5001
```

### 3. Run the dev server

```bash
pnpm dev -F receptionist
```

Open `http://localhost:5175`. (Or run everything with `pnpm dev` from the
root.)

> New to pnpm / Turbo? `pnpm <task> -F <workspace>` is Turbo's
> `--filter` shorthand (task first, filter after), run from the repository
> root. If pnpm isn't installed, run `npm install -g pnpm` first. See the root
> `README.md` ("pnpm & Turborepo explained") for details.

---

## Build for production

```bash
pnpm build -F receptionist
pnpm preview -F receptionist
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
│   └── ErrorScreen.jsx     Error boundary / fallback
│
├── components/             Reusable UI pieces
│
├── layouts/
│   └── DashboardLayout.jsx Authenticated app shell
│
├── pages/
│   ├── auth/               Login, AcceptInvitation, recovery
│   ├── dashboard/DashboardPage.jsx
│   ├── guests/GuestsPage.jsx
│   ├── rooms/RoomsPage.jsx (+ AddRoomModal)
│   ├── food-orders/FoodOrdersPage.jsx
│   ├── housekeeping/HousekeepingPage.jsx
│   ├── reports/ReportsPage.jsx
│   └── settings/SettingsPage.jsx
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
- lucide-react icons
- `@hotelos/api` shared client

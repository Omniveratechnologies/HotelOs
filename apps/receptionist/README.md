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
- Manage rooms (create, update status, delete, assign roomCode)
- Manage room types and rate plans with Aiosell rates matrix
- Monitor channel approval indicators (`under_review`)
- Register guests (with optional ID documents), check guests in/out,
  manage guest details and credentials
- View food orders and housekeeping queues
- View operational reports
- Manage hotel settings (contact details, check-in/check-out times, Aiosell room types)
- Monitor lobby kiosk terminals, view live online/offline presence and battery level, and toggle front-desk maintenance mode ("Turn On Maintenance" / "Turn Off Maintenance")

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

### Dashboard & Front Desk Operations

| Area         | Page                                    | Notes                                                           |
| ------------ | --------------------------------------- | --------------------------------------------------------------- |
| Dashboard    | `dashboard/DashboardPage`               | Summary stats, live activity feed & interactive Room Grid       |
| Front Desk   | `front-desk/pages/FrontDeskCheckInPage` | Arrival queue, keycard assignment & available room selector     |
| Front Desk   | `front-desk/pages/GuestCheckOutPage`    | Departure queue, folio review, and settlement checkout          |
| Guests       | `guests/GuestsPage`                     | List / register / check-in / check-out guests                   |
| Rooms        | `rooms/RoomsPage`                       | Room list + add / update / delete (with `roomCode` mapping)     |
| Room Types   | `room-types/RoomTypesPage`              | Room types listing & modal                                      |
| Rate Plans   | `rate-plans/RatePlansPage`              | Rate plans CRUD & Aiosell live rates matrix                     |
| Food Orders  | `food-orders/FoodOrdersPage`            | Realtime food order queue                                       |
| Housekeeping | `housekeeping/HousekeepingPage`         | Realtime housekeeping / service request queue                   |
| Kiosks       | `management/pages/KioskDevicesPage`     | Monitor lobby terminals, view online status, toggle maintenance |
| Reports      | `reports/ReportsPage`                   | Daily performance & occupancy reports                           |
| Settings     | `settings/SettingsPage`                 | Hotel contact details, check-in/out times, staff                |

---

## Front Desk Room Grid Check-Out Workflow

When viewing rooms on the Dashboard Room Grid or the Rooms page:

1. Clicking an **Occupied** room opens `RoomModal.jsx`.
2. Selecting **Check Out** and clicking **Confirm Check Out** invokes `checkOutRoom(room.id)` via `POST /api/v1/rooms/:id/check-out`.
3. The backend:
   - Locates all active bookings for that room (`status: "checked-in"`) and transitions them to `status: "checked-out"`.
   - Switches the room status to `cleaning`, clearing `currentGuest`.
   - Deactivates and returns assigned KeyCards.
   - Creates a high-priority turnover Housekeeping task.
   - Pushes real-time Socket.IO event `kiosk:guest-checked-out` to reset in-room tablets to standby mode.
4. TanStack Query automatically invalidates `rooms`, `reservations`, `guests`, `dashboard.stats()`, and `front-desk` caches, ensuring instant UI synchronization across the front-desk console.

---

## Front Desk Check-In Room Assignment

During guest check-in at `/front-desk/check-in`:

- The room selector queries `GET /api/v1/rooms?status=available`, displaying only clean vacant rooms ready for occupancy.
- On check-in submission, the backend automatically transitions any prior stale `checked-in` bookings for that room to `checked-out`, permanently safeguarding against duplicate active room stays.

---

## Current backend integration

All API calls go through the shared **`@hotelos/api`** package (`packages/api`) with server state managed by **TanStack Query v5** (`@hotelos/query`). Session tokens (`localStorage.auth_token`) are automatically passed via `Authorization: Bearer <token>`. Guest documents are uploaded directly to Cloudflare R2 via presigned URLs.

Feature hooks under `src/features/<feature>/hooks/`:

| Feature Hook         | Purpose                                        | Backend                                                                                            |
| -------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `useRooms`           | Room CRUD & roomCode mappings                  | `GET/POST/PATCH/DELETE /rooms`                                                                     |
| `useRoomTypes`       | Room types CRUD & mapping                      | `GET/POST/PATCH/DELETE /room-types`                                                                |
| `useRatePlans`       | Rate plans CRUD & Aiosell matrix               | `GET/POST/PATCH/DELETE /rate-plans`, sync                                                          |
| `useGuests`          | Guest stays, profiles, check-in/out, documents | `GET/POST/PATCH/DELETE /bookings`, `PATCH /guests/:id`, `/guests/documents/upload-urls`            |
| `useOrders`          | Food orders & food items                       | `GET /orders/staff`, `POST /orders/desk`, `PATCH /orders/:id/status`, `GET /food-items`            |
| `useServiceRequests` | Housekeeping & service requests                | `GET /service-requests/staff`, `POST /service-requests/desk`, `PATCH /service-requests/:id/status` |
| `useReports`         | Aggregated operational report metrics          | Derived from rooms, guests, and orders queries                                                     |
| `useHotelSettings`   | Hotel info & Aiosell room types                | `GET/PATCH /hotels/me`, `GET /users`                                                               |
| `useHotelOS`         | Composite facade hook aggregating hotel state  | Facade over feature queries for unified state access                                               |

Real-time WebSocket events are synchronized into the TanStack Query cache via `<RealtimeSubscriber />` and `@hotelos/socket`.

---

## Realtime data (WebSocket)

Food Orders and Housekeeping (Service Requests) pages show **live backend
data**, not local mocks. The app connects to the backend's Socket.IO server
with `{ auth: { token } }`, the backend joins the socket to the hotel's room,
and the app merges these events into its lists:

| Event                    | Effect                                            |
| ------------------------ | ------------------------------------------------- |
| `order:created`          | New prepend / update in the Food Orders feed      |
| `order:updated`          | Live status change (incl. kitchen updates)        |
| `serviceRequest:created` | New prepend / update in the Service Requests feed |
| `serviceRequest:updated` | Live status change                                |

The lists are also refetched whenever the socket (re)connects so events emitted
while offline are never permanently missed. Sidebar badges and dashboard panels
derive from the same live state, so they update automatically.

New orders placed from the modal use `POST /orders/desk` (COD-only, billed to
the room), and new service requests use `POST /service-requests/desk` — the
backend resolves the guest from the room's active stay; the frontend never
sends a `hotelId` or `guestId`.

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
│   ├── App.jsx             Root application entry
│   ├── AuthLayout.jsx      Auth layout shell
│   ├── providers/          Global QueryProvider & RealtimeSubscriber
│   ├── router/             React Router configuration
│   ├── layouts/            DashboardLayout with Header & Sidebar
│   └── useHotelOS.js       Re-export for backward compatibility
│
├── hooks/
│   └── useHotelOS.js       Composite facade hook aggregating hotel state
│
├── features/               Domain feature modules
│   ├── auth/               Login, AcceptInvitation, recovery
│   ├── dashboard/          Summary stats & activity feed
│   ├── food-orders/        FoodOrdersPage, order details modal, menu
│   ├── guests/             GuestsPage, guest documents, credentials
│   ├── housekeeping/       HousekeepingPage, service requests
│   ├── rate-plans/         RatePlansPage, RatePlanModal, AiosellRatesMatrix
│   ├── reports/            ReportsPage, occupancy and revenue analytics
│   ├── room-types/         RoomTypesPage, RoomTypeModal
│   ├── rooms/              RoomsPage, AddRoomModal (with roomCode)
│   └── settings/           SettingsPage, hotel info & Aiosell room types
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
- lucide-react icons
- `@hotelos/api` shared client
- `@hotelos/query` (TanStack Query v5)
- `@hotelos/socket` (Socket.IO realtime sync)
- `@hotelos/stores` (Zustand UI stores)
- `@hotelos/ui` (Header, Sidebar, ErrorScreen)
- `@hotelos/utils` (Rate plan code helpers, normalizers, formatters, cn)

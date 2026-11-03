# Receptionist Dashboard & Desktop App

The front-desk dashboard for **HotelOS**, supporting both **Web browsers** and **Electron Desktop** (Windows, macOS, Linux) from a single shared React codebase. This application is used by `RECEPTIONIST` staff to run daily hotel operations: manage rooms, check guests in/out, monitor housekeeping and food orders, view operational reports, and trigger native printing.

- Port: `5175`
- Package name: `receptionist`
- Backend: `apps/backend` (Express API on `5001`)
- Targets: Web (Vite SPA) & Desktop (Electron 45)

---

## Dual-Target Architecture (Web + Electron)

The application maintains a single, unified React 19 frontend that runs seamlessly in modern web browsers and as a native desktop application.

```
apps/receptionist/
├── src/                    # Shared React frontend
│   ├── platform/           # Symmetrical platform abstraction layer
│   │   ├── types.ts        # PlatformAPI interface definition
│   │   ├── web.ts          # Browser implementation (window.print, window.open)
│   │   ├── electron.ts     # Desktop implementation (defensive window.desktop delegation)
│   │   └── index.ts        # Unified platform selector (platformAPI, isDesktop)
│   └── vite-env.d.ts       # Global Window.desktop types
├── electron/               # Electron Desktop Layer (TypeScript)
│   ├── main.ts             # Main process (window lifecycle, SPA protocol, IPC)
│   ├── preload.ts          # Isolated contextBridge bridge exposing window.desktop
│   └── dev.ts              # Development runner & Vite orchestrator
├── electron-builder.json   # Cross-platform desktop packaging configuration
└── tsconfig.*.json         # TypeScript 6 project references (supporting TS + JS)
```

### Platform Abstraction Layer (`src/platform/`)

Instead of coupling UI components directly to Electron or browser globals, components consume the strongly-typed `platformAPI`:

```typescript
import { platformAPI, isDesktop } from "./platform";

// Check runtime environment
console.log(isDesktop ? "Running in Electron" : "Running in Web Browser");

// Trigger printing (native print on desktop or window.print in browser)
await platformAPI.print();

// Open external links securely in the default OS browser
await platformAPI.openExternal("https://hotelos.com");

// Open native file dialog (desktop only; gracefully returns null in browser)
const filePath = await platformAPI.openFile();

// Retrieve app version
const version = await platformAPI.getAppVersion();
```

### Electron Security & SPA Architecture

- **Strict Isolation**: Runs with `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: true`. No Node.js APIs or unrestricted IPC channels are exposed to the React renderer.
- **SPA Custom Scheme (`app://localhost`)**: In packaged desktop builds, Electron intercepts requests to `app://localhost/` and serves pre-bundled static assets from `dist/` with automatic fallback to `index.html`. This allows standard React Router `createBrowserRouter` HTML5 history routes (`/reservations`, `/billing`, `/login`) to work offline and survive window reloads without 404 errors.
- **External Link Interception**: External hyperlinks (`http:`, `https:`, `mailto:`) are captured and delegated to the host OS default browser via `shell.openExternal`.
- **Clean Interface**: The default application menu bar (`File`, `Edit`, `View`, `Window`) is permanently removed for a clean, modern dashboard view.

---

## Role

A **Receptionist** works at the front desk of one hotel. Capabilities exercised in this app:

- Log in (and accept an emailed invitation to set credentials)
- View hotel dashboard stats
- Manage rooms (create, update status, delete, assign roomCode)
- Manage room types and rate plans with Aiosell rates matrix
- Monitor channel approval indicators (`under_review`)
- Register guests (with optional ID documents), check guests in/out, manage guest details and credentials
- View food orders and housekeeping queues
- View operational reports
- Manage hotel settings (contact details, check-in/check-out times, Aiosell room types)
- Monitor lobby kiosk terminals, view live online/offline presence and battery level, and toggle front-desk maintenance mode ("Turn On Maintenance" / "Turn Off Maintenance")

> Room and guest data is always scoped to the receptionist's own hotel by the backend via `req.user.hotelId`.

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

| Feature Hook        | Purpose                                        | Backend                                         |
| ------------------- | ---------------------------------------------- | ----------------------------------------------- |
| `useRooms`          | Room CRUD & roomCode mappings                  | `GET/POST/PATCH/DELETE /rooms`                  |
| `useRoomTypes`      | Room types CRUD & mapping                      | `GET/POST/PATCH/DELETE /room-types`             |
| `useRatePlans`      | Rate plans CRUD & Aiosell matrix               | `GET/POST/PATCH/DELETE /rate-plans`, sync       |
| `useGuests`         | Guest list & check-in / check-out actions      | `GET/POST /guests`, `POST /guests/:id/check-in` |
| `useGuestSearch`    | Guest autocomplete for check-in                | `GET /guests/search?query=`                     |
| `useAvailableRooms` | Vacant clean rooms for check-in allocation     | `GET /rooms?status=available`                   |
| `useFoodOrders`     | Realtime kitchen order queue                   | `GET /food-orders`, updates via socket          |
| `useHousekeeping`   | Housekeeping tickets & room turnover           | `GET/POST/PATCH /housekeeping`                  |
| `useKioskDevices`   | Lobby terminal monitoring & maintenance toggle | `GET /kiosks`, `POST /kiosks/:id/maintenance`   |
| `useReports`        | Daily performance & occupancy analytics        | `GET /reports`                                  |
| `useHotelSettings`  | Hotel contact info, check-in/out times         | `GET/PATCH /hotels/settings`                    |

---

## Development

### 1. Install dependencies

From the monorepo root:

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
VITE_FRONTEND_URL=http://localhost:5175
```

### 3. Run Web Development Server

```bash
# From repository root:
pnpm dev -F receptionist

# Or from apps/receptionist:
pnpm dev
```

Open `http://localhost:5175` in your browser.

### 4. Run Desktop (Electron) Development

```bash
# From repository root:
pnpm --filter receptionist dev:electron

# Or from apps/receptionist:
pnpm dev:electron
```

The Electron development orchestrator (`electron/dev.ts`):

1. Detects whether Vite is already running on port `5175`. If not, it automatically spawns Vite in the background.
2. Compiles `electron/main.ts`, `electron/preload.ts`, and `electron/dev.ts` using esbuild into `dist-electron/`.
3. Launches the Electron desktop window connected to `http://localhost:5175` with live Hot Module Replacement (HMR).
4. Automatically shuts down the Vite dev server when the Electron window closes.

### 5. Type Checking

```bash
pnpm --filter receptionist typecheck
```

Runs TypeScript 6 project references (`tsc -b`), validating all `.ts` files and verifying JavaScript coexistence without emitting code.

---

## Production Builds & Packaging

### 1. Web Production Build

```bash
pnpm build -F receptionist
pnpm preview -F receptionist
```

Compiles the frontend via `tsc -b && vite build` into `dist/`.

### 2. Desktop Packaging (Unpacked Directory)

```bash
# From repository root:
pnpm --filter receptionist pack:electron

# Or from apps/receptionist:
pnpm pack:electron
```

Builds the web bundle, compiles electron scripts, and generates an unpacked standalone application in:
`apps/receptionist/release/win-unpacked/HotelOS Receptionist.exe`

### 3. Desktop Production Installers

```bash
# Windows: NSIS Installer (.exe) & Portable (.exe)
pnpm --filter receptionist build:electron:win

# macOS: DMG (.dmg) & ZIP (.zip)
pnpm --filter receptionist build:electron:mac

# Linux: AppImage (.AppImage) & Debian (.deb)
pnpm --filter receptionist build:electron:linux

# All configured targets
pnpm --filter receptionist build:electron
```

Packaged installers and binaries are generated in `apps/receptionist/release/`.

---

## Project structure

```
apps/receptionist/
├── dist/                   # Built production web client
├── dist-electron/          # Compiled Electron main and preload scripts
├── release/                # Packaged desktop executables and installers
│
├── electron/               # Electron main process source (TypeScript)
│   ├── dev.ts              # Development runner & Vite server orchestrator
│   ├── main.ts             # Main process (window, SPA protocol, IPC)
│   └── preload.ts          # Isolated preload script exposing window.desktop
│
├── src/                    # Shared React application source
│   ├── app/
│   │   ├── App.jsx         Root application entry
│   │   ├── AuthLayout.jsx  Auth layout shell
│   │   ├── providers/      Global QueryProvider & RealtimeSubscriber
│   │   ├── router/         React Router configuration (createBrowserRouter)
│   │   └── layouts/        DashboardLayout with Header & Sidebar
│   │
│   ├── platform/           # Symmetrical platform abstraction layer
│   │   ├── types.ts        PlatformAPI interface definition
│   │   ├── web.ts          Browser implementation (window.print, window.open)
│   │   ├── electron.ts     Desktop implementation (defensive window.desktop delegation)
│   │   └── index.ts        Unified platform selector & exports
│   │
│   ├── features/           # Domain feature modules
│   │   ├── auth/           Login, AcceptInvitation, recovery
│   │   ├── billing/        Invoices, GuestFolio, Cashier, Payables
│   │   ├── dashboard/      Summary stats & activity feed
│   │   ├── food-orders/    FoodOrdersPage, order details modal, menu
│   │   ├── front-desk/     FrontDeskCheckInPage, GuestCheckOutPage
│   │   ├── guests/         GuestsPage, guest documents, credentials
│   │   ├── housekeeping/   HousekeepingPage, service requests
│   │   ├── rate-plans/     RatePlansPage, RatePlanModal, AiosellRatesMatrix
│   │   ├── reports/        ReportsPage, occupancy and revenue analytics
│   │   ├── room-types/     RoomTypesPage, RoomTypeModal
│   │   ├── rooms/          RoomsPage, AddRoomModal (with roomCode)
│   │   └── settings/       SettingsPage, hotel info & Aiosell room types
│   │
│   ├── hooks/
│   │   └── useHotelOS.js   Composite facade hook aggregating hotel state
│   │
│   ├── vite-env.d.ts       Global types & window.desktop declarations
│   ├── index.css           Tailwind CSS v4 theme entry
│   └── main.jsx            Vite entry point
│
├── electron-builder.json   Electron Builder configuration
├── tsconfig.json           Root TypeScript project references
├── tsconfig.app.json       Client TypeScript configuration (allowJs: true)
├── tsconfig.node.json      Node configuration for config files
├── tsconfig.electron.json  Electron main & preload TypeScript configuration
├── vite.config.js          Vite configuration
└── package.json            Dependencies, scripts, and package metadata
```

---

## Environment variables

| Variable              | Description                                     | Default                                     |
| --------------------- | ----------------------------------------------- | ------------------------------------------- |
| `VITE_API_URL`        | Backend base URL (see `.env.example`)           | `http://localhost:5001` (in `@hotelos/api`) |
| `VITE_FRONTEND_URL`   | Frontend URL (used by dev runner & Electron)    | `http://localhost:5175`                     |
| `PORT`                | Port to run dev server on (overrides default)   | `5175`                                      |
| `VITE_DEV_SERVER_URL` | Explicit dev server URL for Electron (optional) | `http://localhost:5175`                     |

---

## Tech stack

- **Frontend**: React 19, Vite (`@tailwindcss/vite`), Tailwind CSS v4, React Router
- **Desktop**: Electron 45 (`45.0.0`), electron-builder (`^26.18.0`), esbuild (`^0.28.2`)
- **Language**: TypeScript 6 (`~6.0.2`) with seamless JavaScript coexistence (`allowJs: true`)
- **State management**: `@hotelos/query` (TanStack Query v5), `@hotelos/stores` (Zustand)
- **Realtime sync**: `@hotelos/socket` (Socket.IO client)
- **Shared packages**: `@hotelos/api`, `@hotelos/styles`, `@hotelos/ui`, `@hotelos/utils`
- **Icons**: `lucide-react`

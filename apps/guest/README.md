# Guest Dashboard & In-Room Kiosk Portal

The guest-facing in-room dining, amenity requests, and concierge portal for **HotelOS**. Operates seamlessly across both personal mobile devices (via QR code or guest credentials) and dedicated in-room touchscreen Android kiosk tablets.

- **Port**: `5177`
- **Package name**: `guest`
- **Tech Stack**: React 19, TypeScript, Vite, TanStack Router, TanStack Start, Tailwind CSS v4, Socket.IO Client
- **Backend API**: `apps/backend` (Express API on port `5001`)

---

## Dual Operational Modes

The Guest app automatically detects and configures its behavior based on how it is accessed:

```
               +-------------------------------------------------+
               |                   apps/guest                    |
               +-------------------------------------------------+
                                       |
                   Detects URL parameters & credentials
                                       |
                   +-------------------+-------------------+
                   |                                       |
                   v                                       v
        [In-Room Kiosk Tablet]                  [Personal Guest Mobile]
        URL: /?kioskCode=...                    URL: / or QR scan
        - Hardware device identity              - Standard JWT authentication
        - Vacant standby screen                 - Self-service room portal
        - Auto-login on check-in                - Interaction gating when checked out
        - Auto-logout on check-out
```

### 1. In-Room Kiosk Tablet Mode (`?kioskCode=...`)

When running inside the native Android Kiosk shell (`apps/kiosk`) or an in-room tablet browser:

- **Standby Mode (`KioskRoomStandby.tsx`)**: When the assigned room is vacant (`status: "cleaning"` or `"available"`), the tablet displays a serene hotel standby screen showing hotel branding, live room clock, Wi-Fi network name and password, and front-desk concierge instructions.
- **Handoff Exchange (`POST /api/v1/sessions/kiosk-exchange`)**: When launched with a single-use handoff code, the app exchanges it for either an authenticated guest session (if a guest is already checked in) or a standby token (if vacant). Active stays are queried with `createdAt: -1` sorting to guarantee the latest guest identity is always loaded.
- **Idempotent Reload Status Check (`GET /api/v1/sessions/kiosk-room-status`)**: If an in-room tablet is reloaded during an active guest stay, it uses its persistent device token to check room status idempotently, preventing 401 Unauthorized errors and rate-limiting blocks.
- **Instant Auto-Login**: When Front Desk checks in a guest into this room, the backend emits `kiosk:guest-checked-in`. The tablet immediately transitions in-place from standby mode to the authenticated guest dashboard without requiring manual login.
- **Instant Auto-Logout**: When Front Desk checks out the room via Room Grid (`POST /api/v1/rooms/:id/check-out`), the backend emits `kiosk:guest-checked-out`. The tablet immediately returns to the clean standby screen, purging guest state.

### 2. Personal Mobile Device Mode

When accessed by guests on their smartphones via room QR codes or direct login:

- Guests authenticate via username/password or QR session token.
- Full access to room services, food ordering, and DND controls.
- **Stay Lifecycle Gating**: If a guest views their dashboard after checkout, the app displays a graceful "Stay Concluded" status banner and disables ordering and service action buttons to prevent orphaned charges.

---

## Features

1. **Personalized Room Dashboard**:
   - Live room clock, guest greeting, hotel Wi-Fi details, and room number.
2. **Do Not Disturb (DND) Management**:
   - 1-click toggle with backend debouncing to inform housekeeping and reception in real time.
3. **In-Room Dining**:
   - Categorized food catalog, dietary filters (Veg / Non-Veg), item quantities, delivery notes, and multi-stage tracking (`REQUESTED` &rarr; `ACCEPTED` &rarr; `PREPARING` &rarr; `READY` &rarr; `DELIVERED`).
4. **Housekeeping & Amenities Requests**:
   - Quick requests for towels, pillows, toiletries, water, adapters, and room cleaning.
5. **Real-time Order & Request Tracker**:
   - Real-time Socket.IO synchronization reflecting kitchen and front-desk progress instantly.

---

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable          | Description                          | Default                        |
| :---------------- | :----------------------------------- | :----------------------------- |
| `VITE_API_URL`    | Base URL of HotelOS backend API      | `http://localhost:5001/api/v1` |
| `VITE_SOCKET_URL` | Base URL of HotelOS Socket.IO server | `http://localhost:5001`        |

> [!TIP]
> When testing with physical Android tablets over Wi-Fi, run `pnpm sync:ip` or `pnpm dev:kiosk` at the monorepo root to automatically detect your host machine's LAN IP and sync it across all `.env` files.

---

## Development

All commands run from the repository root:

```bash
# Run Guest app standalone
pnpm dev -F guest

# Run with all monorepo dashboards
pnpm dev

# Run in kiosk interactive terminal with LAN IP sync
pnpm dev:kiosk

# Build for production
pnpm build -F guest
```

---

## Real-Time Socket Architecture (`src/services/socket.ts`)

The guest dashboard connects to the backend Socket.IO hub:

- **Authentication**: JWT token passed in `{ auth: { token } }`.
- **Rooms Joined**: Handled securely by the backend (`guest:<guestId>`, `room:<roomId>`, and `device:<deviceId>`).
- **Live Events Handled**:
  - `order:created`, `order:updated` &rarr; Live dining order status updates.
  - `serviceRequest:created`, `serviceRequest:updated` &rarr; Live housekeeping status updates.
  - `kiosk:guest-checked-in` &rarr; In-place auto-login on in-room tablets.
  - `kiosk:guest-checked-out` &rarr; In-place auto-logout to standby screen.
  - `stay:status-updated` &rarr; Dual-device stay status synchronization.

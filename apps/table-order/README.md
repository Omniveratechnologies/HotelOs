# Table Order & Digital Menu

Guest-facing digital dining menu, table ordering, payment, and assistance request web application for **HotelOS**. Also serves as the **Digital Menu** preset for HotelOS touchscreen kiosks.

- **Port**: `5179`
- **Package name**: `table-order`
- **Tech Stack**: React 19, TypeScript, Vite, Tailwind CSS, Socket.IO Client
- **Backend API**: `apps/backend` (Express API on port `5001`)

---

## Key Architecture & Features

### 1. Dining Session Lifecycle & Geofencing (`SessionContext.tsx`)

- **Table QR Code Landing**: Guests scan table QR codes (`/:hotelId/table/:tableId`), which loads restaurant menus and establishes a secure session (`POST /api/v1/sessions/qr-guest`).
- **GPS Geofencing**: Validates customer location against hotel coordinates using Haversine distance calculation to prevent remote ordering abuse.
- **Kiosk Hardware Bypass**: Dedicated tablet kiosks supply a kiosk hardware token that bypasses GPS checks while operating on hotel premises.
- **Automatic Session Invalidation**: Invalidation occurs if session generation increments or when the table is cleared.

### 2. Live Order Progress Carousel (`OrderProgressCarousel.tsx`)

- A floating live status banner displayed across all views (Menu, Cart, Assistance, and Bill).
- Updates in real time via Socket.IO events (`order:updated`), tracking each order round through kitchen preparation stages:
  `PENDING` &rarr; `ACCEPTED` &rarr; `PREPARING` &rarr; `READY` &rarr; `DELIVERED`.

### 3. Multi-Order Sessions & Consolidated Billing (`/bill`)

- **Multi-Round Ordering**: Guests can order appetizers, main courses, and additional drinks/desserts in separate rounds throughout their dining visit.
- **Consolidated Master Folio**: The `/bill` page aggregates all orders placed during that table session into an itemized master bill.
- **Split-Bill Calculator**: Built-in interactive split calculator allowing guests to divide total charges evenly among dining companions.
- **Payment Settlement**: Supports Cash on Delivery, Room Folio Charge, or instant online payment via Razorpay.

### 4. Staff Assistance Requests (`/assistance`)

- 1-click calls for waiter service, extra cutlery, water refills, or immediate bill presentation, routed live to staff displays.

---

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable          | Description                                     | Default                 |
| :---------------- | :---------------------------------------------- | :---------------------- |
| `VITE_API_URL`    | Base URL of HotelOS backend (without `/api/v1`) | `http://localhost:5001` |
| `VITE_SOCKET_URL` | Base URL of HotelOS Socket.IO server            | `http://localhost:5001` |

> [!NOTE]
> The internal API client automatically prefixes `/api/v1` to all request endpoints, ensuring consistency with the backend server.

---

## Development

```bash
# Run locally on port 5179 with LAN host exposure
pnpm dev -F table-order

# Run in kiosk interactive terminal with LAN IP sync
pnpm dev:kiosk

# Build for production
pnpm build -F table-order
```

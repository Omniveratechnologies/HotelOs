# Stayscape — Super Admin Dashboard

A React + Vite + Tailwind CSS super admin dashboard for managing hotel
properties on a multi-tenant platform. Ships with mock data so it runs and
looks complete out of the box — swap in your backend by editing one file.

## Features

- **Create hotel** — modal form (hotel name, admin email, send-invite toggle)
- **Hotels list** — search, deactivate/reactivate, change credentials
- **Food transactions** — revenue received per hotel, sortable/searchable
- **Subscriptions** — track plan and expiry status per hotel, filterable
- **Service requests** — inbox of hotel requests with status updates
- **Settings** — admin profile, notification preferences, security toggle
- **Logout** — with confirmation modal

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL (usually http://localhost:5173).

## Project structure

```
src/
  api/client.js          <- ALL backend calls live here. Start here.
  data/mockData.js        <- Mock data matching the shape your API should return
  components/
    layout/                Sidebar, Topbar, AppShell (route outlet + logout modal)
    ui/                     Button, Modal, Badge, Field, StatCard, empty/loading states
    hotels/                 CreateHotelModal, CredentialsModal
  pages/
    Overview.jsx            Dashboard home with summary stats
    Hotels.jsx               Hotel list + create/deactivate/credentials
    Transactions.jsx         Food transaction revenue per hotel
    Subscriptions.jsx        Subscription expiry tracking
    ServiceRequests.jsx      Hotel service request inbox
    Settings.jsx             Admin profile & preferences
  App.jsx                  Routes
```

## Connecting your backend

Everything the UI needs from a server goes through **`src/api/client.js`**.
Each function currently reads/writes the in-memory mock data in
`src/data/mockData.js` after a short fake delay, so the whole app works
immediately without a backend.

To connect a real backend:

1. Copy `.env.example` to `.env` and set your API base URL:
   ```
   VITE_API_URL=https://api.yourdomain.com
   ```
2. Open `src/api/client.js`. Every exported function has a commented-out
   "Real backend version" snippet right below the mock implementation —
   uncomment it and delete the mock lines above it. For example:

   ```js
   export async function fetchHotels() {
     return apiFetch("/api/hotels");
   }
   ```

3. The `apiFetch` helper at the top of `client.js` already attaches a
   Bearer token from `localStorage.getItem("auth_token")` and your
   `VITE_API_URL`. Set that token wherever you implement login.
4. Once every function in `client.js` calls your real API, you can delete
   `src/data/mockData.js` (or keep it for local development/demos).

### Expected API shapes

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

`status` for hotels: `"active" | "deactivated"`.
`status` for subscriptions: `"active" | "expiring_soon" | "expired"`.
`status` for service requests: `"open" | "in_progress" | "resolved"`.
`priority` for service requests: `"high" | "medium" | "low"`.

## Build for production

```bash
npm run build
```

Outputs static files to `dist/` — deploy to any static host (Vercel,
Netlify, S3, etc.) or serve behind your backend.

## Tech stack

- React 19 + Vite
- Tailwind CSS v4
- React Router v6
- lucide-react icons

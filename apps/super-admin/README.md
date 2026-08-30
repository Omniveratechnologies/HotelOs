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
  services/              <- Domain API calls (auth, hotels, subscriptions, …)
  data/mockData.js        <- Mock data used by Transactions & Service Requests
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

All API calls go through the shared **`@hotelos/api`** package (see
`packages/api`), which reads `VITE_API_URL` from `.env` and attaches the
`auth_token` from `localStorage` when you pass `{ auth: true }`.

`src/services/*.js` hold the domain calls (auth, hotels, subscriptions).
Transactions and Service Requests still read the in-memory mock data in
`src/data/mockData.js`.

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

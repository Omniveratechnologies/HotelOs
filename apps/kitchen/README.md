# Kitchen Dashboard

A responsive kitchen management dashboard built using React.js. This is the
React + Vite + Tailwind CSS app used by `KITCHEN` staff of **HotelOS** to
manage food orders in real time on a live kitchen display.

- Port: `5176`
- Package name: `kitchen`
- Backend: `apps/backend` (Express API on `5001`)

---

## Role

A **Kitchen** staff member works in the kitchen of one hotel. Capabilities
exercised in this app:

- View incoming food orders (room, items, payment method, order age)
- Advance an order through its lifecycle (accept → prepare → ready → deliver)
- Reject an order when it cannot be fulfilled

> The backend derives the kitchen's hotel from the authenticated user's JWT
> (`req.user.hotelId`) and authorizes via `authorize("KITCHEN")`.

---

## Features / pages

| Area      | Page                  | Notes                                            |
| --------- | --------------------- | ------------------------------------------------ |
| Dashboard | `dashboard/Dashboard` | Live order board with status columns (see below) |

### Order lifecycle

Orders flow through a set of status columns, each rendered as a board
column:

| Column             | Action                                           |
| ------------------ | ------------------------------------------------ |
| `NEW`              | ✓ ACCEPT → `PREPARING` · ✕ REJECT → `REJECTED`   |
| `PREPARING`        | MARK PREPARING → `READY`                         |
| `READY`            | SEND FOR DELIVERY → `OUT FOR DELIVERY`           |
| `OUT FOR DELIVERY` | MARK DELIVERED → `Delivered`                     |
| `REJECTED`         | Shown dynamically only when an order is rejected |

The order status updates are sent to the backend with
`PATCH /orders/:id/status`.

---

## Current backend integration

This app calls the backend directly with the browser `fetch` API (it does
**not** use the shared `@hotelos/api` client). The base URL is read from
`VITE_API_BASE_URL` in `src/config/api.js`.

| Purpose             | Method & path              | Backend                        |
| ------------------- | -------------------------- | ------------------------------ |
| List orders         | `GET /orders`              | `GET /api/orders`              |
| Update order status | `PATCH /orders/:id/status` | `PATCH /api/orders/:id/status` |

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
cp apps/kitchen/.env.example apps/kitchen/.env
```

```text
VITE_API_BASE_URL=http://localhost:5001/api
```

### 3. Run the dev server

```bash
pnpm dev -F kitchen
```

Open `http://localhost:5176`. (Or run everything with `pnpm dev` from the
root.)

> New to pnpm / Turbo? `pnpm <task> -F <workspace>` is Turbo's
> `--filter` shorthand (task first, filter after), run from the repository
> root. If pnpm isn't installed, run `npm install -g pnpm` first. See the root
> `README.md` ("pnpm & Turborepo explained") for details.

---

## Build for production

```bash
pnpm build -F kitchen
pnpm preview -F kitchen
```

---

## Project structure

```
src/
│
├── App.jsx                 Provider & layout wiring (renders AppRoutes)
├── main.jsx                Vite entry point
├── index.css               Tailwind + global styles
│
├── components/             Reusable UI pieces
│   ├── Navbar.jsx          Header (title + live clock)
│   ├── StatusColumn.jsx    One order-status column (count, badge, empty state)
│   └── OrderCard.jsx       Single order card + lifecycle action buttons
│
├── config/
│   └── api.js              Reads VITE_API_BASE_URL
│
├── pages/
│   └── Dashboard.jsx       Order board: fetches orders, renders columns
│
├── routes/
│   └── AppRoutes.jsx       Route definitions (single `/` route)
│
└── utils/
    ├── Actions.jsx         Status → action button definitions
    └── order.js            Sample/fallback order data
```

---

## Environment variables

| Variable            | Description                           | Default                     |
| ------------------- | ------------------------------------- | --------------------------- |
| `VITE_API_BASE_URL` | Backend base URL (see `.env.example`) | `http://localhost:5001/api` |

---

## Libraries & Technologies

- React.js
- Vite
- Tailwind CSS
- JavaScript
- Lucide React
- Framer Motion
- React Router
- react-hot-toast
- Axios

---

## Tech stack

- React 19 + Vite
- Tailwind CSS v4
- React Router
- lucide-react icons
- Framer Motion animations
- Direct `fetch` API client (via `VITE_API_BASE_URL`)

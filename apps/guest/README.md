# Guest Dashboard - Frontend

A modern, responsive, in-room guest services web application designed for hotel tablet interfaces and QR-code entry points. Guests can manage room preferences, order dining and amenities, contact hotel staff instantly, and monitor request progress in real time.

---

## Key Features

- **Guest Personalization & Context**: Displays suite number, guest greeting, and live room clock based on URL parameters or QR session tokens.
- **Do Not Disturb (DND) Management**: Instant state toggle with built-in debouncing to notify housekeeping and front desk without duplicate events.
- **In-Room Dining Ordering**: Categorized food menu, item quantity steppers, live subtotal computation, payment method selection (Cash on Delivery or Online Payment), and multi-stage order lifecycle tracking.
- **Guest Amenities Requests**: Selectable housekeeping items (extra towels, pillows, toiletries, water, iron & board, blankets) with request tracking.
- **One-Touch Staff Contact**: Quick requests to dial or ping Reception and Restaurant services.
- **Live Request Tracker**: Summary card showing all active and past requests with state machine badges (Requested, Assigned, In Progress, Delivered, Completed).
- **Resilient Mock API**: Built-in mock service layer (`src/data/mock-api.ts`) simulating async network latency and network error fallbacks to keep UI state machines verified under edge cases.

---

## Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Routing & SSR**: [TanStack Router](https://tanstack.com/router/latest) & [TanStack Start](https://tanstack.com/start/latest)
- **State Management & Async Data**: [TanStack Query](https://tanstack.com/query/latest) + React Context FSM
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components & Icons**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives) + [Lucide React](https://lucide.dev/)
- **Form & Schema Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

---

## Getting Started

### Prerequisites

- **Node.js**: `v18.0.0` or higher (v20+ recommended)
- **Package Manager**: `npm` (v9+)

### Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd guest-harmony-portal
npm install
```

### Local Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the URL shown in terminal) in your browser. You can simulate room context by adding a `room` query parameter (e.g. `http://localhost:3000/?room=1204`).

---

## Building for Production

To create an optimized production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## Code Quality & Formatting

Run the linter:

```bash
npm run lint
```

Format codebase with Prettier:

```bash
npm run format
```

---

## Project Structure

```text
guest-harmony-portal/
├── public/                 # Static assets (favicons, manifest)
├── src/
│   ├── components/
│   │   ├── guest-dashboard/# Dashboard domain components (modals, headers, lists)
│   │   └── ui/             # Reusable UI primitives (shadcn/ui)
│   ├── constants/          # Service flow constants and configurations
│   ├── context/            # Application state FSM & guest context provider
│   ├── data/               # Mock data (menus, amenities, room directory, mock API)
│   ├── hooks/              # Custom React hooks (orders, clock, mobile check)
│   ├── lib/                # Shared utilities & error handling logic
│   ├── routes/             # File-based routing (__root.tsx, index.tsx)
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Formatter & status helpers
├── components.json         # shadcn/ui configuration
├── eslint.config.js        # ESLint flat configuration
├── tsconfig.json           # TypeScript compiler configuration
├── vite.config.ts          # Vite build configuration
└── package.json            # Dependencies and scripts
```

---

## Backend Integration Guide

This project is delivered as a clean, standalone frontend application. All server calls currently route through the mock service layer in `src/data/mock-api.ts`.

To integrate with real backend endpoints:

1. Replace simulated promises in `src/data/mock-api.ts` or `src/hooks/useOrders.ts` with your API client calls (REST, GraphQL, or WebSockets for live status updates).
2. Configure API base URLs and authentication headers using standard environment variables (e.g. `VITE_API_BASE_URL`).

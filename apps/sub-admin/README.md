# HotelOS — Marketing Site & Dashboard (Frontend)

A React + Tailwind CSS (Vite) frontend for **HotelOS**, styled with the
navy / antique-gold / ivory palette you provided.

## What's included

- **Landing page** (`/`) — header, hero, "All Departments · One Platform"
  scrollable dashboard carousel, video + AI-assistant section, "Why Hotels
  Choose HotelOS", pricing, stats bar, testimonial, CTA and footer.
- **Login page** (`/login`) — minimal "Hello Admin" email/password form.
  Submitting it just routes to `/dashboard` (no real auth wired up).
- **Create Account / Invitation page** (`/invitation`) — "Welcome to
  HotelOS. Create your administrative account." with Hotel Name, Full Name,
  Username, Email, Password, Confirm Password. Not connected to anything —
  it's meant to be wired up once an invite is accepted.
- **Dashboard** (`/dashboard`) — sidebar + topbar shell with stat cards
  (Total Rooms, Available Rooms, Occupied Rooms, Total Check-ins, Today's
  Checkouts, Pending Reservations, Today's Revenue, Pending Service
  Requests, Active Staff, Current Occupancy) and a Recent Activities feed.

All data on every page is static placeholder content — there's no backend,
API, or auth logic connected. It's frontend-only, ready for you to wire up.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

## Build for production

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  components/   Reusable UI pieces (Header, Hero, Sidebar, StatCard, etc.)
  pages/        Landing.jsx, Login.jsx, CreateAccount.jsx, Dashboard.jsx
  index.css     Tailwind + font imports + global styles
tailwind.config.js  Color tokens (navy, gold, ivory, cream, beige, muted)
```

## Palette used

| Token | Hex |
|---|---|
| Navy | `#22324E` |
| Navy Dark | `#1E3252` |
| Gold | `#766242` |
| Gold Hover | `#826A42` |
| Ivory | `#F4F4E4` |
| Cream | `#FCFCFC` |
| Beige | `#ECECE4` |
| Border | `#E4E4DC` |
| Muted text | `#8A8878` |

# HotelOS Backend

The backend REST API for **HotelOS**, a multi-role, multi-tenant hotel
management platform. It provides authentication, role-based authorization,
hotel (tenant) isolation, user management, invitations, rooms, guests,
dashboard metrics, and credential/email flows.

This document is the authoritative **API reference and handoff guide** for
frontend developers building on HotelOS.

- Package name: `backend`
- Runtime: Node.js + Express 5
- Database: MongoDB (Mongoose)
- Base URL: `http://localhost:5001/api/v1`

---

## Supported frontends

The backend is designed to serve multiple role-specific frontends:

| Frontend              | Role           |
| --------------------- | -------------- |
| Super Admin Dashboard | `SUPER_ADMIN`  |
| Sub Admin Dashboard   | `SUB_ADMIN`    |
| Reception Dashboard   | `RECEPTIONIST` |
| Kitchen Dashboard     | `KITCHEN`      |
| Guest Dashboard       | `GUEST`        |

The repository currently ships the Super Admin, Sub Admin, and Receptionist
apps (see the root `README.md`).

---

## Roles

Defined in `src/constants/roles.js`:

| Role           | Scope                                        |
| -------------- | -------------------------------------------- |
| `SUPER_ADMIN`  | Platform — manages all hotels and Sub Admins |
| `SUB_ADMIN`    | One hotel — manages rooms, staff, settings   |
| `RECEPTIONIST` | One hotel — registers guests, assigns rooms  |
| `KITCHEN`      | One hotel — kitchen operations               |
| `GUEST`        | One hotel — guest-facing features            |

The backend always enforces authorization. Frontend role checks are for
navigation/UI only and are never a security boundary.

### Role hierarchy

```
              SUPER ADMIN
                  │
                  │ creates / manages hotels & Sub Admins
                  ▼
              SUB ADMIN           (administrates ONE hotel)
                  │
     ┌────────────┴─────────────┐
     │                          │
     ▼                          ▼
 RECEPTIONIST                KITCHEN         (hotel staff)
     │
     │ creates guest account during check-in
     ▼
   GUEST
```

The backend derives each staff user's hotel from the authenticated JWT
(`req.user.hotelId`); the frontend is never trusted to choose the hotel.

---

## Core principles

### 1. Hotel isolation is backend-owned

A frontend must never decide which hotel a user belongs to. The backend
derives hotel ownership from the authenticated user's JWT:

```js
const hotelId = req.user.hotelId; // from the JWT, not the request body
```

Example: a Sub Admin of Hotel A calls `POST /api/v1/users` with `{ name,
role }`. The frontend does **not** send a `hotelId`; the backend assigns the
Current Sub Admin's hotel. A malicious `hotelId` in the body is ignored.

### 2. Authentication vs authorization

- **Authentication** — "Who are you?" Handled by the `authenticate`
  middleware (verifies the JWT and loads the user).
- **Authorization** — "Are you allowed to do this?" Handled by the
  `authorize(...)` middleware (checks the user's role).

### 3. DTOs protect the API contract

Responses are shaped by DTOs instead of raw Mongoose documents, so database
fields such as `password`, `resetPasswordToken`, and internal metadata are
never leaked. Build your UI against the documented DTO fields.

---

## Request flow

A typical protected request travels through the following stages:

```
      Frontend
        │
        │ HTTP request (Authorization: Bearer <JWT>)
        ▼
      Express Route                    (routes/*.js)
        │
        ▼
      authenticate middleware          (verifies JWT, loads user → req.user)
        │
        ▼
      authorize middleware             (checks role against allowed roles)
        │
        ▼
      Controller                       (controllers/*.js)
        │
        ▼
      Service / Model                  (services/*.js, models/*.js)
        │
        ▼
      MongoDB
        │
        ▼
      DTO                              (dto/*.js — shapes the response)
        │
        ▼
      JSON response                    { success, message, data }
        │
        ▼
      Frontend
```

This separation matters: frontends should never bypass authentication or
role checks, and the backend stays the single source of truth for both.

---

## Project structure

```
src/
│
├── app.js                  Express app, route mounting, static /uploads
├── server.js               Entry point (connects DB, starts server)
│
├── config/
│   ├── db.js               MongoDB connection
│   └── env.js              Loads & validates env vars
│
├── constants/
│   └── roles.js            Role constants
│
├── controllers/
│   ├── auth.controller.js      login, logout, forgot/reset password
│   ├── hotel.controller.js     hotel CRUD + status + self-service /me
│   ├── user.controller.js      create / list / delete users
│   ├── invite.controller.js    send / verify / accept invitations
│   ├── room.controller.js      room CRUD
│   ├── guest.controller.js     guest register / CRUD / documents / credentials
│   └── dashboard.controller.js dashboard stats
│
├── dto/
│   └── user.dto.js         userResponseDTO
│
├── middleware/
│   ├── auth.middleware.js  authenticate (JWT)
│   ├── role.middleware.js  authorize(...roles)
│   └── upload.middleware.js Multer guest document upload + error handler
│
├── models/
│   ├── Hotel.js            Hotel schema
│   ├── User.js             User schema (+ bcrypt hashing)
│   ├── UserInvite.js       Invitation tokens
│   ├── Room.js             Room schema (+ roomResponseDTO)
│   └── Guest.js            Guest schema (+ guestResponseDTO)
│
├── routes/
│   ├── auth.routes.js      /api/v1/auth/*
│   ├── hotel.routes.js     /api/v1/hotels/*
│   ├── user.routes.js      /api/v1/users*
│   ├── invite.routes.js    /api/v1/invites/*
│   ├── room.routes.js      /api/v1/rooms/*
│   ├── guest.routes.js     /api/v1/guests/*
│   └── dashboard.routes.js /api/v1/dashboard/*
│
├── seed/
│   └── superAdmin.seed.js  Create the first SUPER_ADMIN
│
├── services/
│   └── email.service.js    Nodemailer transports (invite, credentials, reset)
│
└── utils/
    ├── jwt.js              Token generation
    ├── generateCredentials.js  Usernames & temporary passwords
    ├── invitation.js       Invite tokens & expiry
    └── password.js         Password helpers

.env / .env.example         Environment configuration
```

---

## Setup & local development

### Requirements

- Node.js >= 24
- pnpm (this is a pnpm workspace, but the backend can also run standalone
  with `npm`)
- A MongoDB connection (local or Atlas)

New to pnpm? If it's not already installed on your machine, install it
globally with npm:

```bash
npm install -g pnpm
```

All `pnpm <task> -F <workspace>` commands below are Turbo-style (task first,
filter after); running them from the repository root avoids needing to `cd`
into this directory. See the root `README.md` ("pnpm & Turborepo explained")
for details.

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp apps/backend/.env.example apps/backend/.env
```

Required variables (validated in `src/config/env.js`):

| Variable                                                                   | Required | Description                                                         |
| -------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------- |
| `MONGODB_URI`                                                              | Yes      | MongoDB connection string                                           |
| `JWT_SECRET`                                                               | Yes      | Long random secret used to sign tokens                              |
| `PORT`                                                                     | No       | Server port. **Frontends expect `5001`**                            |
| `JWT_EXPIRES_IN`                                                           | No       | Token lifetime (default `1d`)                                       |
| `CLIENT_URL`                                                               | No       | Frontend origin for CORS                                            |
| `SUB_ADMIN_FRONTEND_URL`                                                   | No       | Base URL for invite / reset links (default `http://localhost:5175`) |
| `SUPER_ADMIN_PASSWORD`                                                     | No       | Used by the seed script                                             |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASSWORD` | No       | SMTP config for transactional emails                                |

> **Note:** the port default is `5001` in `src/server.js`. Make sure your
> `.env` sets `PORT=5001` (or leaves it unset) so the frontends, which
> default to `http://localhost:5001`, work out of the box.

### 3. Seed the super admin

```bash
pnpm seed -F backend
```

This creates a `SUPER_ADMIN` user with username `superadmin` and the
password from `SUPER_ADMIN_PASSWORD` (skips if one already exists).

### 4. Run the server

```bash
pnpm dev -F backend        # nodemon (dev)
pnpm start -F backend      # node
```

Health check:

```text
GET http://localhost:5001/api/v1/health
```

```json
{
  "success": true,
  "message": "HotelOS backend is running"
}
```

---

## Response envelope

Successful responses:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Errors:

```json
{
  "success": false,
  "message": "Something went wrong"
}
```

Frontends should always check `response.success` (or rely on `@hotelos/api`
throwing on a non-2xx response).

### HTTP status codes

| Status | Meaning                                       |
| ------ | --------------------------------------------- |
| `200`  | OK                                            |
| `201`  | Created                                       |
| `400`  | Missing / invalid request data                |
| `401`  | Authentication required / invalid credentials |
| `403`  | Authenticated but not authorized              |
| `404`  | Resource / route not found                    |
| `409`  | Duplicate / conflicting resource              |
| `500`  | Internal server error                         |

---

## API versioning

All endpoints are versioned under **`v1`**. The base URL is:

```text
http://localhost:5001/api/v1
```

Examples:

```text
POST /api/v1/auth/login
POST /api/v1/auth/logout

GET  /api/v1/users
POST /api/v1/users

GET  /api/v1/hotels
POST /api/v1/hotels
```

Future versions can use `/api/v2/` without breaking existing `v1` clients.

> **For frontend developers:** always build API calls with the `/api/v1/`
> prefix. Do **not** create calls such as `/api/users` when the backend
> endpoint is `/api/v1/users`.

---

## Authentication

JWT-based. Login with `username` + `password`:

```text
POST /api/v1/auth/login
```

```json
{
  "username": "your_username",
  "password": "your_password"
}
```

Successful response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "<JWT>",
    "user": {
      "id": "...",
      "name": "...",
      "username": "...",
      "role": "...",
      "hotelId": "...",
      "roomId": null,
      "mustChangePassword": true
    }
  }
}
```

Protected endpoints expect:

```text
Authorization: Bearer <JWT>
```

**Never** send the token inside the JSON body.

The JWT payload is:

```json
{
  "userId": "...",
  "role": "...",
  "hotelId": "..."
}
```

`logout` (`authenticate`-protected) is client-driven: it returns success and
the frontend removes the token locally.

---

## Middleware

### `authenticate` (`middleware/auth.middleware.js`)

- Requires `Authorization: Bearer <token>`.
- Verifies the JWT and loads the user from the DB.
- Rejects if the token is missing/expired or the user is inactive.
- Populates `req.user`.

### `authorize(...allowedRoles)` (`middleware/role.middleware.js`)

- Returns `401` if not authenticated.
- Returns `403` if the user's role is not in the allowed list.

### Document upload (`middleware/upload.middleware.js`)

Multer middleware for guest documents (`uploadGuestDocuments` +
`handleUploadError`). See [Guest documents](#guest-documents).

---

## Endpoint reference

### Auth — `/api/v1/auth`

| Method | Endpoint                | Auth | Roles  | Description                                |
| ------ | ----------------------- | ---- | ------ | ------------------------------------------ |
| POST   | `/auth/login`           | —    | Public | Log in, returns JWT + user                 |
| POST   | `/auth/logout`          | Yes  | Any    | Log out (client-driven)                    |
| POST   | `/auth/forgot-username` | —    | Public | Email the username                         |
| POST   | `/auth/forgot-password` | —    | Public | Email a password reset link (valid 1 hour) |
| POST   | `/auth/reset-password`  | —    | Public | Set a new password with the reset token    |

**Login** — see [Authentication](#authentication).

**forgot-username / forgot-password** — send `{ "email": "..." }`. Both
return the same neutral message whether or not an account exists (prevents
account enumeration).

**reset-password**:

```json
{ "token": "...", "password": "newPassword123" }
```

Password must be at least 8 characters.

### Hotels — `/api/v1/hotels`

| Method | Endpoint                  | Auth | Roles                   | Description                                                 |
| ------ | ------------------------- | ---- | ----------------------- | ----------------------------------------------------------- |
| GET    | `/hotels`                 | Yes  | SUPER_ADMIN             | List all hotels                                             |
| POST   | `/hotels`                 | Yes  | SUPER_ADMIN             | Create a hotel                                              |
| GET    | `/hotels/:hotelId`        | Yes  | SUPER_ADMIN             | Get a hotel                                                 |
| PATCH  | `/hotels/:hotelId`        | Yes  | SUPER_ADMIN             | Update hotel details / subscription                         |
| DELETE | `/hotels/:hotelId`        | Yes  | SUPER_ADMIN             | Delete a hotel                                              |
| PATCH  | `/hotels/:hotelId/status` | Yes  | SUPER_ADMIN             | Activate / deactivate                                       |
| GET    | `/hotels/me`              | Yes  | SUB_ADMIN, RECEPTIONIST | Current user's hotel (read-only)                            |
| PATCH  | `/hotels/me`              | Yes  | SUB_ADMIN               | Update own hotel (phone, address, city, check-in/out times) |

**Create hotel** (`POST /hotels`):

```json
{
  "name": "The Grand Meridian",
  "email": "admin@grandmeridian.com",
  "phone": "+1 555 0100",
  "address": "1 Main St",
  "city": "Springfield",
  "subscriptionStartDate": "2026-01-01",
  "subscriptionEndDate": "2026-12-31"
}
```

`name`, `email`, `subscriptionStartDate`, and `subscriptionEndDate` are
required. The backend generates a unique `hotelCode` from the name.

**Update status** (`PATCH /hotels/:hotelId/status`):

```json
{ "status": "ACTIVE" }
```

Valid: `ACTIVE` | `INACTIVE`.

> The `GET /me` and `PATCH /me` self-service routes are registered before
> the SUPER_ADMIN-only gate so hotel staff can read their own hotel.

### Users — `/api/v1/users`

| Method | Endpoint     | Auth | Roles                                | Description         |
| ------ | ------------ | ---- | ------------------------------------ | ------------------- |
| GET    | `/users`     | Yes  | SUPER_ADMIN, SUB_ADMIN, RECEPTIONIST | List users          |
| POST   | `/users`     | Yes  | SUPER_ADMIN, SUB_ADMIN               | Create a staff user |
| DELETE | `/users/:id` | Yes  | SUPER_ADMIN, SUB_ADMIN               | Delete a user       |

**List users** — supports an optional `?role=` filter. Sub Admins only see
users of their own hotel. Receptionists can list users too (used to view
staff).

**Create user** (`POST /users`, hotel-scoped):

```json
{
  "name": "Kitchen Operator",
  "role": "KITCHEN"
}
```

Valid roles to create here: `KITCHEN`, `RECEPTIONIST`. The backend generates
the `username` (e.g. `grand-kitchen-001`) and a `temporaryPassword`, then
assigns `req.user.hotelId`. The response reveals the temporary password
once:

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "...",
    "name": "Kitchen Operator",
    "username": "grand-kitchen-001",
    "role": "KITCHEN",
    "hotelId": "...",
    "temporaryPassword": "..."
  }
}
```

**Delete user** — Sub Admins may only delete Receptionists/Kitchen of their
own hotel. SUPER_ADMIN accounts cannot be deleted through this endpoint.

> Prefer the **invitation flow** for provisioning Sub Admin / Receptionist /
> Kitchen accounts (see below) rather than direct user creation.

### Invitations — `/api/v1/invites`

| Method | Endpoint          | Auth | Roles                  | Description                                |
| ------ | ----------------- | ---- | ---------------------- | ------------------------------------------ |
| POST   | `/invites`        | Yes  | SUPER_ADMIN, SUB_ADMIN | Send an invitation email                   |
| POST   | `/invites/verify` | —    | Public                 | Validate an invitation token               |
| POST   | `/invites/accept` | —    | Public                 | Accept invite, create/activate the account |

**Send invite** (`POST /invites`):

```json
{
  "name": "Ada Lovelace",
  "username": "ada",
  "email": "ada@example.com",
  "role": "RECEPTIONIST",
  "hotelId": "..." // required ONLY when a SUPER_ADMIN invites a SUB_ADMIN
}
```

Authorization rules:

- `SUPER_ADMIN` → can only invite `SUB_ADMIN` (must provide `hotelId`).
- `SUB_ADMIN` → can only invite `RECEPTIONIST` or `KITCHEN` (hotel comes
  from `req.user.hotelId`).
- Invitations only to `ACTIVE` hotels.
- The invited user is created inactive (`isActive: false`,
  `mustChangePassword: true`) and an email is sent with an invite link.
- Tokens expire in **24 hours**.

**Verify** (`POST /invites/verify`):

```json
{ "token": "..." }
```

Returns the invited user's details and hotel name if valid.

**Accept** (`POST /invites/accept`):

```json
{
  "token": "...",
  "name": "Ada Lovelace",
  "username": "ada",
  "password": "newPassword123"
}
```

Password must be at least 8 characters. On success the account is activated
and a JWT is returned so the user is logged in immediately.

### Rooms — `/api/v1/rooms`

Scoped to the authenticated user's hotel.

| Method | Endpoint     | Auth | Roles                   | Description   |
| ------ | ------------ | ---- | ----------------------- | ------------- |
| GET    | `/rooms`     | Yes  | SUB_ADMIN, RECEPTIONIST | List rooms    |
| GET    | `/rooms/:id` | Yes  | SUB_ADMIN, RECEPTIONIST | Get a room    |
| POST   | `/rooms`     | Yes  | SUB_ADMIN, RECEPTIONIST | Create a room |
| PATCH  | `/rooms/:id` | Yes  | SUB_ADMIN, RECEPTIONIST | Update a room |
| DELETE | `/rooms/:id` | Yes  | SUB_ADMIN, RECEPTIONIST | Delete a room |

**Create room** (`POST /rooms`):

```json
{
  "roomNumber": "101",
  "type": "Standard",
  "rate": 1200,
  "floor": 1
}
```

- `type` must be `Standard` | `Deluxe` | `Suite`.
- `rate` must be a non-negative number.
- A room number must be unique within one hotel (`409` if duplicated).

**Update room** — accepts any of `status`, `type`, `rate`, `floor`,
`currentGuest`, `checkIn`, `checkOut`. Room `status` values:
`available` | `occupied` | `reserved` | `cleaning`.

Room response DTO fields:

```json
{
  "id": "...",
  "roomNumber": "101",
  "floor": 1,
  "type": "Standard",
  "status": "available",
  "rate": 1200,
  "currentGuest": null,
  "checkIn": null,
  "checkOut": null
}
```

### Guests — `/api/v1/guests`

Scoped to the authenticated user's hotel. Accessible by `SUB_ADMIN` and
`RECEPTIONIST` (router-level authorization).

| Method | Endpoint                       | Auth | Roles                   | Description                     |
| ------ | ------------------------------ | ---- | ----------------------- | ------------------------------- |
| GET    | `/guests`                      | Yes  | SUB_ADMIN, RECEPTIONIST | List guests (`?status=`)        |
| GET    | `/guests/:id`                  | Yes  | SUB_ADMIN, RECEPTIONIST | Get a guest                     |
| POST   | `/guests`                      | Yes  | SUB_ADMIN, RECEPTIONIST | Register a guest (multipart)    |
| PATCH  | `/guests/:id`                  | Yes  | SUB_ADMIN, RECEPTIONIST | Update guest / check-out        |
| PATCH  | `/guests/:id/credentials`      | Yes  | SUB_ADMIN, RECEPTIONIST | Update / regenerate credentials |
| DELETE | `/guests/:id/documents/:docId` | Yes  | SUB_ADMIN, RECEPTIONIST | Delete one document             |
| DELETE | `/guests/:id`                  | Yes  | SUB_ADMIN, RECEPTIONIST | Delete a guest                  |

**Register guest** (`POST /guests`) — sent as `multipart/form-data`:

| Field       | Type         | Notes                                          |
| ----------- | ------------ | ---------------------------------------------- |
| `name`      | string       | Required                                       |
| `email`     | string       | Required, must be unique                       |
| `phone`     | string       | Optional                                       |
| `address`   | string       | Optional                                       |
| `idType`    | string       | Default `Aadhaar`                              |
| `idNumber`  | string       | Optional                                       |
| `roomId`    | string       | Required; must belong to the hotel and be free |
| `checkIn`   | string       | Required when `status` is `checked-in`         |
| `checkOut`  | string       | Required, must be after `checkIn`              |
| `status`    | string       | `checked-in` (default) or `reserved`           |
| `documents` | files[]      | Up to 5 files (`documents` field)              |
| `docTypes`  | string(json) | Optional JSON array parallel to files          |

On success the backend:

1. Generates a guest `username` (e.g. `GRAND-GST-001`) and temporary
   password,
2. creates a `GUEST` login account (`User`),
3. creates the `Guest` profile with documents,
4. claims the room (sets it to `occupied` or `reserved` with display info),
5. emails the guest credentials (non-blocking on failure).

Response includes the guest DTO plus the generated credentials:

```json
{
  "success": true,
  "message": "Guest registered successfully",
  "data": {
    "id": "...",
    "name": "Ada Lovelace",
    "...": "guest DTO fields...",
    "credentials": {
      "username": "grand-gst-001",
      "temporaryPassword": "...",
      "emailSent": true
    }
  }
}
```

**Check-out** — `PATCH /guests/:id` with `{ "status": "checked-out" }`
frees the room (sets it back to `cleaning`).

**Update credentials** (`PATCH /guests/:id/credentials`) — regenerate and
email new credentials, or set a specific password:

```json
{ "action": "regenerate" }
// or
{ "password": "newPassword123", "reveal": true }
```

**List guests** — supports `?status=reserved|checked-in|checked-out`.
Populates room details (`roomNumber`, `type`, `rate`, `floor`).

Guest response DTO includes `id`, `name`, `email`, `phone`, `address`,
`idType`, `idNumber`, `roomId`, `room`, `hotelId`, `userId`, `checkIn`,
`checkOut`, `status`, `nights`, `documents`, `createdAt`.

#### Guest documents

- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`,
  `application/pdf` (`400` otherwise).
- Max **5 MB** per file, max **5 files** per request.
- Stored on disk under `uploads/guests/<hotelId>/` and served statically at
  `/uploads/...` (the `documentDTO` rewrites paths to absolute URLs).
- Document objects contain `id`, `docType`, `filename`, `url`, `uploadedAt`.

### Dashboard — `/api/v1/dashboard`

| Method | Endpoint           | Auth | Roles                                | Description           |
| ------ | ------------------ | ---- | ------------------------------------ | --------------------- |
| GET    | `/dashboard/stats` | Yes  | SUPER_ADMIN, SUB_ADMIN, RECEPTIONIST | Hotel dashboard stats |

`GET /api/v1/dashboard/stats` returns (hotel-scoped for SU and REC):

```json
{
  "data": {
    "hotelName": "The Grand Meridian",
    "rooms": {
      "total": 12,
      "available": 8,
      "occupied": 3,
      "reserved": 1,
      "cleaning": 0
    },
    "guests": {
      "checkedIn": 3,
      "arrivalsToday": 1,
      "departuresToday": 0
    },
    "occupancyPercent": 25,
    "pendingReservations": 0,
    "pendingServiceRequests": 0,
    "revenueToday": 0,
    "activeStaff": 4,
    "recentActivities": []
  }
}
```

`pendingReservations`, `pendingServiceRequests`, and `revenueToday` are
still neutral (`0`) pending future modules.

---

## Email flows

All email is sent by `src/services/email.service.js` via Nodemailer using
`EMAIL_*` env vars. Four email types:

| Trigger                                    | Email                       |
| ------------------------------------------ | --------------------------- |
| Staff invite (`POST /invites`)             | Invitation link (valid 24h) |
| Guest registration / credential regenerate | Guest credentials           |
| `forgot-username`                          | Username reminder           |
| `forgot-password`                          | Reset link (valid 1 hour)   |

If SMTP isn't configured, guest-credential email failures are logged and
ignored (the guest still gets their credentials in the API response).

---

## Frontend integration guide

The recommended way to call the API is the shared **`@hotelos/api`** package
(`packages/api`), which handles the base URL, bearer token, response parsing,
and errors. See `packages/api/README.md`.

```js
import { api } from "@hotelos/api";

// public
const login = await api.post("/api/v1/auth/login", { username, password });

// protected
const rooms = await api.get("/api/v1/rooms", { auth: true });

// JSON body
const user = await api.post("/api/v1/users", { name, role }, { auth: true });

// multipart uploads (FormData)
const result = await api.post("/api/v1/guests", formData, { auth: true });
```

Golden rules:

- Always use the `/api/v1/` prefix.
- Login first, then send the JWT as a `Bearer` token.
- Never send a `hotelId` the backend derives from the authenticated user.
- Never rely on frontend role checks for security — the backend authorizes.
- Do not expect passwords in responses (except temporary passwords returned
  at creation time).
- Use the documented DTO fields.
- Handle `401` by re-authenticating; handle `403` as a permissions problem.
- Keep API calls in a dedicated service layer.

Recommended login routing on the frontend:

```js
if (user.role === "SUPER_ADMIN") navigate("/super-admin");
if (user.role === "SUB_ADMIN") navigate("/sub-admin");
if (user.role === "RECEPTIONIST") navigate("/reception");
```

### Login flow

```
Login Page
   │  username + password
   ▼
POST /api/v1/auth/login
   │
   ▼
Backend validates credentials → JWT generated
   │
   ▼
Frontend receives token + user
   │
   ├──→ store authenticated state (auth_token / auth_user in localStorage)
   │
   └──→ inspect user.role → redirect to the correct dashboard
```

These role checks are for navigation/UI only — the backend remains
responsible for security.

### Recommended frontend structure

Keep API calls in a service layer rather than inside UI components:

```
src/
├── components/
├── pages/
├── services/            <- domain API calls (auth, users, rooms, guests, ...)
├── context/             <- e.g. AuthContext
├── config/              <- e.g. api.js (base URL, shared helpers)
└── App.jsx
```

The apps in this repo already follow this pattern via `src/services/*` and
the shared `@hotelos/api` client.

### Token handling

For every protected request:

```text
Authorization: Bearer <TOKEN>
```

Do **not**:

- hard-code tokens in source code,
- commit tokens to Git,
- send another user's token,
- expose tokens in public logs, or
- put JWTs in screenshots shared publicly.

If a token is accidentally exposed, treat it as compromised and log in
again / rotate credentials as appropriate.

---

## Common errors & troubleshooting

| Status | Message                                            | Cause & fix                                                                                                                                      |
| ------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `401`  | Authentication required / invalid or expired token | No `Authorization` header, invalid JWT, or expired JWT. Re-check `Authorization: Bearer <token>`; if expired, log in again                       |
| `403`  | You do not have permission                         | Authentication worked but the role is not allowed. E.g. `KITCHEN` calling an endpoint restricted to `SUB_ADMIN`                                  |
| `404`  | Cannot POST/GET `/api/v1/...`                      | Route not imported / not mounted. Check `app.js` has `app.use("/api/v1/...", ...Routes)`; verify the URL and HTTP method; is the server running? |
| `500`  | Failed to ...                                      | Check the backend terminal — it logs the actual exception. Don't rely only on the frontend error message                                         |

For `404`, the app should contain something equivalent to:

```js
app.use("/api/v1/users", userRoutes);
```

---

## Frontend ownership by dashboard

| Dashboard   | Main backend areas                                                                         |
| ----------- | ------------------------------------------------------------------------------------------ |
| Super Admin | Authentication, Hotels, Sub Admin management, global administration                        |
| Sub Admin   | Authentication, own hotel info, Rooms, staff management (Kitchen / Reception), hotel users |
| Reception   | Authentication, Guests, check-in / check-out, room assignment, guest info & credentials    |
| Kitchen     | Authentication, food items, orders, order status, kitchen queue (roadmap)                  |
| Guest       | Authentication, guest profile, room info, food menu, orders, service requests (roadmap)    |

Guests are created as part of the Reception/check-in workflow — never mix
guest provisioning with staff user creation.

---

## Testing with curl

```bash
# Health
curl http://localhost:5001/api/v1/health

# Login (capture the token from the response)
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your_username","password":"your_password"}'

# Protected request
curl http://localhost:5001/api/v1/users \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create a staff user
curl -X POST http://localhost:5001/api/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUB_ADMIN_TOKEN" \
  -d '{"name":"Kitchen Operator","role":"KITCHEN"}'
```

---

## Security rules

- **Never trust frontend hotel IDs** — use `req.user.hotelId`.
- **Never return passwords** — always respond via DTOs.
- **Never rely only on frontend authorization** — the backend must enforce
  `authenticate` + `authorize`.
- **Never hard-code or commit secrets** (`JWT_SECRET`, `MONGODB_URI`, SMTP
  passwords, real tokens).
- **Keep staff and guest provisioning separate** — staff via invites /
  `/users`; guests via the reception `/guests` flow.

---

## Recommended development workflow

When implementing a new backend feature:

1. Define the database model
2. Define the request/response contract
3. Create the DTO
4. Create the controller / service
5. Add authentication (`authenticate`)
6. Add authorization (`authorize(...)`)
7. Add the route
8. Mount the route in `app.js`
9. Test with curl / an API client
10. Hand the API contract to the frontend developer
11. Build the frontend integration

Do not build the frontend API integration before the backend contract is
clear.

---

## Adding a new module

A new feature follows the existing pattern. For example, adding a module:

```text
src/models/MyModule.js              model + DTO
src/controllers/myModule.controller.js
src/routes/myModule.routes.js
src/dto/myModule.dto.js
```

Then mount it in `app.js`:

```js
app.use("/api/v1/my-module", myModuleRoutes);
```

Frontends can then use the standard CRUD verbs:

```text
GET    /api/v1/my-module
POST   /api/v1/my-module
PATCH  /api/v1/my-module/:id
DELETE /api/v1/my-module/:id
```

Only implement operations that are actually required and authorized.

---

## Do not assume an endpoint exists

Frontend developers should not invent API URLs. For example, do not assume
`/api/v1/guest/login` or `/api/v1/orders` exist unless they have been
implemented and documented here. Namespaces such as `rooms`, `orders`,
`service-requests`, and `food-items` are part of the planned architecture
and should be treated as available only after their backend implementation
is complete. Check the backend routes first.

---

## Learning path for a new developer

1. Read this README completely.
2. Run the backend locally and test `/api/v1/health`.
3. Test Super Admin login, then Sub Admin login.
4. Copy a valid JWT and hit one protected endpoint.
5. Understand the role hierarchy and hotel isolation.
6. Read the relevant controller and route for the feature you're building.
7. Test the API in an API client (see below).
8. Only then start the frontend integration.

Do not start by guessing API URLs — the backend routes and controller
contracts are the source of truth.

---

## Testing with an API client (Requestly / Postman)

The project has been tested with the Requestly API client. A recommended
collection organization:

```
HotelOS
├── Authentication
│   ├── Super Admin Login
│   ├── Sub Admin Login
│   └── Logout
├── Hotels
│   ├── Create Hotel
│   └── ...
├── Users
│   ├── Create Kitchen User
│   ├── Create Reception User
│   └── Get Users
├── Invites
├── Rooms
├── Guests
└── Dashboard
```

The base URL is `http://localhost:5001/api/v1`. Store the login token in the
client's environment/collection variable and use it as the `Bearer` token for
protected requests.

---

## Production improvements

The initial backend intentionally keeps authentication simple. For a
production-grade deployment, these hardening items should be added
**incrementally** rather than overcomplicating the foundation today:

- Refresh tokens + refresh-token rotation
- Session / device tracking + token revocation
- Rate limiting
- Request validation
- Centralized error handling
- Audit logs
- Email verification
- Stronger credential delivery
- Security headers
- Request logging
- Database indexes
- Pagination
- API documentation / OpenAPI
- Automated tests
- Automated deployment
- Environment-specific configuration

---

## Current implementation status

Implemented and documented:

- Express + MongoDB server, `/api/v1` namespace
- JWT authentication + role-based authorization
- Super Admin seed
- Hotel CRUD + status + self-service `/me`
- Staff user creation (`KITCHEN`, `RECEPTIONIST`) with auto-generated
  credentials and hotel isolation
- Invitation flow (send / verify / accept) for Sub Admin, Receptionist,
  Kitchen
- Forgot username / forgot password / reset password (email-based)
- Rooms CRUD (hotel-scoped)
- Guest registration, check-in/out, documents (multipart upload), and
  credentials
- Dashboard stats (rooms, guests, occupancy, staff, activity)
- DTO-based responses, standard `{ success, message, data }` envelope
- Static `/uploads` serving for guest documents

Roadmap (not yet implemented):

- Held-back `pendingReservations` / `pendingServiceRequests` / `billing`
  metrics
- Orders / food items / kitchen queue
- Service requests
- Advanced session management (refresh tokens, revocation)

Add new modules following the existing pattern: model → DTO → controller →
service → route (with `authenticate` + `authorize`) → mount in `app.js` →
document the endpoint here.

---

## API documentation checklist

### For backend developers

When adding an endpoint, record:

1. HTTP method & URL
2. Authentication requirement
3. Allowed roles
4. Request body
5. Path / query parameters
6. Success response
7. Error responses
8. Example frontend request

Keep the API contract stable where possible.

### For frontend developers

Before building a frontend feature, identify the same contract points — for
example, "Create Kitchen User":

- **Method:** `POST`
- **URL:** `/api/v1/users`
- **Authentication:** required
- **Roles:** `SUB_ADMIN`
- **Body:**
  ```json
  {
    "name": "Kitchen Operator",
    "role": "KITCHEN"
  }
  ```
- **Hotel ID:** not provided by the frontend — the backend uses
  `req.user.hotelId`
- **Response:**
  ```json
  {
    "success": true,
    "message": "User created successfully",
    "data": {}
  }
  ```

Follow this format for every new endpoint so the backend handoff stays clean
for every frontend developer.

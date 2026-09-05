# @hotelos/api

The shared HTTP client used by every HotelOS frontend app. It wraps the
browser `fetch` API with the conventions the backend expects:

- reads the backend base URL from `VITE_API_URL` (with a sensible fallback),
- attaches the JWT as a `Bearer` token automatically when requested,
- parses the standard `{ success, message, data }` response envelope and
  throws a typed `ApiError` on any failure,
- signs the user out automatically when the backend returns `401`.

Package name: `@hotelos/api` — declared as a `workspace:*` dependency in the
frontend apps (see `apps/*/package.json`). It is consumed as ESM through
`package.json`'s `exports` map.

---

## Installation

No separate installation is needed — the package is already referenced with
`workspace:*` in the frontend apps. Add it to a new app with:

```bash
pnpm add @hotelos/api -F <app>
```

(`pnpm add <pkg> -F <app>` filters the `add` to a single workspace, run from
the repository root. For Turbo tasks the filter comes **after** the command,
e.g. `pnpm dev -F backend`. If pnpm isn't installed, run
`npm install -g pnpm` first. See the root `README.md` — "pnpm & Turborepo
explained" — for details.)

---

## Getting started

```js
import { api } from "@hotelos/api";

const hotels = await api.get("/api/v1/hotels", { auth: true });

const newUser = await api.post("/api/v1/users", { name, role }, { auth: true });
```

The package exports:

| Export     | Description                                                     |
| ---------- | --------------------------------------------------------------- |
| `api`      | Convenience object with `get`, `post`, `put`, `patch`, `delete` |
| `apiFetch` | Low-level fetch wrapper (used by `api`)                         |
| `ApiError` | Error class carrying a `status` code                            |

---

## API reference

### `api.get(url, options)`

```js
api.get("/api/v1/rooms", { auth: true });
```

### `api.post(url, body?, options)`

```js
api.post("/api/v1/auth/login", { username, password });
```

### `api.put(url, body?, options)`

```js
api.put("/api/v1/resource/:id", { name });
```

### `api.patch(url, body?, options)`

```js
api.patch(`/api/v1/bookings/${id}`, { status: "checked-out" }, { auth: true });
```

### `api.delete(url, options)`

```js
api.delete(`/api/v1/rooms/${id}`, { auth: true });
```

---

## Options

The second (or third) argument accepts an options object:

| Option    | Type                 | Description                                                                          |
| --------- | -------------------- | ------------------------------------------------------------------------------------ |
| `auth`    | `boolean`            | When `true`, attaches `Authorization: Bearer <token>` from `localStorage.auth_token` |
| `body`    | `object \| FormData` | JSON body, or a `FormData` instance (sent as `multipart/form-data`)                  |
| `headers` | `object`             | Extra request headers merged into the defaults                                       |
| `query`   | `object`             | Query-string parameters; `undefined` / `null` values are skipped                     |
| `timeout` | `number`             | Request timeout in ms (default `30000`)                                              |
| `signal`  | `AbortSignal`        | Optional external abort signal                                                       |

---

## Authentication handling

The client stores the session token in `localStorage` under the key
`auth_token` (and the current user under `auth_user`).

To call a protected endpoint, pass `auth: true`:

```js
const result = await api.get("/api/v1/dashboard/stats", { auth: true });
```

When `auth: true` is set but no token exists, the client throws an
`ApiError` with status `401` ("Authentication required."). If the backend
responds with `401`, the client clears `auth_token` and `auth_user` and
throws "Session expired. Please login again." — this is what drives the
automatic redirect to the login screen in the apps.

Logging in is done by storing the token yourself:

```js
const result = await api.post("/api/v1/auth/login", { username, password });
localStorage.setItem("auth_token", result.data.token);
localStorage.setItem("auth_user", JSON.stringify(result.data.user));
```

---

## FormData / multipart uploads

When the body is a `FormData` instance, the client sends it as
`multipart/form-data` and does not set a JSON `Content-Type`.

Guest documents no longer use multipart — registering a guest stay is a
JSON call to `/api/v1/bookings`. The document binary is uploaded directly
to Cloudflare R2 via a presigned URL obtained from the backend:

```js
import { api } from "@hotelos/api";

// 1. get presigned upload URLs for the files' metadata
const { data: uploads } = await api.post(
  "/api/v1/guests/documents/upload-urls",
  {
    files: [
      {
        filename: "passport.jpg",
        mimeType: "image/jpeg",
        docType: "Passport",
        size: 12345,
      },
    ],
  },
  { auth: true },
);

// 2. PUT each file directly to its R2 uploadUrl (plain fetch, no auth header)
await fetch(uploads[0].uploadUrl, { method: "PUT", body: fileBlob });

// 3. register the stay, referencing the returned R2 keys
const result = await api.post(
  "/api/v1/bookings",
  {
    name: "Ada Lovelace",
    email: "ada@example.com",
    roomId,
    checkOut: "2026-10-01",
    documents: uploads,
  },
  { auth: true },
);
```

---

## Errors

`apiFetch` wraps failures in an `ApiError` which extends `Error` and adds a
`status` field:

```js
import { ApiError } from "@hotelos/api";

try {
  await api.get("/api/v1/rooms", { auth: true });
} catch (error) {
  if (error instanceof ApiError) {
    console.error(error.status, error.message);
  }
}
```

Common statuses:

| Status | Meaning                                                  |
| ------ | -------------------------------------------------------- |
| `0`    | Network / timeout / aborted request                      |
| `401`  | Missing token, invalid/expired token, or session expired |
| `400`  | Invalid or missing request data                          |
| `403`  | Authenticated but not authorized                         |
| `404`  | Resource not found                                       |
| `409`  | Duplicate / conflicting resource                         |

The error message is taken from the backend's `message` or `error` field, or
a generic message based on the HTTP status.

---

## Base URL configuration

The base URL is resolved in `src/config/env.js`:

```js
export const API_URL =
  viteEnv.VITE_API_URL || nodeEnv.VITE_API_URL || "http://localhost:5001";
```

In a Vite app, `import.meta.env.VITE_API_URL` is read from the app's `.env`
file. Set it in each app:

```text
VITE_API_URL=http://localhost:5001
```

Paths passed to `api.get(...)` etc. are resolved relative to this base URL
via `new URL(path, API_URL)`, so pass the full `/api/v1/...` path.

---

## Response shape

The backend returns a standard envelope, and the client returns the parsed
JSON as-is. Most apps read the `data` field:

```js
const result = await api.get("/api/v1/rooms", { auth: true });
const rooms = result.data; // array
```

---

## Project structure

```
src/
│
├── apiFetch.js         Low-level fetch wrapper (headers, auth, errors, timeout)
├── index.js            Public exports: api, apiFetch, ApiError
│
└── config/
    └── env.js          Resolves the backend base URL
```

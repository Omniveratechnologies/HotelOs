# Aiosell API - LLM Context File

> Generated: 2026-09-17. Drop this file into your AI coding tool (Claude Code, Cursor, Copilot, Aider, etc.) as a context/rules file before asking it to write Aiosell integration code.

## Integration Workflow (read this first)

You CAN build the full integration now. You CANNOT make it go live until the user is an onboarded Aiosell partner. Follow this order:

1. **Build now with placeholders.** Write the complete integration code using a placeholder partner id for `{pms}` and placeholder Basic Auth credentials (e.g. `<USERNAME>` / `<PASSWORD>`). Never invent real values, never hard-code anything that looks real.
2. **Tell the user to test the push APIs in the Sandbox.** The Rate Push and Inventory Push APIs can be tried in the Sandbox on the Aiosell docs site before any onboarding. Have the user confirm rates and inventory land on `live.aiosell.com`.
3. **Tell the user to build and test the reservation webhook.** They host one POST endpoint for `book` / `modify` / `cancel`, then exercise it with the Webhook Tester on the docs site.
4. **Tell the user to register as a partner.** Only after registering does Aiosell issue their own partner-level Basic Auth credentials and partner id.
5. **Wait for real credentials.** When the user pastes back their partner id and Basic Auth credentials, swap out the placeholders. Until then, keep placeholders and explicitly prompt the user for the missing values — do not guess them.

## Hard Rules for the AI Reading This File

1. **Do not invent endpoints.** If a URL, method, field, or behavior is not listed in this file, say so explicitly. Do not guess.
2. **Do not invent fields.** Use only the field names exactly as written below. JSON keys are camelCase.
3. **Authentication is HTTP Basic Auth.** Header: `Authorization: Basic <base64(username:password)>`. Do not invent bearer tokens, API keys, JWT, or signing schemes. Credentials are issued by Aiosell only after partner onboarding - use `<USERNAME>` / `<PASSWORD>` placeholders until the user supplies their real values. Never hard-code or guess credential values.
4. **Replace placeholders, don't leave them.** `{pms}` must become the partner id Aiosell assigns at onboarding. `sandbox-pms` is the test hotel code for the sandbox only.
5. **All dates are `YYYY-MM-DD`.** Timestamps are `YYYY-MM-DD HH:MM:SS` unless stated otherwise. No timezone suffix is used.
6. **`startDate`/`endDate` ranges are inclusive on both ends.**
7. **Inventory/rate/restriction pushes are UPSERTS over the date range.** Sending a new value overwrites the prior value for those dates.
8. **Reservation webhooks (`book` / `modify` / `cancel`) all hit the same PMS endpoint** and are differentiated by the `action` field.
9. **`modify` payloads represent the new full state - they are NOT diffs.** Replace, do not merge.
10. **`pah` (Pay-At-Hotel):** `true` = collect at hotel, `false` = already prepaid. Do not infer from amount.
11. **Guest details depend on the OTA and are never guaranteed.** Every `guest.*` field (name, email, phone, address) plus `rooms[].guestName` is optional - each channel decides what it shares, and many mask or withhold contact details. Treat these fields as nullable/absent, never mark them required, and never reject or fail a booking because they are missing.
12. **`specialRequests` is OTA-dependent free text.** It usually holds guest requests, but some channels put other booking information there. It is optional and may be empty, `null`, or missing. Store it as plain text - do not parse it into fields, and do not assume any fixed format.
13. **Restriction fields:** unset = `null`. Do not omit the key - send `null` explicitly.
14. **No-Show (Mark No Show) uses body field `channel` (not `partner`) and currently supports `channel: "booking.com"` and `channel: "gommt"` only.** Do not fabricate other channels.
15. **If asked to generate code, prefer the language/runtime the user is already using.** Always use `Content-Type: application/json` and parse the `success`/`message` response shape.
16. **If a request fails, surface the response body.** Don't suppress errors or retry blindly.
17. **OTA channel keys are lowercase strings.** Allowed in this doc: `agoda`, `airbnb`, `booking.com`, `bookingsmaker`, `cleartrip`, `ctrip`, `easemytrip`, `expedia`, `Goibibo`, `happyeasygo`, `hostelworld`, `hotelbeds`, `MakeMyTrip`, `reconline`, `tiket`, `travelguru`, `traveloka`, `travolounge`, `vhshub`, `travelguru`.

## Base URL

```
https://live.aiosell.com/api/v2/cm
```

Two API directions:

- **PMS to Aiosell (Push):** you call Aiosell. Base URL above.
- **Aiosell to PMS (Webhook):** Aiosell calls a URL YOU host. You provide the URL to Aiosell during onboarding.

## Authentication

Every request uses **HTTP Basic Auth**. Credentials (username + password) are issued by Aiosell only after partner onboarding - they are NOT included in this file. Build with placeholders and prompt the user for their real values once they have registered as a partner.

| Direction                | Who sends the header | Credentials                                              |
| ------------------------ | -------------------- | -------------------------------------------------------- |
| PMS to Aiosell           | You send             | Issued to you at partner onboarding                      |
| Aiosell to PMS (webhook) | Aiosell sends        | Your endpoint must validate the header before processing |

Use these placeholders until the user supplies real credentials:

```
username: <USERNAME>
password: <PASSWORD>
header:   Authorization: Basic <base64(<USERNAME>:<PASSWORD>)>
```

**Encoding the header in code:**

```bash
# curl: use -u
curl -u '<USERNAME>:<PASSWORD>' …
```

```js
// JavaScript / Node
const auth = "Basic " + btoa("<USERNAME>:<PASSWORD>");
fetch(url, {
  headers: { Authorization: auth, "Content-Type": "application/json" },
});
```

```python
# Python
from requests.auth import HTTPBasicAuth
requests.post(url, json=payload, auth=HTTPBasicAuth('<USERNAME>', '<PASSWORD>'))
```

**Validating the inbound webhook on your side:** parse the `Authorization` header, base64-decode it, constant-time compare against your stored credentials. Reject with 401 if it doesn't match.

## Endpoint Index

- **Get Property / Mapping Details** - `GET https://live.aiosell.com/api/v2/cm/property_details/sandbox-pms?partnerId=sample-pms`
- **Inventory Push** - `POST https://live.aiosell.com/api/v2/cm/update/sample-pms`
- **Rate Push** - `POST https://live.aiosell.com/api/v2/cm/update-rates/sample-pms`
- **Inventory Restrictions Push** - `POST https://live.aiosell.com/api/v2/cm/update/sample-pms`
- **Rate Restrictions Push** - `POST https://live.aiosell.com/api/v2/cm/update-rates/sample-pms`
- **Mark No Show** - `POST https://live.aiosell.com/api/v2/cm/marknoshow/sample-pms`
- **Fetch Inventory** - `POST https://live.aiosell.com/api/v2/cm/data/sample-pms`
- **Fetch Rates** - `POST https://live.aiosell.com/api/v2/cm/data/sample-pms`
- **Fetch Reservations** - `POST https://live.aiosell.com/api/v2/cm/data/sample-pms`
- **Reservation: Book** - `POST https://sample-pms.com/update_reservation`
- **Reservation: Modify** - `POST https://sample-pms.com/update_reservation`
- **Reservation: Cancel** - `POST https://sample-pms.com/update_reservation`
- **Channel Multiplier** - `POST https://live.aiosell.com/api/v2/cm/channel_multiplier/sample-pms`

---

## Get Property / Mapping Details

- **Method:** `GET`
- **URL:** `https://live.aiosell.com/api/v2/cm/property_details/sandbox-pms?partnerId=sample-pms`
- **Direction:** PMS ← Aiosell (you call Aiosell to fetch your property mapping)

Fetch the full property configuration - hotel id, room codes, and rateplan codes. These are the exact identifiers you must send in every other API, so call this first to build your mapping.

**Notes:**

- Call this FIRST. The `hotel_id`, `room_id`, and `rateplan_id` values returned here are the codes to use as `hotelCode`, `roomCode`, and `rateplanCode` in the Push and Fetch APIs.
- Replace `sandbox-pms` in the path with your hotel code, and `partnerId=sample-pms` with the partner id (`{pms}`) Aiosell assigned you.
- This is a GET request - all parameters go in the URL. There is no request body.

**Headers:**

| Header          | Required | Example                     |
| --------------- | -------- | --------------------------- |
| `Authorization` | Yes      | `Basic <base64(user:pass)>` |

**Parameters:**

| Field       | Type           | Required | Description                                                                        |
| ----------- | -------------- | -------- | ---------------------------------------------------------------------------------- |
| `hotelCode` | string (path)  | Yes      | Property identifier, in the URL path. Sandbox value: `sandbox-pms`.                |
| `partnerId` | string (query) | Yes      | Your partner id ({pms}), passed as a query parameter. Sandbox value: `sample-pms`. |

**Sample response:**

```json
{
  "address": {
    "line": "India, Bangalore",
    "city": "Bangalore",
    "state": "Karnataka",
    "location": {
      "long": "12.917836347560788",
      "latt": "77.6750138517398"
    },
    "country_code": "IN"
  },
  "currency": "INR",
  "timezone": "Asia/Kolkata",
  "contact": {
    "phone": "",
    "email": "",
    "website": ""
  },
  "rooms": [
    {
      "description": "Free Wifi",
      "count": 25,
      "active": true,
      "type": "primary",
      "rateplans": [
        {
          "description": "",
          "occupancy": 1,
          "rateplan_id": "executive-s-ep",
          "rateplan_name": "Room Only",
          "no_of_meals": 0,
          "extra_adult": 500
        },
        {
          "description": "",
          "occupancy": 2,
          "rateplan_id": "executive-d-ep",
          "rateplan_name": "Room Only",
          "no_of_meals": 0,
          "extra_adult": 500
        },
        {
          "description": "",
          "occupancy": 1,
          "rateplan_id": "executive-s-cp",
          "rateplan_name": "Breakfast",
          "no_of_meals": 1,
          "extra_adult": 500
        },
        {
          "description": "",
          "occupancy": 2,
          "rateplan_id": "executive-d-cp",
          "rateplan_name": "Breakfast",
          "no_of_meals": 2,
          "extra_adult": 500
        }
      ],
      "room_id": "executive",
      "room_name": "EXECUTIVE",
      "min_occ": 1,
      "max_occ": 2
    },
    {
      "description": "Free Wifi",
      "count": 5,
      "active": true,
      "type": "primary",
      "rateplans": [
        {
          "description": "",
          "occupancy": 1,
          "rateplan_id": "suite-s-ep",
          "rateplan_name": "Room Only",
          "no_of_meals": 0,
          "extra_adult": 500
        },
        {
          "description": "",
          "occupancy": 2,
          "rateplan_id": "suite-d-ep",
          "rateplan_name": "Room Only",
          "no_of_meals": 0,
          "extra_adult": 500
        },
        {
          "description": "",
          "occupancy": 1,
          "rateplan_id": "suite-s-cp",
          "rateplan_name": "Breakfast",
          "no_of_meals": 1,
          "extra_adult": 500
        },
        {
          "description": "",
          "occupancy": 2,
          "rateplan_id": "suite-d-cp",
          "rateplan_name": "Breakfast",
          "no_of_meals": 2,
          "extra_adult": 500
        }
      ],
      "room_id": "suite",
      "room_name": "SUITE",
      "min_occ": 1,
      "max_occ": 3
    }
  ],
  "hotel_id": "sandbox-pms",
  "hotel_name": "Sandbox PMS",
  "property_category": "hotel",
  "tax_id": ""
}
```

## Inventory Push

- **Method:** `POST`
- **URL:** `https://live.aiosell.com/api/v2/cm/update/sample-pms`
- **Direction:** PMS to Aiosell (you call Aiosell to push data)

Push room availability from your PMS to Aiosell so the Channel Manager can distribute the latest inventory to OTAs.

**Notes:**

- Replace `{pms}` in the URL with the PMS slug Aiosell assigned you (e.g. `sample-pms`).
- Inventory updates are upserts - sending a new value for a date range overwrites the prior value.

**Headers:**

| Header          | Required | Example                     |
| --------------- | -------- | --------------------------- |
| `Content-Type`  | Yes      | `application/json`          |
| `Authorization` | Yes      | `Basic <base64(user:pass)>` |

**Body fields:**

| Field                         | Type                | Required | Description                              |
| ----------------------------- | ------------------- | -------- | ---------------------------------------- |
| `hotelCode`                   | string              | Yes      | Property identifier shared by Aiosell.   |
| `updates`                     | array<Update>       | Yes      | List of inventory update blocks.         |
| `updates[].startDate`         | string (YYYY-MM-DD) | Yes      | Inclusive start of the inventory window. |
| `updates[].endDate`           | string (YYYY-MM-DD) | Yes      | Inclusive end of the inventory window.   |
| `updates[].rooms`             | array<Room>         | Yes      | Inventory per room type for the window.  |
| `updates[].rooms[].roomCode`  | string              | Yes      | Room type identifier.                    |
| `updates[].rooms[].available` | integer             | Yes      | Non-negative count of available rooms.   |

**Sample request:**

```json
{
  "hotelCode": "sandbox-pms",
  "updates": [
    {
      "startDate": "2023-01-24",
      "endDate": "2023-01-26",
      "rooms": [
        {
          "available": 5,
          "roomCode": "executive"
        },
        {
          "available": 3,
          "roomCode": "suite"
        }
      ]
    }
  ]
}
```

**Sample response:**

```json
{
  "success": true,
  "message": "Inventory Updated Successfully"
}
```

## Rate Push

- **Method:** `POST`
- **URL:** `https://live.aiosell.com/api/v2/cm/update-rates/sample-pms`
- **Direction:** PMS to Aiosell (you call Aiosell to push data)

Send rate updates per room type and rate plan for a date range.

**Notes:**

- Rates are pushed at the (room, rateplan, date) grain. Date ranges expand into per-day rates server-side.

**Headers:**

| Header          | Required | Example                     |
| --------------- | -------- | --------------------------- |
| `Content-Type`  | Yes      | `application/json`          |
| `Authorization` | Yes      | `Basic <base64(user:pass)>` |

**Body fields:**

| Field                            | Type                | Required | Description                            |
| -------------------------------- | ------------------- | -------- | -------------------------------------- |
| `hotelCode`                      | string              | Yes      | Property identifier.                   |
| `updates`                        | array<Update>       | Yes      | List of rate update blocks.            |
| `updates[].startDate`            | string (YYYY-MM-DD) | Yes      | Start date.                            |
| `updates[].endDate`              | string (YYYY-MM-DD) | Yes      | End date.                              |
| `updates[].rates`                | array<Rate>         | Yes      | Per (room, rateplan) rate entries.     |
| `updates[].rates[].roomCode`     | string              | Yes      | Room type identifier.                  |
| `updates[].rates[].rateplanCode` | string              | Yes      | Rate plan identifier.                  |
| `updates[].rates[].rate`         | number              | Yes      | Nightly rate in the property currency. |

**Sample request:**

```json
{
  "hotelCode": "sandbox-pms",
  "updates": [
    {
      "startDate": "2023-02-22",
      "endDate": "2023-02-24",
      "rates": [
        {
          "roomCode": "executive",
          "rate": 1749,
          "rateplanCode": "executive-s-ep"
        },
        {
          "roomCode": "suite",
          "rate": 2999,
          "rateplanCode": "suite-d-cp"
        }
      ]
    }
  ]
}
```

**Sample response:**

```json
{
  "success": true,
  "message": "Rates Updated Successfully"
}
```

## Inventory Restrictions Push

- **Method:** `POST`
- **URL:** `https://live.aiosell.com/api/v2/cm/update/sample-pms`
- **Direction:** PMS to Aiosell (you call Aiosell to push data)

Send restriction data (stop-sell, minimum stay, CTA/CTD, etc.) at the room level for a date range and target channels.

**Notes:**

- Inventory restrictions push is only for room-type level.

**Headers:**

| Header          | Required | Example                     |
| --------------- | -------- | --------------------------- |
| `Content-Type`  | Yes      | `application/json`          |
| `Authorization` | Yes      | `Basic <base64(user:pass)>` |

**Body fields:**

| Field                                      | Type                | Required | Description                               |
| ------------------------------------------ | ------------------- | -------- | ----------------------------------------- |
| `hotelCode`                                | string              | Yes      | Property identifier.                      |
| `toChannels`                               | array<string>       | Yes      | Channels the restriction should apply to. |
| `updates`                                  | array<Update>       | Yes      | Restriction update blocks.                |
| `updates[].startDate`                      | string (YYYY-MM-DD) | Yes      | Start date.                               |
| `updates[].endDate`                        | string (YYYY-MM-DD) | Yes      | End date.                                 |
| `updates[].rooms`                          | array<Room>         | Yes      | Per-room restrictions.                    |
| `updates[].rooms[].roomCode`               | string              | Yes      | Room type identifier.                     |
| `updates[].rooms[].restrictions`           | object              | Yes      | Restriction object (see fields below).    |
| `- restrictions.stopSell`                  | boolean             | No       | Disable all bookings for this room/date.  |
| `- restrictions.minimumStay`               | integer             | No       | Minimum nights required.                  |
| `- restrictions.maximumStay`               | integer             | null     | No                                        | Maximum nights allowed.                     |
| `- restrictions.closeOnArrival`            | boolean             | No       | Block check-ins on this date.             |
| `- restrictions.closeOnDeparture`          | boolean             | No       | Block check-outs on this date.            |
| `- restrictions.minimumStayArrival`        | integer             | null     | No                                        | Minimum stay if arriving on this date.      |
| `- restrictions.maximumStayArrival`        | integer             | null     | No                                        | Maximum stay if arriving on this date.      |
| `- restrictions.exactStayArrival`          | integer             | null     | No                                        | Exact stay length if arriving on this date. |
| `- restrictions.minimumAdvanceReservation` | integer             | null     | No                                        | Min days ahead a booking must be made.      |
| `- restrictions.maximumAdvanceReservation` | integer             | null     | No                                        | Max days ahead a booking can be made.       |

**Sample request:**

```json
{
  "hotelCode": "sandbox-pms",
  "toChannels": ["agoda", "booking.com"],
  "updates": [
    {
      "startDate": "2023-01-24",
      "endDate": "2023-01-26",
      "rooms": [
        {
          "roomCode": "executive",
          "restrictions": {
            "stopSell": false,
            "exactStayArrival": null,
            "maximumStayArrival": null,
            "minimumAdvanceReservation": null,
            "minimumStay": 1,
            "closeOnArrival": false,
            "minimumStayArrival": null,
            "maximumStay": null,
            "maximumAdvanceReservation": null,
            "closeOnDeparture": false
          }
        }
      ]
    }
  ]
}
```

**Sample response:**

```json
{
  "success": true,
  "message": "Inventory Updated Successfully"
}
```

## Rate Restrictions Push

- **Method:** `POST`
- **URL:** `https://live.aiosell.com/api/v2/cm/update-rates/sample-pms`
- **Direction:** PMS to Aiosell (you call Aiosell to push data)

Push rate-plan-level restrictions covering stop-sell, min/max stay, advance booking windows, etc.

**Notes:**

- Identical restriction fields to the inventory restrictions API, but scoped to a (room, rateplan).

**Headers:**

| Header          | Required | Example                     |
| --------------- | -------- | --------------------------- |
| `Content-Type`  | Yes      | `application/json`          |
| `Authorization` | Yes      | `Basic <base64(user:pass)>` |

**Body fields:**

| Field                            | Type                | Required | Description                                                 |
| -------------------------------- | ------------------- | -------- | ----------------------------------------------------------- |
| `hotelCode`                      | string              | Yes      | Property identifier.                                        |
| `toChannels`                     | array<string>       | Yes      | Distribution channels.                                      |
| `updates`                        | array<Update>       | Yes      | Restriction update blocks.                                  |
| `updates[].startDate`            | string (YYYY-MM-DD) | Yes      | Start date.                                                 |
| `updates[].endDate`              | string (YYYY-MM-DD) | Yes      | End date.                                                   |
| `updates[].rates`                | array<Rate>         | Yes      | Per (room, rateplan) restriction entries.                   |
| `updates[].rates[].roomCode`     | string              | Yes      | Room type identifier.                                       |
| `updates[].rates[].rateplanCode` | string              | Yes      | Rate plan identifier.                                       |
| `updates[].rates[].restrictions` | object              | Yes      | Restriction object (same fields as inventory restrictions). |

**Sample request:**

```json
{
  "hotelCode": "sandbox-pms",
  "toChannels": ["agoda", "booking.com"],
  "updates": [
    {
      "startDate": "2023-02-22",
      "endDate": "2023-02-24",
      "rates": [
        {
          "roomCode": "executive",
          "rateplanCode": "executive-s-ep",
          "restrictions": {
            "stopSell": false,
            "exactStayArrival": null,
            "maximumStayArrival": null,
            "minimumAdvanceReservation": null,
            "minimumStay": 1,
            "closeOnArrival": false,
            "maximumStay": null,
            "maximumAdvanceReservation": null,
            "closeOnDeparture": false
          }
        }
      ]
    }
  ]
}
```

**Sample response:**

```json
{
  "success": true,
  "message": "Rates Updated Successfully"
}
```

## Mark No Show

- **Method:** `POST`
- **URL:** `https://live.aiosell.com/api/v2/cm/marknoshow/sample-pms`
- **Direction:** PMS to Aiosell (you call Aiosell to push data)

Mark a booking as a no-show.

**Notes:**

- Replace `{pms}` in the URL with the PMS slug Aiosell assigned you (e.g. `sample-pms`).
- Currently supports `booking.com` and `gommt` (Goibibo & Make My Trip) as the channel.

**Headers:**

| Header          | Required | Example                     |
| --------------- | -------- | --------------------------- |
| `Content-Type`  | Yes      | `application/json`          |
| `Authorization` | Yes      | `Basic <base64(user:pass)>` |

**Body fields:**

| Field       | Type   | Required | Description                 |
| ----------- | ------ | -------- | --------------------------- |
| `hotelCode` | string | Yes      | Property identifier.        |
| `bookingId` | string | Yes      | Booking reference number.   |
| `channel`   | string | Yes      | Channel partner identifier. |

**Sample request:**

```json
{
  "hotelCode": "SANDBOX-OTA",
  "bookingId": "111222350",
  "channel": "gommt"
}
```

**Sample response:**

```json
{
  "success": true,
  "message": "Noshow Marked Successfully"
}
```

## Fetch Inventory

- **Method:** `POST`
- **URL:** `https://live.aiosell.com/api/v2/cm/data/sample-pms`
- **Direction:** PMS ← Aiosell (you call Aiosell to fetch data)

Fetch current room availability (inventory) from Aiosell for a given hotel and date range.

**Notes:**

- All three Fetch APIs share the same endpoint - the `type` field on the body decides which dataset is returned.
- Replace `{pms}` in the URL with the PMS slug Aiosell assigned you (e.g. `sample-pms`).
- Dates are inclusive on both ends.

**Headers:**

| Header          | Required | Example                     |
| --------------- | -------- | --------------------------- |
| `Content-Type`  | Yes      | `application/json`          |
| `Authorization` | Yes      | `Basic <base64(user:pass)>` |

**Body fields:**

| Field       | Type                | Required | Description                              |
| ----------- | ------------------- | -------- | ---------------------------------------- |
| `type`      | string              | Yes      | Dataset selector. Must be `"inventory"`. |
| `hotelCode` | string              | Yes      | Property identifier shared by Aiosell.   |
| `startDate` | string (YYYY-MM-DD) | Yes      | Inclusive start of the query window.     |
| `endDate`   | string (YYYY-MM-DD) | Yes      | Inclusive end of the query window.       |

**Sample request:**

```json
{
  "type": "inventory",
  "hotelCode": "sandbox-pms",
  "startDate": "2025-07-20",
  "endDate": "2025-07-22"
}
```

**Sample response:**

```json
{
  "hotelCode": "sandbox-pms",
  "updates": [
    {
      "startDate": "2025-07-22",
      "endDate": "2025-07-22",
      "rooms": [
        {
          "available": 10,
          "roomCode": "45000437057"
        },
        {
          "available": 22,
          "roomCode": "45000437056"
        }
      ]
    }
  ]
}
```

## Fetch Rates

- **Method:** `POST`
- **URL:** `https://live.aiosell.com/api/v2/cm/data/sample-pms`
- **Direction:** PMS ← Aiosell (you call Aiosell to fetch data)

Fetch current rates by (room, rateplan, date) from Aiosell for a hotel and date range.

**Notes:**

- Shared endpoint with Fetch Inventory / Fetch Reservations - `type` distinguishes them.
- Rates are returned at the (room, rateplan, date) grain.

**Headers:**

| Header          | Required | Example                     |
| --------------- | -------- | --------------------------- |
| `Content-Type`  | Yes      | `application/json`          |
| `Authorization` | Yes      | `Basic <base64(user:pass)>` |

**Body fields:**

| Field       | Type                | Required | Description                          |
| ----------- | ------------------- | -------- | ------------------------------------ |
| `type`      | string              | Yes      | Dataset selector. Must be `"rates"`. |
| `hotelCode` | string              | Yes      | Property identifier.                 |
| `startDate` | string (YYYY-MM-DD) | Yes      | Inclusive start.                     |
| `endDate`   | string (YYYY-MM-DD) | Yes      | Inclusive end.                       |

**Sample request:**

```json
{
  "type": "rates",
  "hotelCode": "sandbox-pms",
  "startDate": "2025-07-20",
  "endDate": "2025-07-22"
}
```

**Sample response:**

```json
{
  "hotelCode": "sandbox-pms",
  "updates": [
    {
      "startDate": "2025-07-22",
      "endDate": "2025-07-22",
      "rates": [
        {
          "roomCode": "45000437056",
          "rate": 1500,
          "rateplanCode": "990000801753"
        }
      ]
    }
  ]
}
```

## Fetch Reservations

- **Method:** `POST`
- **URL:** `https://live.aiosell.com/api/v2/cm/data/sample-pms`
- **Direction:** PMS ← Aiosell (you call Aiosell to fetch data)

Fetch reservation and booking details (received via OTAs) for a hotel and date range.

**Notes:**

- Shared endpoint with Fetch Inventory / Fetch Rates - `type` distinguishes them.
- Returns an array of reservation objects mirroring the Reservation: Book webhook payload (action, amount, guest, rooms, etc.).
- Guest details depend on the OTA. Every `guest.*` field is optional and may be empty, `null`, or missing - handle it accordingly.
- `specialRequests` is OTA-dependent free text and may carry guest requests or other booking information. Store it as plain text.

**Headers:**

| Header          | Required | Example                     |
| --------------- | -------- | --------------------------- |
| `Content-Type`  | Yes      | `application/json`          |
| `Authorization` | Yes      | `Basic <base64(user:pass)>` |

**Body fields:**

| Field       | Type                | Required | Description                                |
| ----------- | ------------------- | -------- | ------------------------------------------ |
| `type`      | string              | Yes      | Dataset selector. Must be `"reservation"`. |
| `hotelCode` | string              | Yes      | Property identifier.                       |
| `startDate` | string (YYYY-MM-DD) | Yes      | Inclusive start.                           |
| `endDate`   | string (YYYY-MM-DD) | Yes      | Inclusive end.                             |

**Sample request:**

```json
{
  "type": "reservation",
  "hotelCode": "sandbox-pms",
  "startDate": "2025-07-20",
  "endDate": "2025-07-22"
}
```

**Sample response:**

```json
[
  {
    "action": "book",
    "hotelCode": "sandbox-pms",
    "channel": "Goibibo",
    "bookingId": "111222333",
    "cmBookingId": "AAABBBCCC",
    "bookedOn": "2025-07-18 15:25:35",
    "checkin": "2025-07-22",
    "checkout": "2025-07-23",
    "segment": "OTA",
    "specialRequests": "Airport Taxi Required",
    "pah": false,
    "amount": {
      "amountAfterTax": 1204,
      "amountBeforeTax": 1075,
      "tax": 129,
      "currency": "INR",
      "commission": 215,
      "tcs": 5.38,
      "tds": 1.08
    },
    "guest": {
      "firstName": "Akshay",
      "lastName": "Kumar",
      "email": "akshaykumar@gmail.com",
      "phone": "9988776655",
      "address": {
        "line1": "51",
        "city": "Bangalore",
        "state": "Karnataka",
        "country": "India",
        "zipCode": "560035"
      }
    },
    "rooms": [
      {
        "roomCode": "45000437056",
        "rateplanCode": "990000801753",
        "guestName": "Akshay Kumar",
        "occupancy": {
          "adults": 1,
          "children": 0
        },
        "prices": [
          {
            "date": "2025-07-22",
            "sellRate": 1075
          }
        ]
      }
    ]
  }
]
```

## Reservation: Book

- **Method:** `POST`
- **URL:** `https://sample-pms.com/update_reservation`
- **Direction:** Aiosell to PMS (Aiosell calls your endpoint)

Aiosell calls YOUR webhook endpoint when an OTA booking lands. Your PMS must expose an endpoint and share the URL with Aiosell.

**Notes:**

- This is an inbound webhook FROM Aiosell TO your PMS - you implement the endpoint, Aiosell calls it.
- The same endpoint receives `book`, `modify`, and `cancel` events differentiated by the `action` field.
- Guest details depend on the OTA. Each channel decides how much it shares, and many mask or withhold the email, phone, and address. Treat every `guest.*` field as optional: it may arrive empty, `null`, or missing. Do not require them, and do not reject a booking because they are absent.
- `specialRequests` is free text and its contents depend on the OTA. It usually carries guest requests, but some channels use it for other booking information. Store it as plain text and do not parse it into a fixed structure.

**Headers:**

| Header          | Required | Example                     |
| --------------- | -------- | --------------------------- |
| `Content-Type`  | Yes      | `application/json`          |
| `Authorization` | Yes      | `Basic <base64(user:pass)>` |

**Body fields:**

| Field                        | Type                | Required | Description                                                      |
| ---------------------------- | ------------------- | -------- | ---------------------------------------------------------------- |
| `action`                     | string              | Yes      | Operation type.                                                  |
| `hotelCode`                  | string              | Yes      | Property identifier.                                             |
| `channel`                    | string              | Yes      | Booking source/OTA name.                                         |
| `bookingId`                  | string              | Yes      | Unique booking ID from the OTA.                                  |
| `cmBookingId`                | string              | null     | No                                                               | OTA itinerary / channel-manager booking ID.                                                                                                                                                 |
| `bookedOn`                   | string (ISO 8601)   | Yes      | Booking creation timestamp.                                      |
| `checkin`                    | string (YYYY-MM-DD) | Yes      | Check-in date.                                                   |
| `checkout`                   | string (YYYY-MM-DD) | Yes      | Check-out date.                                                  |
| `segment`                    | string              | Yes      | Booking category.                                                |
| `specialRequests`            | string              | null     | No                                                               | Free-text field. Contents depend on the OTA: usually guest requests, but some channels also place other booking information here. Parse it as plain text and do not rely on a fixed format. |
| `pah`                        | boolean             | Yes      | Pay-at-hotel flag. `true` = collect at hotel; `false` = prepaid. |
| `amount.amountAfterTax`      | number              | Yes      | Total with taxes.                                                |
| `amount.amountBeforeTax`     | number              | Yes      | Subtotal.                                                        |
| `amount.tax`                 | number              | Yes      | Tax amount.                                                      |
| `amount.currency`            | string (ISO 4217)   | Yes      | Currency code.                                                   |
| `amount.commission`          | number              | null     | No                                                               | OTA commission on the booking. `null` when the channel does not report it (e.g. Booking.com).                                                                                               |
| `amount.tcs`                 | number              | null     | No                                                               | Tax Collected at Source. `null` when not applicable.                                                                                                                                        |
| `amount.tds`                 | number              | null     | No                                                               | Tax Deducted at Source. `null` when not applicable.                                                                                                                                         |
| `guest.firstName`            | string              | null     | No                                                               | Guest first name. Sent only if the OTA shares it.                                                                                                                                           |
| `guest.lastName`             | string              | null     | No                                                               | Guest last name. Sent only if the OTA shares it.                                                                                                                                            |
| `guest.email`                | string              | null     | No                                                               | Guest email. Often masked or withheld by the OTA.                                                                                                                                           |
| `guest.phone`                | string              | null     | No                                                               | Guest phone. Often masked or withheld by the OTA.                                                                                                                                           |
| `guest.address.line1`        | string              | null     | No                                                               | Address line 1. Sent only if the OTA shares it.                                                                                                                                             |
| `guest.address.city`         | string              | null     | No                                                               | City. Sent only if the OTA shares it.                                                                                                                                                       |
| `guest.address.state`        | string              | null     | No                                                               | State/province. Sent only if the OTA shares it.                                                                                                                                             |
| `guest.address.country`      | string              | null     | No                                                               | Country. Sent only if the OTA shares it.                                                                                                                                                    |
| `guest.address.zipCode`      | string              | null     | No                                                               | Postal code. Sent only if the OTA shares it.                                                                                                                                                |
| `rooms[].roomCode`           | string              | Yes      | Room type.                                                       |
| `rooms[].rateplanCode`       | string              | Yes      | Rate plan.                                                       |
| `rooms[].guestName`          | string              | null     | No                                                               | Guest name on the room. Sent only if the OTA shares it.                                                                                                                                     |
| `rooms[].occupancy.adults`   | integer             | Yes      | Adults count.                                                    |
| `rooms[].occupancy.children` | integer             | Yes      | Children count.                                                  |
| `rooms[].prices[].date`      | string (YYYY-MM-DD) | Yes      | Per-night date.                                                  |
| `rooms[].prices[].sellRate`  | number              | Yes      | Per-night sell rate.                                             |

**Sample request:**

```json
{
  "action": "book",
  "hotelCode": "sandbox-pms",
  "channel": "Goibibo",
  "bookingId": "111222333",
  "cmBookingId": "AAABBBCCC",
  "bookedOn": "2022-12-08 15:25:35",
  "checkin": "2022-12-10",
  "checkout": "2022-12-12",
  "segment": "OTA",
  "specialRequests": "Airport Taxi Required",
  "pah": false,
  "amount": {
    "amountAfterTax": 1204,
    "amountBeforeTax": 1075,
    "tax": 129,
    "currency": "INR",
    "commission": 215,
    "tcs": 5.38,
    "tds": 1.08
  },
  "guest": {
    "firstName": "Akshay",
    "lastName": "Kumar",
    "email": "akshaykumar@gmail.com",
    "phone": "9988776655",
    "address": {
      "line1": "51",
      "city": "Bangalore",
      "state": "Karnataka",
      "country": "India",
      "zipCode": "560035"
    }
  },
  "rooms": [
    {
      "roomCode": "executive",
      "rateplanCode": "executive-s-ep",
      "guestName": "Akshay Kumar",
      "occupancy": {
        "adults": 1,
        "children": 0
      },
      "prices": [
        {
          "date": "2022-12-10",
          "sellRate": 537.5
        },
        {
          "date": "2022-12-11",
          "sellRate": 537.5
        }
      ]
    }
  ]
}
```

**Sample response:**

```json
{
  "success": true,
  "message": "Reservation Updated Successfully"
}
```

## Reservation: Modify

- **Method:** `POST`
- **URL:** `https://sample-pms.com/update_reservation`
- **Direction:** Aiosell to PMS (Aiosell calls your endpoint)

Same endpoint as Reservation: Book, but `action` is `"modify"`. Payload is identical to the original booking payload reflecting the new state.

**Notes:**

- The payload represents the _new_ booking state - overwrite, not delta.

**Headers:**

| Header          | Required | Example                     |
| --------------- | -------- | --------------------------- |
| `Content-Type`  | Yes      | `application/json`          |
| `Authorization` | Yes      | `Basic <base64(user:pass)>` |

**Body fields:**

| Field     | Type         | Required | Description                        |
| --------- | ------------ | -------- | ---------------------------------- |
| `action`  | string       | Yes      | Must be `"modify"`.                |
| `...rest` | same as Book | Yes      | All fields from Reservation: Book. |

**Sample request:**

```json
{
  "action": "modify",
  "hotelCode": "sandbox-pms",
  "channel": "Goibibo",
  "bookingId": "111222333",
  "cmBookingId": "AAABBBCCC",
  "bookedOn": "2022-12-08 15:25:35",
  "checkin": "2022-12-10",
  "checkout": "2022-12-12",
  "segment": "OTA",
  "pah": false,
  "amount": {
    "amountAfterTax": 1204,
    "amountBeforeTax": 1075,
    "tax": 129,
    "currency": "INR",
    "commission": 215,
    "tcs": 5.38,
    "tds": 1.08
  },
  "guest": {
    "firstName": "Akshay",
    "lastName": "Kumar",
    "email": "akshaykumar@gmail.com",
    "phone": "9988776655",
    "address": {
      "line1": "51",
      "city": "Bangalore",
      "state": "Karnataka",
      "country": "India",
      "zipCode": "560035"
    }
  },
  "rooms": [
    {
      "roomCode": "executive",
      "rateplanCode": "executive-s-ep",
      "guestName": "Akshay Kumar",
      "occupancy": {
        "adults": 1,
        "children": 0
      },
      "prices": [
        {
          "date": "2022-12-10",
          "sellRate": 537.5
        },
        {
          "date": "2022-12-11",
          "sellRate": 537.5
        }
      ]
    }
  ]
}
```

**Sample response:**

```json
{
  "success": true,
  "message": "Reservation Modified Successfully"
}
```

## Reservation: Cancel

- **Method:** `POST`
- **URL:** `https://sample-pms.com/update_reservation`
- **Direction:** Aiosell to PMS (Aiosell calls your endpoint)

Cancel a previously booked reservation. Minimal payload.

**Headers:**

| Header          | Required | Example                     |
| --------------- | -------- | --------------------------- |
| `Content-Type`  | Yes      | `application/json`          |
| `Authorization` | Yes      | `Basic <base64(user:pass)>` |

**Body fields:**

| Field       | Type   | Required | Description           |
| ----------- | ------ | -------- | --------------------- |
| `action`    | string | Yes      | Must be `"cancel"`.   |
| `hotelCode` | string | Yes      | Property identifier.  |
| `channel`   | string | Yes      | Booking source.       |
| `bookingId` | string | Yes      | Booking ID to cancel. |

**Sample request:**

```json
{
  "action": "cancel",
  "hotelCode": "sandbox-pms",
  "channel": "Goibibo",
  "bookingId": "111222333"
}
```

**Sample response:**

```json
{
  "success": true,
  "message": "Reservation Cancelled Successfully"
}
```

## Channel Multiplier

- **Method:** `POST`
- **URL:** `https://live.aiosell.com/api/v2/cm/channel_multiplier/sample-pms`
- **Direction:** PMS to Aiosell (you call Aiosell)

Apply a rate multiplier to a property. Every rate is scaled by the factor before it is distributed to channels - use it for markups or markdowns without re-pushing individual rates.

**Notes:**

- Replace `{pms}` in the URL with the PMS slug Aiosell assigned you (e.g. `sample-pms`).
- `multiplier` is a factor, not a percentage: `1.2` raises rates by 20%, `0.9` lowers them by 10%, `1` leaves them unchanged.
- The multiplier is applied on top of the rates you push - it does not overwrite them.
- `channels` is required and cannot be empty - the multiplier is applied only to the channels you list (e.g. `gommt`, `airbnb`), nothing else.

**Headers:**

| Header          | Required | Example                     |
| --------------- | -------- | --------------------------- |
| `Content-Type`  | Yes      | `application/json`          |
| `Authorization` | Yes      | `Basic <base64(user:pass)>` |

**Body fields:**

| Field        | Type          | Required | Description                                                                                   |
| ------------ | ------------- | -------- | --------------------------------------------------------------------------------------------- |
| `hotelCode`  | string        | Yes      | Property identifier shared by Aiosell.                                                        |
| `multiplier` | number        | Yes      | Rate multiplier factor. `1.2` = +20%, `0.9` = -10%, `1` = no change.                          |
| `channels`   | array<string> | Yes      | Non-empty list of channels to apply the multiplier to. Only the listed channels are affected. |

**Sample request:**

```json
{
  "hotelCode": "sandbox-pms",
  "multiplier": 1.25,
  "channels": ["gommt", "airbnb"]
}
```

**Sample response:**

```json
{
  "status": true,
  "message": "Multiplier updated successfully"
}
```

---

## Quick Guardrails Checklist Before Shipping Integration Code

- [ ] All endpoint URLs match the table above byte-for-byte.
- [ ] PMS slug substituted in `/update/{pms}` and `/update-rates/{pms}`.
- [ ] Dates formatted `YYYY-MM-DD`, timestamps `YYYY-MM-DD HH:MM:SS`.
- [ ] Optional restriction fields sent as `null`, not omitted.
- [ ] `Content-Type: application/json` set on every request.
- [ ] Response `success` checked; `message` surfaced on failure.
- [ ] Webhook handler is idempotent on `bookingId` (duplicate deliveries possible).
- [ ] `modify` treated as full-replace, not patch.
- [ ] Guest fields treated as optional - no crash or rejection when the OTA withholds them.
- [ ] `specialRequests` stored as free text, not parsed into a fixed structure.
- [ ] No invented fields, partners, or auth schemes.

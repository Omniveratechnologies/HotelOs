# @hotelos/utils

Shared pure utilities, formatters, normalizers, and Channel Manager rate plan code helpers for the HotelOS platform.

- Package name: `@hotelos/utils`

---

## Exports

### 1. Styling Utilities

- **`cn(...inputs)`**: Merges Tailwind CSS classes predictably using `clsx` and `tailwind-merge`.
- Re-exports: `clsx`, `twMerge`, `twJoin`.

```js
import { cn } from "@hotelos/utils";

const className = cn("px-4 py-2", isPrimary && "bg-brand-700 text-white");
```

### 2. Channel Manager & Rate Plan Code Helpers

- **`deriveRatePlanCode(roomTypeCode, mealPlan, occupancy)`**: Computes standard Aiosell rate plan codes (e.g. `DLX-EP-SGL`).
- **`parseRatePlanCode(ratePlanCode)`**: Deconstructs a code into `{ roomTypeCode, mealPlan, occupancy }`.
- **`OCCUPANCY_LETTER_BY_TYPE`** & **`OCCUPANCY_TYPE_BY_LETTER`**: Lookup maps for single (`S`), double (`D`), and triple (`T`) occupancy codes.

```js
import { deriveRatePlanCode, parseRatePlanCode } from "@hotelos/utils";

const code = deriveRatePlanCode("DLX", "EP", "single"); // "DLX-EP-SGL"
const parsed = parseRatePlanCode("DLX-EP-SGL"); // { roomTypeCode: 'DLX', mealPlan: 'EP', occupancy: 'single' }
```

### 3. Formatters

- **`formatCurrency(amount, currency = "INR")`**: Formats numeric prices as currency strings (e.g. `₹1,200.00`).
- **`formatDate(date, options?)`**: Standard date formatting.
- **`formatTime(date, options?)`**: Standard time formatting.

### 4. Normalizers & State Collections

- **`normalizeRoom(rawRoom)`**: Normalizes backend room records into a standard client shape.
- **`normalizeGuest(rawGuest)`**: Standardizes guest profiles and active stays.
- **`normalizeFoodOrder(rawOrder)`**: Formats food orders for live queues and KDS.
- **`normalizeRequest(rawRequest)`**: Normalizes housekeeping and service requests.
- **`upsert(array, item, key = "id")`**: Pure immutable upsert helper.
- **Status Maps**: `ORDER_STATUS_MAP`, `UI_TO_ORDER_STATUS`, `REQUEST_STATUS_MAP`, `REQUEST_TYPE_MAP`.

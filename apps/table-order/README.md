# Table Order & Digital Menu

Guest-facing digital dining menu, table ordering, payment, and assistance request web application for **HotelOS**. Also serves as the **Digital Menu** preset for HotelOS touchscreen kiosks.

- **Port**: `5179`
- **Package name**: `table-order`
- **Tech Stack**: React 19, TypeScript, Vite, Tailwind CSS
- **Backend API**: `apps/backend` (Express API on port `5001`)

---

## Features

1. **Table QR Code Landing**:
   - Guests scan physical table QR codes (`/:hotelId/table/:tableId`).
   - Automatically loads hotel restaurant menus and table session context.
2. **Food Item Catalog & Customization**:
   - Categorized menu browsing, dietary tags (Veg/Non-Veg), upsell recommendations.
   - Real-time cart management and coupon validation.
3. **Checkout & Online Payments**:
   - Direct dining order creation (`POST /api/v1/orders/table-order`).
   - Integrated Razorpay online payment verification and order status tracking.
4. **Staff Assistance Requests**:
   - Quick table service requests (waiter assistance, cutlery, bill requests).
5. **Kiosk Digital Menu Preset**:
   - Runs in full-screen on dedicated tablet kiosks mounted at dining counters or restaurant lobbies.

---

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable       | Description                                     | Default                 |
| :------------- | :---------------------------------------------- | :---------------------- |
| `VITE_API_URL` | Base URL of HotelOS backend (without `/api/v1`) | `http://localhost:5001` |

> [!NOTE]
> The internal API client automatically prefixes `/api/v1` to all request endpoints, ensuring consistency with the backend server.

---

## Development

```bash
# Run locally on port 5179 with LAN host exposure
pnpm dev

# Build for production
pnpm build
```

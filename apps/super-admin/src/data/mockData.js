// ---------------------------------------------------------------------------
// MOCK DATA — replace with real API responses once your backend is connected.
// Shapes here define the contract your backend should return.
// ---------------------------------------------------------------------------

export const mockHotels = [
  {
    id: "htl_001",
    name: "The Grand Meridian",
    email: "admin@grandmeridian.com",
    status: "active", // "active" | "deactivated"
    createdAt: "2025-11-02",
    subscription: {
      plan: "Pro",
      expiresOn: "2026-09-14",
      status: "active", // "active" | "expiring_soon" | "expired"
    },
  },
  {
    id: "htl_002",
    name: "Blue Harbor Suites",
    email: "ops@blueharbor.io",
    status: "active",
    createdAt: "2025-08-21",
    subscription: {
      plan: "Basic",
      expiresOn: "2026-08-29",
      status: "expiring_soon",
    },
  },
  {
    id: "htl_003",
    name: "Palm & Pine Resort",
    email: "contact@palmpine.com",
    status: "deactivated",
    createdAt: "2025-05-10",
    subscription: {
      plan: "Pro",
      expiresOn: "2026-06-01",
      status: "expired",
    },
  },
  {
    id: "htl_004",
    name: "Northgate Inn",
    email: "hello@northgateinn.com",
    status: "active",
    createdAt: "2026-01-18",
    subscription: {
      plan: "Enterprise",
      expiresOn: "2027-01-18",
      status: "active",
    },
  },
  {
    id: "htl_005",
    name: "Sable Ridge Lodge",
    email: "manager@sableridge.com",
    status: "active",
    createdAt: "2025-12-30",
    subscription: {
      plan: "Basic",
      expiresOn: "2026-08-20",
      status: "expiring_soon",
    },
  },
];

export const mockTransactions = [
  {
    id: "txn_1001",
    hotelId: "htl_001",
    hotelName: "The Grand Meridian",
    amount: 84250,
    transactions: 312,
    lastTransactionAt: "2026-08-14",
  },
  {
    id: "txn_1002",
    hotelId: "htl_002",
    hotelName: "Blue Harbor Suites",
    amount: 52100,
    transactions: 198,
    lastTransactionAt: "2026-08-13",
  },
  {
    id: "txn_1003",
    hotelId: "htl_003",
    hotelName: "Palm & Pine Resort",
    amount: 12800,
    transactions: 44,
    lastTransactionAt: "2026-07-02",
  },
  {
    id: "txn_1004",
    hotelId: "htl_004",
    hotelName: "Northgate Inn",
    amount: 96700,
    transactions: 401,
    lastTransactionAt: "2026-08-15",
  },
  {
    id: "txn_1005",
    hotelId: "htl_005",
    hotelName: "Sable Ridge Lodge",
    amount: 33420,
    transactions: 121,
    lastTransactionAt: "2026-08-12",
  },
];

export const mockServiceRequests = [
  {
    id: "req_501",
    hotelName: "The Grand Meridian",
    subject: "POS terminal not syncing orders",
    priority: "high", // "high" | "medium" | "low"
    status: "open", // "open" | "in_progress" | "resolved"
    createdAt: "2026-08-14",
  },
  {
    id: "req_502",
    hotelName: "Blue Harbor Suites",
    subject: "Request to add 2 more staff logins",
    priority: "low",
    status: "in_progress",
    createdAt: "2026-08-12",
  },
  {
    id: "req_503",
    hotelName: "Northgate Inn",
    subject: "Billing invoice mismatch for July",
    priority: "medium",
    status: "open",
    createdAt: "2026-08-10",
  },
  {
    id: "req_504",
    hotelName: "Sable Ridge Lodge",
    subject: "Enable multi-currency for food orders",
    priority: "medium",
    status: "resolved",
    createdAt: "2026-08-01",
  },
];

export const currentAdmin = {
  name: "Aditi Rao",
  email: "aditi.rao@platform.com",
  role: "Super Admin",
};

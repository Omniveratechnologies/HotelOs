// Thin MongoDB adapter for Business Intelligence.
//
// Uses the REAL Omni collections:
//   PMS:
//     bookings
//     rooms
//     roomtypes
//
//   Billing / POS:
//     bills
//     payments
//     fooditems
//
//   Optional:
//     pos_daily_costs
//     guests
//
// Does NOT depend on the old intelligence collections:
//   reservations
//   revenue_daily
//   pos_orders
//   pos_products
//   pos_diners
//
// Hotel access is always resolved from the authenticated session.
// HOTEL_ID is NEVER used.

import mongoose from "mongoose";

import { assertKnownBiDashboard } from "#/modules/intelligence/lib/bi/intelligence-data.js";
import {
  computeWindows,
  computeBiPayload,
} from "#/modules/intelligence/lib/bi/shape.js";

import {
  generateRecommendations,
  guestExperienceScore,
  operationalEfficiency,
} from "#/modules/intelligence/lib/bi/recommendations.js";

const TZ = "Asia/Kolkata";

const DAY_MS = 24 * 60 * 60 * 1000;

// --------------------------------------------------
// BILL TYPES
// --------------------------------------------------

const ROOM_BILL_TYPES = new Set([
  "room",
  "room-only",
  "room_only",
  "accommodation",
  "lodging",
  "room-rent",
  "room_rent",
  "stay",
]);

const OTHER_BILL_TYPES = new Set([
  "minibar",
  "laundry",
  "spa",
  "wellness",
  "activity",
  "activities",
  "tour",
  "other-service",
  "other_service",
  "miscellaneous",
  "misc",
]);

const VALID_REVENUE_BOOKING_STATUS = new Set([
  "reserved",
  "confirmed",
  "checked-in",
  "checked_out",
  "checked-out",
  "checked_in",
  "completed",
]);

// --------------------------------------------------
// BASIC HELPERS
// --------------------------------------------------

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

const n = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const isValidObjectId = (value) => mongoose.isValidObjectId(value);

const asObjectId = (value) => new mongoose.Types.ObjectId(value);

const dayKey = (value) => {
  const date = new Date(value);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const utcDay = (key) => new Date(`${key}T00:00:00.000Z`);

const billTypeOf = (bill) => normalize(bill?.billType);

// --------------------------------------------------
// DATABASE
// --------------------------------------------------

async function getDb() {
  const db = mongoose.connection.db;

  if (!db) {
    const error = new Error("Database connection is unavailable.");

    error.status = 503;

    throw error;
  }

  return db;
}

// --------------------------------------------------
// AUTHORIZED HOTEL
// --------------------------------------------------

async function getAuthorizedHotelId(request) {
  if (!request) {
    const error = new Error("Request context is required.");

    error.status = 500;

    throw error;
  }

  const hotelId = request?.user?.hotelId;

  if (!hotelId) {
    const error = new Error("No hotel is assigned to this account.");

    error.status = 400;

    throw error;
  }

  if (!isValidObjectId(hotelId)) {
    const error = new Error("Invalid active hotel.");

    error.status = 401;

    throw error;
  }

  return asObjectId(hotelId);
}

// --------------------------------------------------
// BILL STATUS
// --------------------------------------------------

const isVoidBill = (bill) => {
  const status = normalize(bill?.status);
  const paymentStatus = normalize(bill?.paymentStatus);

  return (
    status === "cancelled" ||
    status === "canceled" ||
    status === "void" ||
    status === "rejected" ||
    paymentStatus === "cancelled" ||
    paymentStatus === "canceled" ||
    paymentStatus === "void" ||
    paymentStatus === "rejected"
  );
};

const billClass = (bill) => {
  const type = billTypeOf(bill);

  if (ROOM_BILL_TYPES.has(type)) {
    return "room";
  }

  if (OTHER_BILL_TYPES.has(type)) {
    return "other";
  }

  return "pos";
};

// --------------------------------------------------
// BOOKINGS
// --------------------------------------------------

const bookingStatusIncluded = (booking) => {
  const status = normalize(booking?.status);

  if (!status) {
    return true;
  }

  if (
    status === "cancelled" ||
    status === "canceled" ||
    status === "no-show" ||
    status === "no_show"
  ) {
    return false;
  }

  return VALID_REVENUE_BOOKING_STATUS.has(status) || status === "reserved";
};

const bookingRoomRevenue = (booking) => {
  const pricing = booking?.pricing || {};

  return n(
    pricing.taxableBase ??
      pricing.roomCharge ??
      booking?.totalAmountBeforeTax ??
      pricing.grandTotal ??
      booking?.totalAmount ??
      0,
  );
};

const bookingNights = (booking) => {
  const start = new Date(booking?.checkIn);
  const end = new Date(booking?.checkOut);

  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
    return 1;
  }

  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / DAY_MS));
};

const bookingDailyRows = (booking, start, end) => {
  const checkIn = new Date(booking?.checkIn);
  const checkOut = new Date(booking?.checkOut);

  if (
    !Number.isFinite(checkIn.getTime()) ||
    !Number.isFinite(checkOut.getTime())
  ) {
    return [];
  }

  const nights = bookingNights(booking);

  const totalRevenue = bookingRoomRevenue(booking);

  const perNight = nights > 0 ? totalRevenue / nights : totalRevenue;

  const firstTime = Math.max(checkIn.getTime(), start.getTime());

  const lastTime = Math.min(checkOut.getTime(), end.getTime());

  if (firstTime >= lastTime) {
    return [];
  }

  const first = new Date(firstTime);
  const last = new Date(lastTime);

  first.setUTCHours(0, 0, 0, 0);
  last.setUTCHours(0, 0, 0, 0);

  const rows = [];

  for (let t = first.getTime(); t < last.getTime(); t += DAY_MS) {
    rows.push({
      _id: new Date(t),
      amount: perNight,
      guestId: booking?.guestId || null,
      roomId: booking?.roomId || null,
      roomType: booking?.roomTypeCode || booking?.roomType || "Other",
      purpose: booking?.purpose || "Other",
      nights: 1,
    });
  }

  return rows;
};

// --------------------------------------------------
// DAY MAP
// --------------------------------------------------

const makeDayMap = (start, end) => {
  const map = new Map();

  for (let t = start.getTime(); t < end.getTime(); t += DAY_MS) {
    const date = new Date(t);

    map.set(dayKey(date), {
      _id: date,
      amount: 0,
      count: 0,
    });
  }

  return map;
};

const addToDayMap = (map, date, amount = 0, count = 0) => {
  const key = dayKey(date);

  const row = map.get(key);

  if (!row) {
    return;
  }

  row.amount += n(amount);
  row.count += n(count);
};

// --------------------------------------------------
// CORE COLLECTIONS
// --------------------------------------------------

async function loadCoreCollections(db, hid, start, end) {
  const [bookings, bills, payments, rooms, roomtypes, fooditems] =
    await Promise.all([
      db
        .collection("bookings")
        .find({
          hotelId: hid,
        })
        .toArray(),

      db
        .collection("bills")
        .find({
          hotelId: hid,
          createdAt: {
            $gte: start,
            $lt: end,
          },
        })
        .toArray(),

      db
        .collection("payments")
        .find({
          hotelId: hid,
          createdAt: {
            $gte: start,
            $lt: end,
          },
        })
        .toArray(),

      db
        .collection("rooms")
        .find({
          hotelId: hid,
        })
        .project({
          _id: 1,
          type: 1,
          roomCode: 1,
          roomNumber: 1,
        })
        .toArray(),

      db
        .collection("roomtypes")
        .find({
          hotelId: hid,
        })
        .project({
          roomCode: 1,
          name: 1,
        })
        .toArray(),

      db
        .collection("fooditems")
        .find({
          hotelId: hid,
        })
        .project({
          _id: 1,
          name: 1,
          category: 1,
          price: 1,
          isAvailable: 1,
          availability: 1,
        })
        .toArray(),
    ]);

  const roomMap = new Map(rooms.map((room) => [String(room._id), room]));

  const roomTypeMap = new Map(
    roomtypes.map((roomtype) => [
      String(roomtype.roomCode || roomtype.code || roomtype._id),
      roomtype.name || roomtype.roomCode || "Other",
    ]),
  );

  const foodMap = new Map(fooditems.map((food) => [String(food._id), food]));

  return {
    bookings,
    bills,
    payments,
    rooms,
    roomtypes,
    fooditems,
    roomMap,
    roomTypeMap,
    foodMap,
  };
}

// --------------------------------------------------
// PMS DAILY
// --------------------------------------------------

async function pmsDaily({ hid, windows, db, core = null }) {
  const bookingDocs =
    core?.bookings ||
    (await db
      .collection("bookings")
      .find({
        hotelId: hid,
      })
      .toArray());

  const currentMap = makeDayMap(windows.selectedStart, windows.end);

  const previousMap = makeDayMap(windows.previousStart, windows.selectedStart);

  let pmsRevenueTotal = 0;
  let previousPmsTotal = 0;

  const currentBookingRows = [];

  for (const booking of bookingDocs) {
    if (!bookingStatusIncluded(booking)) {
      continue;
    }

    const currentRows = bookingDailyRows(
      booking,
      windows.selectedStart,
      windows.end,
    );

    const previousRows = bookingDailyRows(
      booking,
      windows.previousStart,
      windows.selectedStart,
    );

    for (const row of currentRows) {
      addToDayMap(currentMap, row._id, row.amount, 0);

      pmsRevenueTotal += row.amount;

      currentBookingRows.push({
        booking,
        ...row,
      });
    }

    for (const row of previousRows) {
      addToDayMap(previousMap, row._id, row.amount, 0);

      previousPmsTotal += row.amount;
    }
  }

  return {
    pmsDailyRows: [...currentMap.values()].map((row) => ({
      _id: row._id,
      amount: row.amount,
    })),

    otherDailyRows: [...currentMap.values()].map((row) => ({
      _id: row._id,
      amount: 0,
    })),

    previousPmsTotal: previousPmsTotal || null,

    previousOtherTotal: null,

    pmsRevenueTotal,

    currentBookingRows,
  };
}

// --------------------------------------------------
// POS BILL PROCESSING
// --------------------------------------------------

function processPosBills(bills, foodMap, start, end) {
  const currentMap = makeDayMap(start, end);

  const otherMap = makeDayMap(start, end);

  const categoryMap = new Map();
  const outletMap = new Map();
  const itemMap = new Map();

  let posTotal = 0;
  let otherTotal = 0;
  let posCount = 0;

  const billRows = [];

  for (const bill of bills) {
    if (isVoidBill(bill)) {
      continue;
    }

    const amount = n(bill?.totalAmount);

    if (!amount) {
      continue;
    }

    const createdAt = bill?.createdAt ? new Date(bill.createdAt) : null;

    if (!createdAt || Number.isNaN(createdAt.getTime())) {
      continue;
    }

    const cls = billClass(bill);

    billRows.push(bill);

    if (cls === "pos") {
      posTotal += amount;
      posCount += 1;

      addToDayMap(currentMap, createdAt, amount, 1);
    }

    if (cls === "other") {
      otherTotal += amount;

      addToDayMap(otherMap, createdAt, amount, 1);
    }

    let outlet = "Main Restaurant";

    if (bill.roomId || billTypeOf(bill) === "room-charge") {
      outlet = "Room Service";
    } else if (billTypeOf(bill) === "takeaway") {
      outlet = "Takeaway";
    }

    if (cls === "pos") {
      outletMap.set(outlet, (outletMap.get(outlet) || 0) + amount);
    }

    const items = Array.isArray(bill.items) ? bill.items : [];

    for (const item of items) {
      const food = item.foodItemId
        ? foodMap.get(String(item.foodItemId))
        : null;

      const category = item.category || food?.category || "Others";

      const name = item.name || food?.name || "Unknown Item";

      const quantity = n(item.quantity) || 1;

      const unitPrice = n(item.price ?? food?.price);

      const itemRevenue = unitPrice * quantity;

      if (cls === "pos") {
        const categoryRow = categoryMap.get(category) || {
          quantity: 0,
          revenue: 0,
        };

        categoryRow.quantity += quantity;
        categoryRow.revenue += itemRevenue;

        categoryMap.set(category, categoryRow);

        const itemRow = itemMap.get(name) || {
          quantity: 0,
          revenue: 0,
          category,
        };

        itemRow.quantity += quantity;
        itemRow.revenue += itemRevenue;

        itemMap.set(name, itemRow);
      }
    }
  }

  return {
    currentMap,
    otherMap,

    posTotal,
    otherTotal,
    posCount,

    categoryRows: [...categoryMap.entries()]
      .map(([name, value]) => ({
        _id: name,
        ...value,
      }))
      .sort((a, b) => b.revenue - a.revenue),

    outletRows: [...outletMap.entries()]
      .map(([name, revenue]) => ({
        _id: name,
        revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue),

    itemRows: [...itemMap.entries()]
      .map(([name, value]) => ({
        _id: name,
        ...value,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10),

    billRows,
  };
}

// --------------------------------------------------
// POS DAILY
// --------------------------------------------------

async function posDaily({ hid, windows, db, core = null }) {
  const bills =
    core?.bills ||
    (await db
      .collection("bills")
      .find({
        hotelId: hid,
        createdAt: {
          $gte: windows.selectedStart,
          $lt: windows.end,
        },
      })
      .toArray());

  const foodMap = core?.foodMap || new Map();

  const current = processPosBills(
    bills,
    foodMap,
    windows.selectedStart,
    windows.end,
  );

  const previousBills = await db
    .collection("bills")
    .find({
      hotelId: hid,
      createdAt: {
        $gte: windows.previousStart,
        $lt: windows.selectedStart,
      },
    })
    .toArray();

  const previous = processPosBills(
    previousBills,
    foodMap,
    windows.previousStart,
    windows.selectedStart,
  );

  return {
    posDailyRows: [...current.currentMap.values()].map((row) => ({
      _id: row._id,
      amount: row.amount,
    })),

    otherDailyRows: [...current.otherMap.values()].map((row) => ({
      _id: row._id,
      amount: row.amount,
    })),

    previousPosTotal: previous.posTotal || null,

    previousOtherTotal: previous.otherTotal || null,

    posTxnCount: current.posCount,

    previousPosTxnCount: previous.posCount || null,

    current,
    previous,
  };
}

// --------------------------------------------------
// 1. TOTAL REVENUE
// --------------------------------------------------

async function loadTotalRevenue({ hid, windows, db }) {
  const core = await loadCoreCollections(
    db,
    hid,
    windows.selectedStart,
    windows.end,
  );

  const [pms, pos] = await Promise.all([
    pmsDaily({
      hid,
      windows,
      db,
      core,
    }),

    posDaily({
      hid,
      windows,
      db,
      core,
    }),
  ]);

  const paymentRows = (core.payments || [])
    .filter((payment) => normalize(payment.status) === "success")
    .reduce((map, payment) => {
      const method = payment.method || "Other";

      const row = map.get(method) || {
        _id: method,
        amount: 0,
      };

      row.amount += n(payment.amount);

      map.set(method, row);

      return map;
    }, new Map());

  const topRoomTypes = new Map();

  for (const row of pms.currentBookingRows) {
    const code = row.roomType || row.booking?.roomTypeCode || "Other";

    const name = core.roomTypeMap.get(String(code)) || code;

    const current = topRoomTypes.get(name) || {
      _id: name,
      nights: 0,
      revenue: 0,
    };

    current.nights += 1;
    current.revenue += row.amount;

    topRoomTypes.set(name, current);
  }

  return {
    ...pms,
    ...pos,

    pmsTxnCount: new Set(
      pms.currentBookingRows.map((row) => String(row.booking._id)),
    ).size,

    previousTxnCount: null,

    paymentRowsPms: [],

    paymentRowsPos: [...paymentRows.values()],

    outletRowsPos: pos.current.outletRows,

    topCategories: pos.current.categoryRows.slice(0, 5),

    topRoomTypes: [...topRoomTypes.values()].sort(
      (a, b) => b.revenue - a.revenue,
    ),

    pmsRevenueTotal: pms.pmsRevenueTotal,
  };
}

// --------------------------------------------------
// 2. PMS + POS REVENUE
// --------------------------------------------------

async function loadPmsPosRevenue({ hid, windows, db }) {
  const core = await loadCoreCollections(
    db,
    hid,
    windows.selectedStart,
    windows.end,
  );

  const [pms, pos] = await Promise.all([
    pmsDaily({
      hid,
      windows,
      db,
      core,
    }),

    posDaily({
      hid,
      windows,
      db,
      core,
    }),
  ]);

  const weekdayRowsPms = [];
  const weekdayRowsPos = [];

  const pmsByDow = new Map();
  const posByDow = new Map();

  for (const row of pms.currentBookingRows) {
    const dow = new Date(row._id).getUTCDay();

    pmsByDow.set(dow, (pmsByDow.get(dow) || 0) + row.amount);
  }

  for (const row of pos.posDailyRows) {
    const dow = new Date(row._id).getUTCDay();

    posByDow.set(dow, (posByDow.get(dow) || 0) + n(row.amount));
  }

  for (let i = 0; i < 7; i += 1) {
    weekdayRowsPms.push({
      _id: i,
      amount: pmsByDow.get(i) || 0,
    });

    weekdayRowsPos.push({
      _id: i,
      amount: posByDow.get(i) || 0,
    });
  }

  let inHouseAmount = 0;
  let walkInAmount = 0;

  for (const bill of pos.current.billRows) {
    const amount = n(bill.totalAmount);

    if (bill.roomId || billTypeOf(bill) === "room-charge") {
      inHouseAmount += amount;
    } else {
      walkInAmount += amount;
    }
  }

  const posTotal = pos.posDailyRows.reduce(
    (sum, row) => sum + n(row.amount),
    0,
  );

  const othersAmount = Math.max(0, posTotal - inHouseAmount - walkInAmount);

  return {
    ...pms,
    ...pos,

    weekdayRowsPms,
    weekdayRowsPos,

    guestTypeRows: [
      {
        name: "In-house Guests",
        value: inHouseAmount,
      },
      {
        name: "Walk-in Customers",
        value: walkInAmount,
      },
      {
        name: "Event/Banquet",
        value: 0,
      },
      {
        name: "Day Visitors",
        value: 0,
      },
      {
        name: "Others",
        value: othersAmount,
      },
    ],
  };
}

// --------------------------------------------------
// 3. PROPERTY PROFITABILITY
// --------------------------------------------------

async function loadProfitability({ hid, windows, db }) {
  const core = await loadCoreCollections(
    db,
    hid,
    windows.selectedStart,
    windows.end,
  );

  const [pms, pos] = await Promise.all([
    pmsDaily({
      hid,
      windows,
      db,
      core,
    }),

    posDaily({
      hid,
      windows,
      db,
      core,
    }),
  ]);

  const costDocs = await db
    .collection("pos_daily_costs")
    .find({
      hotelId: hid,
      date: {
        $gte: windows.selectedStart,
        $lt: windows.end,
      },
    })
    .toArray();

  const previousCostDocs = await db
    .collection("pos_daily_costs")
    .find({
      hotelId: hid,
      date: {
        $gte: windows.previousStart,
        $lt: windows.selectedStart,
      },
    })
    .toArray();

  const overheadTotal = costDocs.reduce((sum, row) => sum + n(row.amount), 0);

  const previousOverhead = previousCostDocs.reduce(
    (sum, row) => sum + n(row.amount),
    0,
  );

  const posTotal = pos.posDailyRows.reduce(
    (sum, row) => sum + n(row.amount),
    0,
  );

  const roomRevenue = n(pms.pmsRevenueTotal);

  const posCogsTotal = pos.current.categoryRows.reduce(
    (sum, row) => sum + row.revenue * 0.4,
    0,
  );

  const topProfitableItems = pos.current.itemRows.map((row) => ({
    _id: row._id,
    revenue: row.revenue,
    cost: row.revenue * 0.4,
  }));

  const roomTypeMap = new Map();

  for (const row of pms.currentBookingRows) {
    const name =
      core.roomTypeMap.get(String(row.roomType)) || row.roomType || "Other";

    const current = roomTypeMap.get(name) || {
      _id: name,
      revenue: 0,
      nights: 0,
    };

    current.revenue += row.amount;
    current.nights += 1;

    roomTypeMap.set(name, current);
  }

  return {
    ...pms,
    ...pos,

    roomCostTotal: roomRevenue * 0.33,

    posCogsTotal,

    overheadTotal,

    previousTotals: {
      revenue: n(pms.previousPmsTotal) + n(pos.previousPosTotal),

      cost:
        n(pms.previousPmsTotal) * 0.33 +
        n(pos.previousPosTotal) * 0.4 +
        previousOverhead,
    },

    outletRowsPos: pos.current.outletRows,

    topProfitableItems,

    topProfitableRoomTypes: [...roomTypeMap.values()],

    posTotal,
  };
}

// --------------------------------------------------
// STAY INDEX
// --------------------------------------------------

async function buildStayIndex(db, hid) {
  const bookings = await db
    .collection("bookings")
    .find({
      hotelId: hid,
    })
    .toArray();

  return bookings.filter(bookingStatusIncluded).map((booking) => ({
    booking,
    guestId: booking.guestId || null,
    roomId: booking.roomId || null,
    checkIn: new Date(booking.checkIn),
    checkOut: new Date(booking.checkOut),
  }));
}

function bookingForRoomAt(stays, roomId, at) {
  if (!roomId) {
    return null;
  }

  const when = new Date(at).getTime();

  return (
    stays.find(
      (stay) =>
        String(stay.roomId) === String(roomId) &&
        stay.checkIn.getTime() <= when &&
        stay.checkOut.getTime() > when,
    ) || null
  );
}

// --------------------------------------------------
// 4. GUEST -> RESTAURANT CONVERSION
// --------------------------------------------------

async function loadConversion({ hid, windows, db }) {
  const stays = await buildStayIndex(db, hid);

  const bills = await db
    .collection("bills")
    .find({
      hotelId: hid,
      createdAt: {
        $gte: windows.previousStart,
        $lt: windows.end,
      },
    })
    .toArray();

  async function windowStats(start, end) {
    const dailyInHouse = new Map();

    const dailyDined = new Map();

    const allInHouse = new Set();

    const allDined = new Set();

    for (const stay of stays) {
      const rows = bookingDailyRows(stay.booking, start, end);

      for (const row of rows) {
        const key = dayKey(row._id);

        const set = dailyInHouse.get(key) || new Set();

        if (stay.guestId) {
          set.add(String(stay.guestId));

          allInHouse.add(String(stay.guestId));
        }

        dailyInHouse.set(key, set);
      }
    }

    for (const bill of bills) {
      if (isVoidBill(bill)) {
        continue;
      }

      const type = billTypeOf(bill);

      if (!["room-charge", "room_service", "room-service"].includes(type)) {
        continue;
      }

      const createdAt = new Date(bill.createdAt);

      if (createdAt < start || createdAt >= end) {
        continue;
      }

      const stay = bookingForRoomAt(stays, bill.roomId, createdAt);

      if (!stay?.guestId) {
        continue;
      }

      const key = dayKey(createdAt);

      const set = dailyDined.get(key) || new Set();

      set.add(String(stay.guestId));

      allDined.add(String(stay.guestId));

      dailyDined.set(key, set);
    }

    const dailyRows = [];

    for (let t = start.getTime(); t < end.getTime(); t += DAY_MS) {
      const key = dayKey(new Date(t));

      dailyRows.push({
        _id: new Date(t),
        inHouse: dailyInHouse.get(key)?.size || 0,
        dined: dailyDined.get(key)?.size || 0,
      });
    }

    return {
      dailyRows,
      totalInHouse: allInHouse.size,
      totalDined: allDined.size,
    };
  }

  const [current, previous] = await Promise.all([
    windowStats(windows.selectedStart, windows.end),

    windowStats(windows.previousStart, windows.selectedStart),
  ]);

  const currentPosBills = bills.filter((bill) => {
    if (isVoidBill(bill)) {
      return false;
    }

    const date = new Date(bill.createdAt);

    return (
      date >= windows.selectedStart &&
      date < windows.end &&
      ["room-charge", "room_service", "room-service"].includes(billTypeOf(bill))
    );
  });

  const diningRevenue = currentPosBills.reduce(
    (sum, bill) => sum + n(bill.totalAmount),
    0,
  );

  const repeatMap = new Map();

  for (const bill of currentPosBills) {
    const stay = bookingForRoomAt(stays, bill.roomId, bill.createdAt);

    if (!stay?.guestId) {
      continue;
    }

    const key = String(stay.guestId);

    repeatMap.set(key, (repeatMap.get(key) || 0) + 1);
  }

  const repeatDiners = [...repeatMap.values()].filter(
    (count) => count >= 2,
  ).length;

  const byPurposeMap = new Map();

  const byRoomMap = new Map();

  const outletMap = new Map();

  const itemMap = new Map();

  const dinedByGuest = new Set();

  for (const bill of currentPosBills) {
    const stay = bookingForRoomAt(stays, bill.roomId, bill.createdAt);

    if (stay?.guestId) {
      dinedByGuest.add(String(stay.guestId));
    }
  }

  for (const stay of stays) {
    const rows = bookingDailyRows(
      stay.booking,
      windows.selectedStart,
      windows.end,
    );

    if (!rows.length || !stay.guestId) {
      continue;
    }

    const guestId = String(stay.guestId);

    const purpose = stay.booking.purpose || "Other";

    const roomType =
      stay.booking.roomTypeCode || stay.booking.roomType || "Other";

    const purposeRow = byPurposeMap.get(purpose) || {
      purpose,
      inHouse: new Set(),
      dined: new Set(),
    };

    purposeRow.inHouse.add(guestId);

    if (dinedByGuest.has(guestId)) {
      purposeRow.dined.add(guestId);
    }

    byPurposeMap.set(purpose, purposeRow);

    const roomRow = byRoomMap.get(roomType) || {
      roomType,
      inHouse: new Set(),
      dined: new Set(),
    };

    roomRow.inHouse.add(guestId);

    if (dinedByGuest.has(guestId)) {
      roomRow.dined.add(guestId);
    }

    byRoomMap.set(roomType, roomRow);
  }

  for (const bill of currentPosBills) {
    const outlet = bill.roomId ? "Room Service" : "Restaurant";

    const row = outletMap.get(outlet) || {
      outlet,
      guests: new Set(),
      revenue: 0,
    };

    const stay = bookingForRoomAt(stays, bill.roomId, bill.createdAt);

    if (stay?.guestId) {
      row.guests.add(String(stay.guestId));
    }

    row.revenue += n(bill.totalAmount);

    outletMap.set(outlet, row);

    const items = Array.isArray(bill.items) ? bill.items : [];

    for (const item of items) {
      const itemName = item.name || "Unknown Item";

      const itemRow = itemMap.get(itemName) || {
        name: itemName,
        orders: 0,
        revenue: 0,
      };

      itemRow.orders += 1;

      itemRow.revenue += n(item.price) * (n(item.quantity) || 1);

      itemMap.set(itemName, itemRow);
    }
  }

  return {
    dailyRows: current.dailyRows,

    totalInHouse: current.totalInHouse,

    totalDined: current.totalDined,

    repeatDiners,

    previousInHouse: previous.totalInHouse,

    previousDined: previous.totalDined,

    diningRevenue,

    byPurpose: [...byPurposeMap.values()].map((row) => ({
      purpose: row.purpose,
      inHouse: row.inHouse.size,
      dined: row.dined.size,
    })),

    byRoomType: [...byRoomMap.values()].map((row) => ({
      roomType: row.roomType,
      inHouse: row.inHouse.size,
      dined: row.dined.size,

      revenue: currentPosBills.reduce((sum, bill) => {
        const stay = bookingForRoomAt(stays, bill.roomId, bill.createdAt);

        const type =
          stay?.booking?.roomTypeCode || stay?.booking?.roomType || "Other";

        return type === row.roomType ? sum + n(bill.totalAmount) : sum;
      }, 0),
    })),

    topOutlets: [...outletMap.values()].map((row) => ({
      outlet: row.outlet,
      dined: row.guests.size,
      revenue: row.revenue,
    })),

    topItems: [...itemMap.values()]
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5),
  };
}

// --------------------------------------------------
// 5. HOTEL GUEST SPENDING
// --------------------------------------------------

async function loadGuestSpending({ hid, windows, db }) {
  const stays = await buildStayIndex(db, hid);

  const guestDocs = await db
    .collection("guests")
    .find({
      hotelId: hid,
    })
    .project({
      _id: 1,
      name: 1,
    })
    .toArray();

  const guestNames = new Map(
    guestDocs.map((guest) => [String(guest._id), guest.name || "Guest"]),
  );

  const bills = await db
    .collection("bills")
    .find({
      hotelId: hid,
      createdAt: {
        $gte: windows.selectedStart,
        $lt: windows.end,
      },
    })
    .toArray();

  const reservations = [];

  for (const stay of stays) {
    const dayRows = bookingDailyRows(
      stay.booking,
      windows.selectedStart,
      windows.end,
    );

    if (!dayRows.length || !stay.guestId) {
      continue;
    }

    const selectedNights = dayRows.length;

    const fullNights = bookingNights(stay.booking);

    const fullRoomRevenue = bookingRoomRevenue(stay.booking);

    const roomSpend = fullNights
      ? (fullRoomRevenue / fullNights) * selectedNights
      : fullRoomRevenue;

    const linkedBills = bills.filter((bill) => {
      if (isVoidBill(bill)) {
        return false;
      }

      const type = billTypeOf(bill);

      if (
        !["room-charge", "room_service", "room-service"].includes(type) &&
        !bill.roomId
      ) {
        return false;
      }

      if (bill.roomId && String(bill.roomId) !== String(stay.roomId)) {
        return false;
      }

      const at = new Date(bill.createdAt).getTime();

      return at >= stay.checkIn.getTime() && at < stay.checkOut.getTime();
    });

    const posSpend = linkedBills.reduce(
      (sum, bill) => sum + n(bill.totalAmount),
      0,
    );

    const posItems = linkedBills.flatMap((bill) =>
      Array.isArray(bill.items) ? bill.items : [],
    );

    reservations.push({
      guestId: stay.guestId,

      roomType: stay.booking.roomTypeCode || stay.booking.roomType || "Other",

      purposeOfVisit: stay.booking.purpose || "Other",

      name:
        guestNames.get(String(stay.guestId)) ||
        linkedBills.find((bill) => bill.guestName)?.guestName ||
        "Guest",

      roomSpend,
      posSpend,
      posItems,

      checkInDate: new Date(stay.booking.checkIn),

      nights: selectedNights,
    });
  }

  const byDay = new Map();

  for (const row of reservations) {
    const key = dayKey(row.checkInDate);

    const day = byDay.get(key) || {
      _id: utcDay(key),
      count: 0,
      totalSpend: 0,
    };

    day.count += 1;

    day.totalSpend += row.roomSpend + row.posSpend;

    byDay.set(key, day);
  }

  const totalGuests = new Set(reservations.map((row) => String(row.guestId)))
    .size;

  const roomSpendTotal = reservations.reduce(
    (sum, row) => sum + row.roomSpend,
    0,
  );

  const posSpendTotal = reservations.reduce(
    (sum, row) => sum + row.posSpend,
    0,
  );

  const totalSpend = roomSpendTotal + posSpendTotal;

  const previousBookings = await db
    .collection("bookings")
    .find({
      hotelId: hid,
    })
    .toArray();

  let previousRoomRevenue = 0;

  const previousGuests = new Set();

  for (const booking of previousBookings) {
    if (!bookingStatusIncluded(booking)) {
      continue;
    }

    const rows = bookingDailyRows(
      booking,
      windows.previousStart,
      windows.selectedStart,
    );

    if (!rows.length) {
      continue;
    }

    previousRoomRevenue += rows.reduce((sum, row) => sum + row.amount, 0);

    if (booking.guestId) {
      previousGuests.add(String(booking.guestId));
    }
  }

  const previousGuestCount = previousGuests.size;

  const previousAvg = previousGuestCount
    ? previousRoomRevenue / previousGuestCount
    : null;

  const catMap = new Map([
    ["Restaurant (F&B)", 0],
    ["Bar & Beverages", 0],
    ["Room Service", 0],
    ["Spa & Wellness", 0],
    ["Activities & Tours", 0],
  ]);

  for (const row of reservations) {
    for (const item of row.posItems) {
      const category = normalize(item.category);

      const label =
        category === "beverages" ? "Bar & Beverages" : "Room Service";

      catMap.set(
        label,
        (catMap.get(label) || 0) + n(item.price) * (n(item.quantity) || 1),
      );
    }
  }

  const stayMap = new Map();
  const purposeMap = new Map();
  const roomMap = new Map();

  const stayBucket = (nights) =>
    nights <= 1
      ? "1 Night"
      : nights <= 3
        ? "2-3 Nights"
        : nights <= 7
          ? "4-7 Nights"
          : "7+ Nights";

  for (const row of reservations) {
    const stayKey = stayBucket(row.nights);

    const stayRow = stayMap.get(stayKey) || {
      name: stayKey,
      roomSpend: 0,
      posSpend: 0,
    };

    stayRow.roomSpend += row.roomSpend;

    stayRow.posSpend += row.posSpend;

    stayMap.set(stayKey, stayRow);

    const purposeKey = row.purposeOfVisit || "Other";

    const purposeRow = purposeMap.get(purposeKey) || {
      name: purposeKey,
      roomSpend: 0,
      posSpend: 0,
    };

    purposeRow.roomSpend += row.roomSpend;

    purposeRow.posSpend += row.posSpend;

    purposeMap.set(purposeKey, purposeRow);

    const roomKey = row.roomType || "Other";

    const roomRow = roomMap.get(roomKey) || {
      roomType: roomKey,
      guests: 0,
      posSpend: 0,
    };

    roomRow.guests += 1;

    roomRow.posSpend += row.posSpend;

    roomMap.set(roomKey, roomRow);
  }

  const topGuests = [...reservations]
    .sort((a, b) => b.roomSpend + b.posSpend - (a.roomSpend + a.posSpend))
    .slice(0, 5)
    .map((row) => ({
      name: row.name,
      roomSpend: row.roomSpend,
      posSpend: row.posSpend,
      nights: row.nights,
    }));

  return {
    dailyRows: [...byDay.values()],

    totalGuests,

    totalSpend,

    posSpendTotal,

    roomSpendTotal,

    previousAvg,

    categoryBreakdown: [...catMap.entries()].map(([name, value]) => ({
      name,
      value,
    })),

    byStayType: [...stayMap.values()],

    byGuestType: [...purposeMap.values()],

    topGuests,

    topRooms: [...roomMap.values()].sort((a, b) => b.posSpend - a.posSpend),
  };
}

// --------------------------------------------------
// 6. REVENUE FORECAST
// --------------------------------------------------

async function loadForecast({ hid, windows, db }) {
  const histFrom = new Date(windows.end.getTime() - 400 * DAY_MS);

  const bookings = await db
    .collection("bookings")
    .find({
      hotelId: hid,
    })
    .toArray();

  const bills = await db
    .collection("bills")
    .find({
      hotelId: hid,
      createdAt: {
        $gte: histFrom,
        $lt: windows.end,
      },
    })
    .toArray();

  const roomCount = await db.collection("rooms").countDocuments({
    hotelId: hid,
  });

  const pmsMap = makeDayMap(histFrom, windows.end);

  const posMap = makeDayMap(histFrom, windows.end);

  const occMap = new Map();

  for (const booking of bookings) {
    if (!bookingStatusIncluded(booking)) {
      continue;
    }

    const rows = bookingDailyRows(booking, histFrom, windows.end);

    for (const row of rows) {
      addToDayMap(pmsMap, row._id, row.amount, 0);

      const key = dayKey(row._id);

      const guestSet = occMap.get(key) || new Set();

      guestSet.add(
        `${String(booking.roomId || "no-room")}:${String(
          booking.guestId || booking._id,
        )}`,
      );

      occMap.set(key, guestSet);
    }
  }

  for (const bill of bills) {
    if (isVoidBill(bill) || billClass(bill) !== "pos") {
      continue;
    }

    const amount = n(bill.totalAmount);

    if (!amount) {
      continue;
    }

    addToDayMap(posMap, new Date(bill.createdAt), amount, 1);
  }

  const pmsHistory = [];
  const posHistory = [];
  const occupancyHistory = [];
  const coversHistory = [];

  for (let t = histFrom.getTime(); t < windows.end.getTime(); t += DAY_MS) {
    const date = new Date(t);

    const key = dayKey(date);

    const occupied = occMap.get(key)?.size || 0;

    pmsHistory.push(pmsMap.get(key)?.amount || 0);

    posHistory.push(posMap.get(key)?.amount || 0);

    coversHistory.push(posMap.get(key)?.count || 0);

    occupancyHistory.push(roomCount ? (occupied / roomCount) * 100 : 0);
  }

  return {
    pmsHistory,
    posHistory,
    occupancyHistory,
    coversHistory,
  };
}

// --------------------------------------------------
// 7. CUSTOMER LIFETIME VALUE
// --------------------------------------------------

async function loadClv({ hid, db }) {
  const bookings = await db
    .collection("bookings")
    .find({
      hotelId: hid,
    })
    .toArray();

  const bills = await db
    .collection("bills")
    .find({
      hotelId: hid,
    })
    .toArray();

  const guests = await db
    .collection("guests")
    .find({
      hotelId: hid,
    })
    .project({
      _id: 1,
      name: 1,
    })
    .toArray();

  const guestNames = new Map(
    guests.map((guest) => [String(guest._id), guest.name || "Guest"]),
  );

  const guestMap = new Map();

  for (const booking of bookings) {
    if (!bookingStatusIncluded(booking) || !booking.guestId) {
      continue;
    }

    const key = String(booking.guestId);

    const row = guestMap.get(key) || {
      name: guestNames.get(key) || "Guest",

      totalStays: 0,
      totalValue: 0,

      purpose: booking.purpose || "Other",
    };

    row.totalStays += 1;

    row.totalValue += bookingRoomRevenue(booking);

    guestMap.set(key, row);
  }

  const stays = bookings.filter(bookingStatusIncluded).map((booking) => ({
    booking,

    roomId: booking.roomId || null,

    guestId: booking.guestId || null,

    checkIn: new Date(booking.checkIn),

    checkOut: new Date(booking.checkOut),
  }));

  for (const bill of bills) {
    if (isVoidBill(bill) || !bill.roomId) {
      continue;
    }

    const type = billTypeOf(bill);

    if (!["room-charge", "room_service", "room-service"].includes(type)) {
      continue;
    }

    const stay = bookingForRoomAt(stays, bill.roomId, bill.createdAt);

    if (!stay?.guestId) {
      continue;
    }

    const row = guestMap.get(String(stay.guestId));

    if (row) {
      row.totalValue += n(bill.totalAmount);
    }
  }

  const monthlyRows = [];
  const now = new Date();

  for (let i = 11; i >= 0; i -= 1) {
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1),
    );

    const end = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 1),
    );

    const monthlyGuests = new Set();

    let revenue = 0;

    for (const booking of bookings) {
      if (!bookingStatusIncluded(booking)) {
        continue;
      }

      const rows = bookingDailyRows(booking, start, end);

      if (!rows.length) {
        continue;
      }

      revenue += rows.reduce((sum, row) => sum + row.amount, 0);

      if (booking.guestId) {
        monthlyGuests.add(String(booking.guestId));
      }
    }

    monthlyRows.push({
      label: start.toLocaleString("en", {
        month: "short",
        timeZone: TZ,
      }),

      avgClv: monthlyGuests.size ? Math.round(revenue / monthlyGuests.size) : 0,

      totalRevenue: revenue,
    });
  }

  return {
    guests: [...guestMap.values()],

    monthlyRows,
  };
}

// --------------------------------------------------
// 8. AI RECOMMENDATIONS
// --------------------------------------------------

async function loadRecommendations({ hid, windows, db }) {
  const conversion = await loadConversion({
    hid,
    windows,
    db,
  });

  const clv = await loadClv({
    hid,
    db,
  });

  const bookings = await db
    .collection("bookings")
    .find({
      hotelId: hid,
    })
    .toArray();

  const bills = await db
    .collection("bills")
    .find({
      hotelId: hid,
      createdAt: {
        $gte: windows.selectedStart,
        $lt: windows.end,
      },
    })
    .toArray();

  const currentOrders = bills.filter(
    (bill) => !isVoidBill(bill) && billClass(bill) === "pos",
  );

  const previousBills = await db
    .collection("bills")
    .find({
      hotelId: hid,
      createdAt: {
        $gte: windows.previousStart,
        $lt: windows.selectedStart,
      },
    })
    .toArray();

  const previousOrders = previousBills.filter(
    (bill) => !isVoidBill(bill) && billClass(bill) === "pos",
  );

  const inHouseGuestCount = conversion.totalInHouse;

  const diningGuestCount = conversion.totalDined;

  const diningRevenue = conversion.diningRevenue;

  const repeatGuests = clv.guests.filter((guest) => guest.totalStays >= 2);

  const oneTimeGuests = clv.guests.filter((guest) => guest.totalStays === 1);

  const avgRepeatGuestValue = repeatGuests.length
    ? repeatGuests.reduce((sum, guest) => sum + guest.totalValue, 0) /
      repeatGuests.length
    : 0;

  const avgOneTimeValue = oneTimeGuests.length
    ? oneTimeGuests.reduce((sum, guest) => sum + guest.totalValue, 0) /
      oneTimeGuests.length
    : 0;

  const currentWeekendBookings = bookings.filter((booking) => {
    if (!bookingStatusIncluded(booking)) {
      return false;
    }

    const start = new Date(booking.checkIn);

    return (
      start >= windows.selectedStart &&
      start < windows.end &&
      [0, 6].includes(start.getUTCDay())
    );
  });

  let weekendNights = 0;
  let weekdayNights = 0;

  let weekendRevenue = 0;
  let weekdayRevenue = 0;

  for (const booking of currentWeekendBookings) {
    const rows = bookingDailyRows(booking, windows.selectedStart, windows.end);

    for (const row of rows) {
      if ([0, 6].includes(row._id.getUTCDay())) {
        weekendNights += 1;
        weekendRevenue += row.amount;
      }
    }
  }

  for (const booking of bookings) {
    if (!bookingStatusIncluded(booking)) {
      continue;
    }

    const rows = bookingDailyRows(booking, windows.selectedStart, windows.end);

    for (const row of rows) {
      if (![0, 6].includes(row._id.getUTCDay())) {
        weekdayNights += 1;
        weekdayRevenue += row.amount;
      }
    }
  }

  const weekendAdr = weekendNights ? weekendRevenue / weekendNights : 0;

  const weekdayAdr = weekdayNights ? weekdayRevenue / weekdayNights : 0;

  const hourCounts = Array.from({ length: 24 }, () => 0);

  for (const bill of currentOrders) {
    const date = new Date(bill.createdAt);

    hourCounts[date.getHours()] += 1;
  }

  const lunch = hourCounts.slice(12, 15).reduce((sum, value) => sum + value, 0);

  const dinner = hourCounts
    .slice(18, 21)
    .reduce((sum, value) => sum + value, 0);

  const totalOrderCount = Math.max(currentOrders.length, 1);

  const otaBookings = bookings.filter((booking) => {
    const start = new Date(booking.checkIn);

    if (start < windows.selectedStart || start >= windows.end) {
      return false;
    }

    const source = normalize(booking.source || booking.channel);

    return ["booking.com", "agoda", "makemytrip"].includes(source);
  }).length;

  const totalBookings = Math.max(
    bookings.filter((booking) => {
      const start = new Date(booking.checkIn);

      return (
        start >= windows.selectedStart &&
        start < windows.end &&
        bookingStatusIncluded(booking)
      );
    }).length,
    1,
  );

  const signals = {
    conversionRate: inHouseGuestCount
      ? (diningGuestCount / inHouseGuestCount) * 100
      : 0,

    totalInHouseGuests: inHouseGuestCount,

    avgSpendPerDiningGuest: diningGuestCount
      ? diningRevenue / diningGuestCount
      : 0,

    weekendOccupancy: weekendNights
      ? Math.min(
          100,
          (weekendNights / Math.max(currentWeekendBookings.length, 1)) * 100,
        )
      : 0,

    weekendAdrPremiumPct: weekdayAdr
      ? ((weekendAdr - weekdayAdr) / weekdayAdr) * 100
      : 0,

    weekdayAdr,

    weekendRoomNights: weekendNights,

    eligibleForReturnCount: clv.guests.filter((guest) => guest.totalStays >= 1)
      .length,

    avgRepeatGuestValue,

    repeatGuestValueRatio: avgOneTimeValue
      ? avgRepeatGuestValue / avgOneTimeValue
      : 0,

    lunchOrderShare: lunch / totalOrderCount,

    dinnerOrderShare: dinner / totalOrderCount,

    avgOrderValue: currentOrders.length
      ? currentOrders.reduce((sum, bill) => sum + n(bill.totalAmount), 0) /
        currentOrders.length
      : 0,

    days: windows.days,

    otaBookingShare: (otaBookings / totalBookings) * 100,

    otaBookings,

    avgRoomRate: weekdayAdr || 0,

    ordersPerDay: currentOrders.length / Math.max(windows.days, 1),

    previousOrdersPerDay: previousOrders.length / Math.max(windows.days, 1),
  };

  const generated = generateRecommendations(signals);

  // ------------------------------------------------
  // Store recommendations directly in MongoDB.
  // No aggregation pipeline is used here.
  // ------------------------------------------------

  const recommendationCollection = db.collection("recommendations");

  for (const recommendation of generated) {
    await recommendationCollection.updateOne(
      {
        hotelId: hid,
        key: recommendation.key,
      },
      {
        $setOnInsert: {
          hotelId: hid,
          key: recommendation.key,
          status: "new",
        },

        $set: {
          title: recommendation.title,

          description: recommendation.description,

          category: recommendation.category,

          priority: recommendation.priority,

          effort: recommendation.effort,

          estMonthlyImpact: recommendation.estMonthlyImpact,

          updatedAt: new Date(),
        },
      },
      {
        upsert: true,
      },
    );
  }

  const generatedKeys = generated.map((recommendation) => recommendation.key);

  await recommendationCollection.deleteMany(
    generatedKeys.length
      ? {
          hotelId: hid,
          status: "new",
          key: {
            $nin: generatedKeys,
          },
        }
      : {
          hotelId: hid,
          status: "new",
        },
  );

  const recommendations = await recommendationCollection
    .find({
      hotelId: hid,
    })
    .sort({
      estMonthlyImpact: -1,
    })
    .toArray();

  return {
    recommendations: recommendations.map((recommendation) => ({
      ...recommendation,
      id: String(recommendation._id),
    })),

    guestExperienceScore: guestExperienceScore(signals),

    operationalEfficiency: operationalEfficiency(signals),
  };
}

// --------------------------------------------------
// PUBLIC BI ENTRY POINT
// --------------------------------------------------

export async function queryBiLiveData(id, range, request) {
  assertKnownBiDashboard(id);

  if (!process.env.MONGODB_URI) {
    const error = new Error("MONGODB_URI is not configured.");

    error.status = 503;

    throw error;
  }

  const hid = await getAuthorizedHotelId(request);

  const windows = computeWindows(range);

  const db = await getDb();

  const loaders = {
    "total-revenue": loadTotalRevenue,

    "pms-pos-revenue": loadPmsPosRevenue,

    profitability: loadProfitability,

    conversion: loadConversion,

    "guest-spending": loadGuestSpending,

    "revenue-forecast": loadForecast,

    clv: loadClv,

    recommendations: loadRecommendations,
  };

  const loader = loaders[id];

  if (!loader) {
    const error = new Error(`Unsupported BI dashboard: ${id}`);

    error.status = 404;

    throw error;
  }

  const raw = await loader({
    hid,
    windows,
    db,
  });

  return computeBiPayload(id, range, windows, raw, "live");
}

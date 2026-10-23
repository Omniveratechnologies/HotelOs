import mongoose from "mongoose";

import { assertKnownPosDashboard } from "#/modules/intelligence/lib/pos/intelligence-data.js";
import {
  computeWindows,
  computePosPayload,
} from "#/modules/intelligence/lib/pos/shape.js";

/* oxlint-disable unicorn/no-thenable */

const TZ = "Asia/Kolkata";

// -----------------------------------------------------------------------------
// MONGODB EXPRESSIONS
// -----------------------------------------------------------------------------

const dayTrunc = (field) => ({
  $dateTrunc: {
    date: field,
    unit: "day",
    timezone: TZ,
  },
});

const hourOf = (field) => ({
  $hour: {
    date: field,
    timezone: TZ,
  },
});

const weekdayOf = (field) => ({
  $mod: [
    {
      $add: [
        {
          $dayOfWeek: {
            date: field,
            timezone: TZ,
          },
        },
        5,
      ],
    },
    7,
  ],
});

// -----------------------------------------------------------------------------
// BILL FILTERS
// -----------------------------------------------------------------------------

const NOT_CANCELLED = {
  status: {
    $nin: ["cancelled", "CANCELLED", "rejected", "REJECTED"],
  },
};

const PAID_BILL = {
  $or: [
    {
      paymentStatus: {
        $in: ["paid", "PAID"],
      },
    },
    {
      status: {
        $in: ["paid", "PAID"],
      },
    },
  ],
};

// -----------------------------------------------------------------------------
// AUTHORIZATION
// -----------------------------------------------------------------------------

function getAuthorizedHotelId(request) {
  const hotelId = request?.user?.hotelId;

  if (!mongoose.isValidObjectId(hotelId)) {
    const error = new Error("No valid hotel is assigned to this account.");

    error.status = 400;
    throw error;
  }

  return new mongoose.Types.ObjectId(hotelId);
}

// -----------------------------------------------------------------------------
// DATABASE COLLECTIONS
// -----------------------------------------------------------------------------

async function collections() {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("Database connection is unavailable.");
  }

  return {
    Bill: db.collection("bills"),
    FoodItem: db.collection("fooditems"),
    Payment: db.collection("payments"),
    User: db.collection("users"),
  };
}

// -----------------------------------------------------------------------------
// ENTRY POINT
// -----------------------------------------------------------------------------

export async function queryPosLiveData(id, range, request) {
  assertKnownPosDashboard(id);

  if (!process.env.MONGODB_URI) {
    const error = new Error("MONGODB_URI is not configured.");

    error.status = 503;
    throw error;
  }

  const hid = await getAuthorizedHotelId(request);

  const windows = computeWindows(range);

  const c = await collections();

  const loaders = {
    sales: loadSales,
    products: loadProducts,
    customers: loadCustomers,
    orders: loadOrders,
    upselling: loadUpselling,
    staff: loadStaff,
  };

  const loader = loaders[id];

  if (!loader) {
    const error = new Error(`Unsupported POS dashboard "${id}".`);

    error.status = 404;
    throw error;
  }

  const raw = await loader({
    hid,
    windows,
    c,
  });

  return computePosPayload(id, range, windows, raw, "live");
}

// -----------------------------------------------------------------------------
// DATE WINDOWS
// -----------------------------------------------------------------------------

const currentMatch = (hid, windows) => ({
  hotelId: hid,

  createdAt: {
    $gte: windows.selectedStart,

    $lt: windows.end,
  },
});

const previousMatch = (hid, windows) => ({
  hotelId: hid,

  createdAt: {
    $gte: windows.previousStart,

    $lt: windows.selectedStart,
  },
});

// -----------------------------------------------------------------------------
// BILL TYPE NORMALIZATION
// -----------------------------------------------------------------------------

const billTypeExpression = {
  $let: {
    vars: {
      type: {
        $toLower: {
          $ifNull: ["$billType", ""],
        },
      },
    },

    in: {
      $switch: {
        branches: [
          {
            case: {
              $in: ["$$type", ["takeaway", "take-away"]],
            },

            then: "takeaway",
          },

          {
            case: {
              $in: [
                "$$type",
                ["room-charge", "room_charge", "room service", "room_service"],
              ],
            },

            then: "room_service",
          },

          {
            case: {
              $in: [
                "$$type",
                ["online", "online_delivery", "delivery", "online-delivery"],
              ],
            },

            then: "online_delivery",
          },

          {
            case: {
              $in: ["$$type", ["dine_in", "dine-in", "dine in", "restaurant"]],
            },

            then: "dine_in",
          },
        ],

        default: "dine_in",
      },
    },
  },
};

// -----------------------------------------------------------------------------
// OUTLET NORMALIZATION
// -----------------------------------------------------------------------------

const outletExpression = {
  $let: {
    vars: {
      type: {
        $toLower: {
          $ifNull: ["$billType", ""],
        },
      },
    },

    in: {
      $switch: {
        branches: [
          {
            case: {
              $in: [
                "$$type",
                ["room-charge", "room_charge", "room service", "room_service"],
              ],
            },

            then: "Room Service",
          },

          {
            case: {
              $in: ["$$type", ["takeaway", "take-away"]],
            },

            then: "Main Restaurant",
          },

          {
            case: {
              $in: [
                "$$type",
                ["online", "online_delivery", "delivery", "online-delivery"],
              ],
            },

            then: "Main Restaurant",
          },
        ],

        default: "Main Restaurant",
      },
    },
  },
};

// -----------------------------------------------------------------------------
// CUSTOMER IDENTITY
// -----------------------------------------------------------------------------

const customerKeyExpression = {
  $switch: {
    branches: [
      {
        case: {
          $ne: [
            {
              $ifNull: ["$guestPhone", ""],
            },
            "",
          ],
        },

        then: {
          $concat: ["phone:", "$guestPhone"],
        },
      },

      {
        case: {
          $ne: [
            {
              $ifNull: ["$guestName", ""],
            },
            "",
          ],
        },

        then: {
          $concat: ["name:", "$guestName"],
        },
      },

      {
        case: {
          $ne: [
            {
              $ifNull: ["$roomId", null],
            },
            null,
          ],
        },

        then: {
          $concat: [
            "room:",
            {
              $toString: "$roomId",
            },
          ],
        },
      },
    ],

    default: {
      $concat: [
        "bill:",
        {
          $toString: "$_id",
        },
      ],
    },
  },
};

// -----------------------------------------------------------------------------
// 1. SALES
// -----------------------------------------------------------------------------

async function loadSales({ hid, windows, c }) {
  const cur = {
    ...currentMatch(hid, windows),

    ...NOT_CANCELLED,
    ...PAID_BILL,
  };

  const prev = {
    ...previousMatch(hid, windows),

    ...NOT_CANCELLED,
    ...PAID_BILL,
  };

  const [
    dailyTypeRows,
    previousTotalRows,
    itemAgg,
    categoryRows,
    paymentRows,
    orderTypeRows,
    outletRows,
    outletPreviousRows,
    hourRows,
  ] = await Promise.all([
    c.Bill.aggregate([
      {
        $match: cur,
      },

      {
        $group: {
          _id: {
            day: dayTrunc("$createdAt"),

            orderType: billTypeExpression,
          },

          amount: {
            $sum: "$totalAmount",
          },
        },
      },

      {
        $sort: {
          "_id.day": 1,
        },
      },
    ]).toArray(),

    c.Bill.aggregate([
      {
        $match: prev,
      },

      {
        $group: {
          _id: null,

          amount: {
            $sum: "$totalAmount",
          },

          count: {
            $sum: 1,
          },
        },
      },
    ]).toArray(),

    c.Bill.aggregate([
      {
        $match: cur,
      },

      {
        $unwind: "$items",
      },

      {
        $group: {
          _id: null,

          total: {
            $sum: {
              $ifNull: ["$items.quantity", 0],
            },
          },
        },
      },
    ]).toArray(),

    // Category revenue
    c.Bill.aggregate([
      {
        $match: cur,
      },

      {
        $unwind: "$items",
      },

      {
        $lookup: {
          from: "fooditems",
          localField: "items.foodItemId",
          foreignField: "_id",
          as: "food",
        },
      },

      {
        $unwind: {
          path: "$food",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $group: {
          _id: {
            $ifNull: [
              "$food.category",
              {
                $ifNull: ["$items.category", "Others"],
              },
            ],
          },

          quantity: {
            $sum: {
              $ifNull: ["$items.quantity", 0],
            },
          },

          revenue: {
            $sum: {
              $multiply: [
                {
                  $ifNull: ["$items.price", 0],
                },

                {
                  $ifNull: ["$items.quantity", 0],
                },
              ],
            },
          },
        },
      },

      {
        $sort: {
          revenue: -1,
        },
      },
    ]).toArray(),

    loadPaymentRows({
      hid,
      windows,
      c,
      cur,
    }),

    c.Bill.aggregate([
      {
        $match: cur,
      },

      {
        $group: {
          _id: billTypeExpression,

          amount: {
            $sum: "$totalAmount",
          },

          count: {
            $sum: 1,
          },
        },
      },
    ]).toArray(),

    c.Bill.aggregate([
      {
        $match: cur,
      },

      {
        $group: {
          _id: outletExpression,

          revenue: {
            $sum: "$totalAmount",
          },

          orders: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          revenue: -1,
        },
      },
    ]).toArray(),

    c.Bill.aggregate([
      {
        $match: prev,
      },

      {
        $group: {
          _id: outletExpression,

          revenue: {
            $sum: "$totalAmount",
          },
        },
      },
    ]).toArray(),

    c.Bill.aggregate([
      {
        $match: cur,
      },

      {
        $group: {
          _id: hourOf("$createdAt"),

          count: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          _id: 1,
        },
      },
    ]).toArray(),
  ]);

  const [itemRows, prevItemAgg] = await Promise.all([
    c.Bill.aggregate([
      {
        $match: cur,
      },

      {
        $unwind: "$items",
      },

      {
        $group: {
          _id: {
            $ifNull: ["$items.name", "Unknown Item"],
          },

          quantity: {
            $sum: {
              $ifNull: ["$items.quantity", 0],
            },
          },

          revenue: {
            $sum: {
              $multiply: [
                {
                  $ifNull: ["$items.price", 0],
                },

                {
                  $ifNull: ["$items.quantity", 0],
                },
              ],
            },
          },
        },
      },

      {
        $sort: {
          revenue: -1,
        },
      },

      {
        $limit: 6,
      },
    ]).toArray(),

    c.Bill.aggregate([
      {
        $match: prev,
      },

      {
        $unwind: "$items",
      },

      {
        $group: {
          _id: null,

          total: {
            $sum: {
              $ifNull: ["$items.quantity", 0],
            },
          },
        },
      },
    ]).toArray(),
  ]);

  return {
    dailyTypeRows,

    previousTotal: previousTotalRows[0] || null,

    itemRows,

    itemsSoldTotal: itemAgg[0]?.total || 0,

    previousItemsSoldTotal: prevItemAgg[0]?.total ?? null,

    categoryRows,
    paymentRows,
    orderTypeRows,
    outletRows,
    outletPreviousRows,
    hourRows,
  };
}

// -----------------------------------------------------------------------------
// PAYMENT METHODS
// -----------------------------------------------------------------------------

async function loadPaymentRows({ hid, c, cur }) {
  const bills = await c.Bill.find(cur, {
    projection: {
      _id: 1,
      totalAmount: 1,
      paymentMethod: 1,
    },
  }).toArray();

  const billIds = bills.map((b) => b._id);

  if (!billIds.length) {
    return [];
  }

  const paymentRows = await c.Payment.aggregate([
    {
      $match: {
        hotelId: hid,

        billId: {
          $in: billIds,
        },

        status: {
          $in: ["success", "SUCCESS", "paid", "PAID"],
        },
      },
    },

    {
      $group: {
        _id: "$method",

        amount: {
          $sum: "$amount",
        },

        count: {
          $sum: 1,
        },
      },
    },

    {
      $sort: {
        amount: -1,
      },
    },
  ]).toArray();

  if (paymentRows.length) {
    return paymentRows;
  }

  return c.Bill.aggregate([
    {
      $match: cur,
    },

    {
      $group: {
        _id: {
          $ifNull: ["$paymentMethod", "Other"],
        },

        amount: {
          $sum: "$totalAmount",
        },

        count: {
          $sum: 1,
        },
      },
    },

    {
      $sort: {
        amount: -1,
      },
    },
  ]).toArray();
}

// -----------------------------------------------------------------------------
// 2. PRODUCTS
// -----------------------------------------------------------------------------

async function loadProducts({ hid, windows, c }) {
  const cur = {
    ...currentMatch(hid, windows),

    ...NOT_CANCELLED,
    ...PAID_BILL,
  };

  const prev = {
    ...previousMatch(hid, windows),

    ...NOT_CANCELLED,
    ...PAID_BILL,
  };

  const [
    totalProducts,
    dailyRows,
    allItemRows,
    categoryRows,
    hourWeekdayRows,
    itemAgg,
    prevItemAgg,
  ] = await Promise.all([
    c.FoodItem.countDocuments({
      hotelId: hid,

      isAvailable: {
        $ne: false,
      },
    }),

    c.Bill.aggregate([
      {
        $match: cur,
      },

      {
        $unwind: "$items",
      },

      {
        $group: {
          _id: dayTrunc("$createdAt"),

          quantity: {
            $sum: {
              $ifNull: ["$items.quantity", 0],
            },
          },

          revenue: {
            $sum: {
              $multiply: [
                {
                  $ifNull: ["$items.price", 0],
                },

                {
                  $ifNull: ["$items.quantity", 0],
                },
              ],
            },
          },
        },
      },

      {
        $sort: {
          _id: 1,
        },
      },
    ]).toArray(),

    c.Bill.aggregate([
      {
        $match: cur,
      },

      {
        $unwind: "$items",
      },

      {
        $group: {
          _id: {
            $ifNull: ["$items.name", "Unknown Item"],
          },

          category: {
            $first: {
              $ifNull: ["$items.category", "Others"],
            },
          },

          quantity: {
            $sum: {
              $ifNull: ["$items.quantity", 0],
            },
          },

          revenue: {
            $sum: {
              $multiply: [
                {
                  $ifNull: ["$items.price", 0],
                },

                {
                  $ifNull: ["$items.quantity", 0],
                },
              ],
            },
          },
        },
      },
    ]).toArray(),

    c.Bill.aggregate([
      {
        $match: cur,
      },

      {
        $unwind: "$items",
      },

      {
        $lookup: {
          from: "fooditems",
          localField: "items.foodItemId",
          foreignField: "_id",
          as: "food",
        },
      },

      {
        $unwind: {
          path: "$food",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $group: {
          _id: {
            $ifNull: [
              "$food.category",
              {
                $ifNull: ["$items.category", "Others"],
              },
            ],
          },

          quantity: {
            $sum: {
              $ifNull: ["$items.quantity", 0],
            },
          },

          revenue: {
            $sum: {
              $multiply: [
                {
                  $ifNull: ["$items.price", 0],
                },

                {
                  $ifNull: ["$items.quantity", 0],
                },
              ],
            },
          },
        },
      },

      {
        $sort: {
          revenue: -1,
        },
      },
    ]).toArray(),

    c.Bill.aggregate([
      {
        $match: cur,
      },

      {
        $unwind: "$items",
      },

      {
        $addFields: {
          hour: hourOf("$createdAt"),

          weekday: weekdayOf("$createdAt"),
        },
      },

      {
        $addFields: {
          block: {
            $switch: {
              branches: [
                {
                  case: {
                    $lt: ["$hour", 9],
                  },

                  then: "6AM–9AM",
                },

                {
                  case: {
                    $lt: ["$hour", 12],
                  },

                  then: "9AM–12PM",
                },

                {
                  case: {
                    $lt: ["$hour", 15],
                  },

                  then: "12PM–3PM",
                },

                {
                  case: {
                    $lt: ["$hour", 18],
                  },

                  then: "3PM–6PM",
                },

                {
                  case: {
                    $lt: ["$hour", 21],
                  },

                  then: "6PM–9PM",
                },
              ],

              default: "9PM–12AM",
            },
          },
        },
      },

      {
        $group: {
          _id: {
            block: "$block",
            weekday: "$weekday",
          },

          quantity: {
            $sum: {
              $ifNull: ["$items.quantity", 0],
            },
          },
        },
      },
    ]).toArray(),

    c.Bill.aggregate([
      {
        $match: cur,
      },

      {
        $unwind: "$items",
      },

      {
        $group: {
          _id: null,

          total: {
            $sum: {
              $ifNull: ["$items.quantity", 0],
            },
          },
        },
      },
    ]).toArray(),

    c.Bill.aggregate([
      {
        $match: prev,
      },

      {
        $unwind: "$items",
      },

      {
        $group: {
          _id: null,

          total: {
            $sum: {
              $ifNull: ["$items.quantity", 0],
            },
          },
        },
      },
    ]).toArray(),
  ]);

  return {
    totalProducts,

    dailyRows,

    itemsSoldTotal: itemAgg[0]?.total || 0,

    previousItemsSoldTotal: prevItemAgg[0]?.total ?? null,

    allItemRows,
    categoryRows,
    hourWeekdayRows,
  };
}

// -----------------------------------------------------------------------------
// 3. CUSTOMERS
// -----------------------------------------------------------------------------

async function loadCustomers({ hid, windows, c }) {
  const cur = {
    ...currentMatch(hid, windows),

    ...NOT_CANCELLED,
    ...PAID_BILL,
  };

  const prev = {
    ...previousMatch(hid, windows),

    ...NOT_CANCELLED,
    ...PAID_BILL,
  };

  const [
    currentCustomers,
    previousCustomers,
    spendAgg,
    dailyCustomerRows,
    orderTypeMix,
  ] = await Promise.all([
    c.Bill.aggregate([
      {
        $match: cur,
      },

      {
        $group: {
          _id: customerKeyExpression,
        },
      },
    ]).toArray(),

    c.Bill.aggregate([
      {
        $match: prev,
      },

      {
        $group: {
          _id: customerKeyExpression,
        },
      },
    ]).toArray(),

    c.Bill.aggregate([
      {
        $match: cur,
      },

      {
        $group: {
          _id: customerKeyExpression,

          spend: {
            $sum: "$totalAmount",
          },
        },
      },

      {
        $group: {
          _id: null,

          total: {
            $sum: "$spend",
          },
        },
      },
    ]).toArray(),

    c.Bill.aggregate([
      {
        $match: cur,
      },

      {
        $group: {
          _id: dayTrunc("$createdAt"),

          customers: {
            $addToSet: customerKeyExpression,
          },
        },
      },

      {
        $project: {
          _id: 1,

          customers: {
            $size: "$customers",
          },
        },
      },

      {
        $sort: {
          _id: 1,
        },
      },
    ]).toArray(),

    c.Bill.aggregate([
      {
        $match: cur,
      },

      {
        $group: {
          _id: billTypeExpression,

          customers: {
            $addToSet: customerKeyExpression,
          },
        },
      },

      {
        $project: {
          _id: 1,

          count: {
            $size: "$customers",
          },
        },
      },
    ]).toArray(),
  ]);

  const customerStats = await c.Bill.aggregate([
    {
      $match: {
        hotelId: hid,

        ...NOT_CANCELLED,
        ...PAID_BILL,
      },
    },

    {
      $group: {
        _id: customerKeyExpression,

        visits: {
          $sum: 1,
        },
      },
    },

    {
      $group: {
        _id: null,

        total: {
          $sum: 1,
        },

        returning: {
          $sum: {
            $cond: [
              {
                $gte: ["$visits", 2],
              },

              1,
              0,
            ],
          },
        },
      },
    },
  ]).toArray();

  const stats = customerStats[0] || {
    total: 0,
    returning: 0,
  };

  const topCustomers = await c.Bill.aggregate([
    {
      $match: cur,
    },

    {
      $group: {
        _id: customerKeyExpression,

        name: {
          $first: {
            $cond: [
              {
                $ne: [
                  {
                    $ifNull: ["$guestName", ""],
                  },

                  "",
                ],
              },

              "$guestName",

              "Guest",
            ],
          },
        },

        totalSpend: {
          $sum: "$totalAmount",
        },

        visits: {
          $sum: 1,
        },
      },
    },

    {
      $sort: {
        totalSpend: -1,
      },
    },

    {
      $limit: 5,
    },
  ]).toArray();

  return {
    totalCustomersCurrent: currentCustomers.length,

    newCustomers: Math.max(
      0,

      currentCustomers.length - stats.returning,
    ),

    returningCustomers: stats.returning,

    previousTotalCustomers: previousCustomers.length,

    spendTotal: spendAgg[0]?.total || 0,

    retentionRows: orderTypeMix,

    dailyNewReturning: dailyCustomerRows,

    topCustomers: topCustomers.map((r) => ({
      name: r.name || "Guest",

      visits: r.visits || 0,

      totalSpend: r.totalSpend || 0,
    })),

    segmentRows: [],

    visitFreqRows: [],

    acquisitionRows: [],

    cumulativeRows: dailyCustomerRows,
  };
}

// -----------------------------------------------------------------------------
// 4. ORDERS
// -----------------------------------------------------------------------------

async function loadOrders({ hid, windows, c }) {
  const cur = {
    ...currentMatch(hid, windows),

    ...NOT_CANCELLED,
  };

  const curSales = {
    ...cur,
    ...PAID_BILL,
  };

  const prev = {
    ...previousMatch(hid, windows),

    ...NOT_CANCELLED,
  };

  const [
    orderTypeRows,
    previousOrderTotal,
    statusRows,
    dailyTypeRows,
    dailyAovRows,
    topItems,
    hourRows,
    recentBills,
  ] = await Promise.all([
    c.Bill.aggregate([
      {
        $match: curSales,
      },

      {
        $group: {
          _id: billTypeExpression,

          amount: {
            $sum: "$totalAmount",
          },

          count: {
            $sum: 1,
          },
        },
      },
    ]).toArray(),

    c.Bill.aggregate([
      {
        $match: prev,
      },

      {
        $group: {
          _id: null,

          count: {
            $sum: 1,
          },
        },
      },
    ]).toArray(),

    c.Bill.aggregate([
      {
        $match: cur,
      },

      {
        $group: {
          _id: "$status",

          count: {
            $sum: 1,
          },
        },
      },
    ]).toArray(),

    c.Bill.aggregate([
      {
        $match: curSales,
      },

      {
        $group: {
          _id: {
            day: dayTrunc("$createdAt"),

            orderType: billTypeExpression,
          },

          count: {
            $sum: 1,
          },
        },
      },
    ]).toArray(),

    c.Bill.aggregate([
      {
        $match: curSales,
      },

      {
        $group: {
          _id: dayTrunc("$createdAt"),

          amount: {
            $sum: "$totalAmount",
          },

          count: {
            $sum: 1,
          },
        },
      },
    ]).toArray(),

    c.Bill.aggregate([
      {
        $match: curSales,
      },

      {
        $unwind: "$items",
      },

      {
        $group: {
          _id: {
            $ifNull: ["$items.name", "Unknown Item"],
          },

          orders: {
            $sum: 1,
          },

          quantity: {
            $sum: {
              $ifNull: ["$items.quantity", 0],
            },
          },

          revenue: {
            $sum: {
              $multiply: [
                {
                  $ifNull: ["$items.price", 0],
                },

                {
                  $ifNull: ["$items.quantity", 0],
                },
              ],
            },
          },
        },
      },

      {
        $sort: {
          orders: -1,
        },
      },

      {
        $limit: 5,
      },
    ]).toArray(),

    c.Bill.aggregate([
      {
        $match: curSales,
      },

      {
        $group: {
          _id: hourOf("$createdAt"),

          count: {
            $sum: 1,
          },
        },
      },
    ]).toArray(),

    c.Bill.find(
      {
        hotelId: hid,
      },
      {
        projection: {
          _id: 1,
          createdAt: 1,
          billType: 1,
          tableId: 1,
          roomId: 1,
          items: 1,
          totalAmount: 1,
          status: 1,
          paymentStatus: 1,
        },
      },
    )
      .sort({
        createdAt: -1,
      })
      .limit(10)
      .toArray(),
  ]);

  return {
    orderTypeRows,

    previousOrderTotal: previousOrderTotal[0] || null,

    avgOrderTime: 0,

    statusRows,
    dailyTypeRows,
    dailyAovRows,
    topItems,
    hourRows,

    recentOrders: recentBills.map((b) => ({
      id: String(b._id).slice(-6).toUpperCase(),

      time: b.createdAt,

      type: labelBillType(b.billType, b.roomId),

      source: b.roomId
        ? "Room Service"
        : b.tableId
          ? "Restaurant Table"
          : "Restaurant",

      items: Array.isArray(b.items) ? b.items.length : 0,

      amount: b.totalAmount || 0,

      status: b.status,
    })),
  };
}

function labelBillType(value, roomId) {
  const type = String(value || "").toLowerCase();

  if (
    roomId ||
    ["room-charge", "room_charge", "room service", "room_service"].includes(
      type,
    )
  ) {
    return "Room Service";
  }

  if (["takeaway", "take-away"].includes(type)) {
    return "Takeaway";
  }

  if (
    ["online", "online_delivery", "delivery", "online-delivery"].includes(type)
  ) {
    return "Online";
  }

  return "Dine-in";
}

// -----------------------------------------------------------------------------
// 5. UPSELLING
// -----------------------------------------------------------------------------

async function loadUpselling({ hid, windows, c }) {
  const cur = {
    ...currentMatch(hid, windows),

    ...NOT_CANCELLED,
    ...PAID_BILL,
  };

  const prev = {
    ...previousMatch(hid, windows),

    ...NOT_CANCELLED,
    ...PAID_BILL,
  };

  const [
    totalAgg,
    upsellDailyRows,
    upsellOrderIds,
    prevUpsellAgg,
    channelRows,
    topUpsoldItems,
    hourRows,
    staffAgg,
    staffTotalAgg,
  ] = await Promise.all([
    c.Bill.aggregate([
      {
        $match: cur,
      },

      {
        $group: {
          _id: null,

          totalSales: {
            $sum: "$totalAmount",
          },

          totalOrders: {
            $sum: 1,
          },
        },
      },
    ]).toArray(),

    c.Bill.aggregate([
      {
        $match: cur,
      },

      {
        $unwind: "$items",
      },

      {
        $match: {
          "items.isUpsell": true,
        },
      },

      {
        $group: {
          _id: dayTrunc("$createdAt"),

          revenue: {
            $sum: {
              $multiply: [
                {
                  $ifNull: ["$items.price", 0],
                },

                {
                  $ifNull: ["$items.quantity", 0],
                },
              ],
            },
          },

          orders: {
            $addToSet: "$_id",
          },
        },
      },

      {
        $project: {
          revenue: 1,

          orders: {
            $size: "$orders",
          },
        },
      },
    ]).toArray(),

    c.Bill.distinct("_id", {
      ...cur,

      items: {
        $elemMatch: {
          isUpsell: true,
        },
      },
    }),

    c.Bill.aggregate([
      {
        $match: prev,
      },

      {
        $unwind: "$items",
      },

      {
        $match: {
          "items.isUpsell": true,
        },
      },

      {
        $group: {
          _id: null,

          revenue: {
            $sum: {
              $multiply: [
                {
                  $ifNull: ["$items.price", 0],
                },

                {
                  $ifNull: ["$items.quantity", 0],
                },
              ],
            },
          },
        },
      },
    ]).toArray(),

    c.Bill.aggregate([
      {
        $match: cur,
      },

      {
        $match: {
          items: {
            $elemMatch: {
              isUpsell: true,
            },
          },
        },
      },

      {
        $group: {
          _id: billTypeExpression,

          count: {
            $sum: 1,
          },
        },
      },
    ]).toArray(),

    c.Bill.aggregate([
      {
        $match: cur,
      },

      {
        $unwind: "$items",
      },

      {
        $match: {
          "items.isUpsell": true,
        },
      },

      {
        $group: {
          _id: {
            $ifNull: ["$items.name", "Unknown Item"],
          },

          count: {
            $sum: 1,
          },

          revenue: {
            $sum: {
              $multiply: [
                {
                  $ifNull: ["$items.price", 0],
                },

                {
                  $ifNull: ["$items.quantity", 0],
                },
              ],
            },
          },
        },
      },

      {
        $sort: {
          revenue: -1,
        },
      },

      {
        $limit: 5,
      },
    ]).toArray(),

    c.Bill.aggregate([
      {
        $match: cur,
      },

      {
        $unwind: "$items",
      },

      {
        $match: {
          "items.isUpsell": true,
        },
      },

      {
        $group: {
          _id: hourOf("$createdAt"),

          count: {
            $sum: 1,
          },
        },
      },
    ]).toArray(),

    // IMPORTANT:
    // Every MongoDB aggregation pipeline stage below has exactly ONE
    // top-level field.
    c.Bill.aggregate([
      {
        $match: {
          ...cur,

          // Only bills with an actual cashier/staff reference.
          $expr: {
            $ne: [
              {
                $ifNull: ["$cashierId", null],
              },

              null,
            ],
          },
        },
      },

      {
        $group: {
          _id: "$cashierId",

          totalOrders: {
            $sum: 1,
          },

          upsellOrders: {
            $sum: {
              $cond: [
                {
                  $anyElementTrue: {
                    $map: {
                      input: {
                        $ifNull: ["$items", []],
                      },

                      as: "item",

                      in: {
                        $eq: ["$$item.isUpsell", true],
                      },
                    },
                  },
                },

                1,
                0,
              ],
            },
          },

          revenue: {
            $sum: "$totalAmount",
          },
        },
      },

      {
        $sort: {
          upsellOrders: -1,
        },
      },

      {
        $limit: 5,
      },
    ]).toArray(),

    c.Bill.aggregate([
      {
        $match: cur,
      },

      {
        $group: {
          _id: null,

          amount: {
            $sum: "$totalAmount",
          },

          count: {
            $sum: 1,
          },
        },
      },
    ]).toArray(),
  ]);

  const staffIds = staffAgg.map((r) => r._id);

  const staffDocs = staffIds.length
    ? await c.User.find(
        {
          _id: {
            $in: staffIds,
          },
        },

        {
          projection: {
            name: 1,
            username: 1,
          },
        },
      ).toArray()
    : [];

  const staffName = (id) => {
    const staff = staffDocs.find((s) => String(s._id) === String(id));

    return staff?.name || staff?.username || "Staff";
  };

  const multiItemBills = await c.Bill.find(
    {
      ...cur,

      $expr: {
        $gte: [
          {
            $size: {
              $ifNull: ["$items", []],
            },
          },

          2,
        ],
      },
    },

    {
      projection: {
        items: 1,
        totalAmount: 1,
      },
    },
  )
    .limit(4000)
    .toArray();

  const pairMap = new Map();

  for (const bill of multiItemBills) {
    const names = [
      ...new Set((bill.items || []).map((item) => item?.name).filter(Boolean)),
    ].sort();

    for (let i = 0; i < names.length; i += 1) {
      for (let j = i + 1; j < names.length; j += 1) {
        const key = `${names[i]}|||${names[j]}`;

        const current = pairMap.get(key) || {
          a: names[i],
          b: names[j],
          orders: 0,
          revenue: 0,
        };

        current.orders += 1;

        current.revenue += bill.totalAmount || 0;

        pairMap.set(key, current);
      }
    }
  }

  const comboRows = [...pairMap.values()]
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5);

  return {
    totalSales: totalAgg[0]?.totalSales || 0,

    totalOrders: totalAgg[0]?.totalOrders || 0,

    upsellOrders: upsellOrderIds.length,

    upsellRevenue: upsellDailyRows.reduce(
      (sum, row) => sum + (row.revenue || 0),
      0,
    ),

    previousUpsellRevenue: prevUpsellAgg[0]?.revenue ?? null,

    dailyUpsellRows: upsellDailyRows,

    channelRows,
    topUpsoldItems,
    comboRows,
    hourRows,

    avgOrderValueWithUpsell: staffTotalAgg[0]?.count
      ? staffTotalAgg[0].amount / staffTotalAgg[0].count
      : 0,

    staffRows: staffAgg.map((r) => ({
      name: staffName(r._id),

      upsellOrders: r.upsellOrders,

      totalOrders: r.totalOrders,

      revenue: r.revenue,
    })),
  };
}

// -----------------------------------------------------------------------------
// 6. STAFF
// -----------------------------------------------------------------------------

async function loadStaff({ hid, windows, c }) {
  const cur = {
    ...currentMatch(hid, windows),

    ...NOT_CANCELLED,
    ...PAID_BILL,

    cashierId: {
      $ne: null,
    },
  };

  const [salesAgg, contributionAgg, ratingAgg] = await Promise.all([
    c.Bill.aggregate([
      {
        $match: cur,
      },

      {
        $group: {
          _id: "$cashierId",

          sales: {
            $sum: "$totalAmount",
          },

          orders: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          sales: -1,
        },
      },
    ]).toArray(),

    c.Bill.aggregate([
      {
        $match: cur,
      },

      {
        $group: {
          _id: "$cashierId",

          count: {
            $sum: 1,
          },
        },
      },
    ]).toArray(),

    // No trustworthy rating field exists in the current bills collection.
    [],
  ]);

  const staffIds = salesAgg.map((r) => r._id);

  const staffDocs = staffIds.length
    ? await c.User.find(
        {
          _id: {
            $in: staffIds,
          },
        },

        {
          projection: {
            name: 1,
            username: 1,
            role: 1,
          },
        },
      ).toArray()
    : [];

  const findStaff = (id) => staffDocs.find((s) => String(s._id) === String(id));

  const nameOf = (id) => {
    const staff = findStaff(id);

    return staff?.name || staff?.username || "Staff";
  };

  const roleOf = (id) => findStaff(id)?.role || "Staff";

  const top5 = salesAgg.slice(0, 5).map((r) => nameOf(r._id));

  const roleAgg = new Map();

  for (const row of salesAgg) {
    const role = roleOf(row._id);

    roleAgg.set(role, (roleAgg.get(role) || 0) + row.sales);
  }

  const dailyTop5Rows = await c.Bill.aggregate([
    {
      $match: {
        ...cur,

        cashierId: {
          $in: salesAgg.slice(0, 5).map((r) => r._id),
        },
      },
    },

    {
      $group: {
        _id: {
          day: dayTrunc("$createdAt"),

          staffId: "$cashierId",
        },

        amount: {
          $sum: "$totalAmount",
        },
      },
    },
  ]).toArray();

  const dailyTop5Named = dailyTop5Rows.map((r) => ({
    _id: {
      day: r._id.day,

      name: nameOf(r._id.staffId),
    },

    amount: r.amount,
  }));

  return {
    totalStaff: staffIds.length,

    totalStaffSales: salesAgg.reduce((sum, r) => sum + r.sales, 0),

    totalOrdersHandled: salesAgg.reduce((sum, r) => sum + r.orders, 0),

    avgServiceTime: 0,

    avgRating: ratingAgg.length ? ratingAgg[0]?.avg || 0 : 0,

    dailyTop5Rows: dailyTop5Named,

    top5Names: top5,

    contributionRows: contributionAgg.map((r) => ({
      name: nameOf(r._id),

      count: r.count,
    })),

    tableRows: salesAgg.slice(0, 8).map((r) => ({
      name: nameOf(r._id),

      role: roleOf(r._id),

      orders: r.orders,

      sales: r.sales,

      avgPrep: 0,

      avgDelivery: 0,

      rating: 0,
    })),

    ratingRows: [],

    attendanceRows: [],

    roleRows: [...roleAgg.entries()].map(([name, sales]) => ({
      _id: name,
      sales,
    })),
  };
}

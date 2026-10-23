import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import mongoose from "mongoose";
import Booking from "#/modules/bookings/models/Booking.js";
import Bill from "#/modules/billing/models/Bill.js";
import Order from "#/modules/orders/models/Order.js";
import Payment from "#/modules/billing/models/Payment.js";
import Hotel from "#/modules/hotels/models/Hotel.js";
import Room from "#/modules/rooms/models/Room.js";
import ServiceRequest from "#/modules/service-requests/models/ServiceRequest.js";
import logger from "#/utils/logger.js";
import { getReportData } from "./report.controller.js";

const originalMethods = new Map();

const queryResult = (value) => {
  const result = Promise.resolve(value);
  result.select = () => result;
  result.sort = () => result;
  result.populate = () => result;
  result.lean = () => result;
  return result;
};

const modelMethods = [
  [Room, ["aggregate", "countDocuments", "find"]],
  [Booking, ["aggregate", "countDocuments", "find"]],
  [Bill, ["aggregate", "find"]],
  [Order, ["find"]],
  [Payment, ["aggregate"]],
  [ServiceRequest, ["aggregate"]],
  [Hotel, ["findById"]],
  [logger, ["error"]],
];

beforeEach(() => {
  originalMethods.clear();

  for (const [model, methods] of modelMethods) {
    for (const method of methods) {
      originalMethods.set(`${model.modelName || "logger"}.${method}`, {
        model,
        method,
        implementation: model[method],
      });
    }
  }

  Room.aggregate = async () => [];
  Room.countDocuments = async () => 0;
  Room.find = () => queryResult([]);
  Booking.aggregate = async () => [];
  Booking.countDocuments = async () => 0;
  Booking.find = () => queryResult([]);
  Bill.aggregate = async () => [];
  Bill.find = () => queryResult([]);
  Order.find = () => queryResult([]);
  Payment.aggregate = async () => [];
  ServiceRequest.aggregate = async () => [];
  Hotel.findById = () => queryResult({ name: "Test Hotel" });
  logger.error = () => {};
});

afterEach(() => {
  for (const { model, method, implementation } of originalMethods.values()) {
    model[method] = implementation;
  }
});

const invokeReport = async (
  query = {},
  hotelId = new mongoose.Types.ObjectId(),
) => {
  const response = {};
  const res = {
    status(status) {
      response.status = status;
      return this;
    },
    json(body) {
      response.body = body;
      return this;
    },
  };

  await getReportData({ user: { hotelId }, query }, res);
  return response;
};

test("validates report period and custom date inputs", async () => {
  assert.equal((await invokeReport({ period: "year" })).status, 400);

  assert.equal(
    (
      await invokeReport({
        period: "custom",
        startDate: "2026-02-30",
        endDate: "2026-03-01",
      })
    ).status,
    400,
  );

  assert.equal(
    (
      await invokeReport({
        period: "custom",
        startDate: "2026-03-01",
        endDate: "2026-02-28",
      })
    ).status,
    400,
  );

  assert.equal(
    (
      await invokeReport({
        period: "custom",
        startDate: ["2026-02-01"],
        endDate: "2026-02-28",
      })
    ).status,
    400,
  );

  assert.equal(
    (
      await invokeReport({
        period: "custom",
        startDate: "2026-02-01",
      })
    ).status,
    400,
  );
});

test("uses UTC half-open bounds and reports inclusive custom end dates", async () => {
  const hotelId = new mongoose.Types.ObjectId();
  let billFilter;
  let paymentPipeline;

  Bill.find = (filter) => {
    billFilter = filter;
    return queryResult([]);
  };

  Payment.aggregate = async (pipeline) => {
    paymentPipeline = pipeline;
    return [];
  };

  const response = await invokeReport(
    {
      period: "custom",
      startDate: "2026-01-31",
      endDate: "2026-02-01",
    },
    hotelId,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.data.period, {
    start: "2026-01-31",
    end: "2026-02-01",
  });
  assert.equal(
    billFilter.createdAt.$gte.toISOString(),
    "2026-01-31T00:00:00.000Z",
  );
  assert.equal(
    billFilter.createdAt.$lt.toISOString(),
    "2026-02-02T00:00:00.000Z",
  );
  assert.equal(
    paymentPipeline[0].$match.businessDate.$lt.toISOString(),
    "2026-02-02T00:00:00.000Z",
  );
  assert.equal(billFilter.hotelId, hotelId);
  assert.equal(paymentPipeline[0].$match.hotelId, hotelId);
});

test("defaults to the current UTC calendar day", async () => {
  const today = new Date();
  const expectedDate = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  )
    .toISOString()
    .slice(0, 10);

  const response = await invokeReport();

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.data.period, {
    start: expectedDate,
    end: expectedDate,
  });
});

test("arrival and departure counts match their guest lists and preserve booking channel", async () => {
  const hotelId = new mongoose.Types.ObjectId();
  const inHouse = [{ guestId: { name: "In House" } }];
  const arrivals = [
    { guestId: { name: "First Arrival" } },
    { guestId: { name: "Second Arrival" } },
  ];
  const departures = [{ guestId: { name: "Departing Guest" } }];

  Booking.aggregate = async (pipeline) =>
    pipeline[1]?.$group?._id === "$source" ? [{ _id: "OTA", count: 1 }] : [];

  Booking.find = (filter) => {
    if (filter.status === "checked-in" && filter.checkOut) {
      return queryResult(departures);
    }

    if (filter.status === "checked-in") return queryResult(inHouse);

    if (filter.status?.$in?.includes("confirmed")) {
      return queryResult(arrivals);
    }

    if (filter.createdAt) {
      return queryResult([
        {
          _id: new mongoose.Types.ObjectId(),
          guestId: { name: "Recent Guest" },
          roomId: null,
          source: "OTA",
          channel: "BOOKING_COM",
        },
      ]);
    }

    return queryResult([]);
  };

  const response = await invokeReport(
    {
      period: "custom",
      startDate: "2026-01-31",
      endDate: "2026-02-01",
    },
    hotelId,
  );

  const { bookings } = response.body.data;

  assert.equal(bookings.checkedIn, bookings.checkedInGuests.length);
  assert.equal(bookings.arrivals, bookings.arrivalGuests.length);
  assert.equal(bookings.arrivalsToday, bookings.arrivals);
  assert.equal(bookings.departures, bookings.departureGuests.length);
  assert.equal(bookings.departuresToday, bookings.departures);
  assert.deepEqual(bookings.arrivalGuests, [
    { name: "First Arrival" },
    { name: "Second Arrival" },
  ]);
  assert.equal(bookings.recentBookings[0].channel, "BOOKING_COM");
  assert.deepEqual(bookings.bookingSources, [{ source: "OTA", count: 1 }]);
});

test("counts distinct in-hotel rooms and reports eligible billed versus collected revenue", async () => {
  const hotelId = new mongoose.Types.ObjectId();
  const roomId = new mongoose.Types.ObjectId();
  const foreignRoomId = new mongoose.Types.ObjectId();

  const deliveredOrderIds = [
    new mongoose.Types.ObjectId(),
    new mongoose.Types.ObjectId(),
  ];

  const pendingOrderId = new mongoose.Types.ObjectId();
  const cancelledOrderId = new mongoose.Types.ObjectId();
  const rejectedOrderId = new mongoose.Types.ObjectId();
  const failedOrderId = new mongoose.Types.ObjectId();
  const missingOrderId = new mongoose.Types.ObjectId();

  const roomBillId = new mongoose.Types.ObjectId();
  const deliveredFoodBillId = new mongoose.Types.ObjectId();
  const pendingFoodBillId = new mongoose.Types.ObjectId();
  const cancelledFoodBillId = new mongoose.Types.ObjectId();
  const rejectedFoodBillId = new mongoose.Types.ObjectId();
  const failedFoodBillId = new mongoose.Types.ObjectId();
  const missingOrderBillId = new mongoose.Types.ObjectId();

  const overlappingBookings = [
    {
      roomId,
      checkIn: new Date("2026-01-31T16:00:00Z"),
      checkOut: new Date("2026-02-02T10:00:00Z"),
    },
    {
      roomId,
      checkIn: new Date("2026-01-31T16:00:00Z"),
      checkOut: new Date("2026-02-02T10:00:00Z"),
    },
    {
      roomId: foreignRoomId,
      checkIn: new Date("2026-01-31T16:00:00Z"),
      checkOut: new Date("2026-02-02T10:00:00Z"),
    },
    {
      checkIn: new Date("2026-01-31T00:00:00Z"),
      checkOut: new Date("2026-02-01T00:00:00Z"),
    },
  ];

  let billFilter;
  let orderFilter;
  const roomFilters = [];
  const foodBillAggregationMatches = [];
  let billAggregationCount = 0;

  Room.countDocuments = async () => 1;

  Room.find = (filter) => {
    roomFilters.push(filter);
    return queryResult([{ _id: roomId, type: "Deluxe" }]);
  };

  Booking.find = (filter) => {
    if (
      filter.status?.$in?.includes("checked-out") &&
      filter.checkIn &&
      filter.checkOut
    ) {
      return queryResult(overlappingBookings);
    }

    return queryResult([]);
  };

  Bill.find = (filter) => {
    billFilter = filter;

    return queryResult([
      {
        _id: roomBillId,
        billType: "room-charge",
        roomId,
        linkedOrderIds: [],
        totalAmount: 200,
      },
      {
        _id: deliveredFoodBillId,
        billType: "dine-in",
        linkedOrderIds: deliveredOrderIds,
        totalAmount: 120,
      },
      {
        _id: pendingFoodBillId,
        billType: "takeaway",
        linkedOrderIds: [pendingOrderId],
        totalAmount: 50,
      },
      {
        _id: cancelledFoodBillId,
        billType: "delivery",
        linkedOrderIds: [cancelledOrderId],
        totalAmount: 500,
      },
      {
        _id: rejectedFoodBillId,
        billType: "delivery",
        linkedOrderIds: [rejectedOrderId],
        totalAmount: 500,
      },
      {
        _id: failedFoodBillId,
        billType: "delivery",
        linkedOrderIds: [failedOrderId],
        totalAmount: 500,
      },
      {
        _id: missingOrderBillId,
        billType: "delivery",
        linkedOrderIds: [missingOrderId],
        totalAmount: 500,
      },
    ]);
  };

  Order.find = (filter) => {
    orderFilter = filter;

    return queryResult([
      ...deliveredOrderIds.map((_id) => ({
        _id,
        status: "DELIVERED",
        paymentStatus: "PAID",
      })),
      {
        _id: pendingOrderId,
        status: "NEW",
        paymentStatus: "PENDING",
      },
      {
        _id: cancelledOrderId,
        status: "CANCELLED",
        paymentStatus: "PENDING",
      },
      {
        _id: rejectedOrderId,
        status: "REJECTED",
        paymentStatus: "PENDING",
      },
      {
        _id: failedOrderId,
        status: "NEW",
        paymentStatus: "FAILED",
      },
    ]);
  };

  Bill.aggregate = async (pipeline) => {
    billAggregationCount += 1;

    if (billAggregationCount === 1) {
      foodBillAggregationMatches.push(pipeline[0].$match);

      return [
        {
          _id: "2026-01-31",
          revenue: 170,
          orders: [deliveredOrderIds, [pendingOrderId]],
        },
      ];
    }

    if (billAggregationCount === 2) {
      return [{ _id: "2026-01-31", revenue: 200, rooms: [roomId] }];
    }

    foodBillAggregationMatches.push(pipeline[0].$match);

    return [{ _id: "Soup", quantity: 2, revenue: 100 }];
  };

  Payment.aggregate = async () => [{ total: 50 }];

  const response = await invokeReport(
    {
      period: "custom",
      startDate: "2026-01-31",
      endDate: "2026-02-01",
    },
    hotelId,
  );

  const { data } = response.body;

  assert.equal(response.status, 200);
  assert.deepEqual(billFilter.status.$in, ["saved", "paid"]);

  assert.equal(orderFilter.hotelId, hotelId);
  assert.deepEqual(
    new Set(orderFilter._id.$in.map((id) => id.toString())),
    new Set(
      [
        ...deliveredOrderIds,
        pendingOrderId,
        cancelledOrderId,
        rejectedOrderId,
        failedOrderId,
        missingOrderId,
      ].map((id) => id.toString()),
    ),
  );

  const eligibleBillIds = new Set(
    [deliveredFoodBillId, pendingFoodBillId].map((id) => id.toString()),
  );

  assert.equal(foodBillAggregationMatches.length, 2);

  for (const match of foodBillAggregationMatches) {
    assert.deepEqual(
      new Set(match._id.$in.map((id) => id.toString())),
      eligibleBillIds,
    );
  }

  assert.equal(data.revenue.roomRevenue, 200);
  assert.equal(data.revenue.foodRevenue, 170);
  assert.equal(data.revenue.totalRevenue, 370);
  assert.equal(data.revenue.collectedRevenue, 50);
  assert.equal(data.revenue.foodOrderCount, 3);
  assert.equal(data.revenue.avgOrderValue, 57);
  assert.equal(data.revenue.dailyFoodRevenue[0].revenue, 170);
  assert.equal(data.revenue.dailyFoodRevenue[0].orders, 3);
  assert.strictEqual(data.revenue.dailyRevenue, data.revenue.dailyFoodRevenue);
  assert.equal(data.revenue.avgDailyRate, 100);
  assert.equal(data.revenue.revPAR, 100);

  assert.deepEqual(
    data.occupancyTrend.map(({ date, occupied, total }) => ({
      date,
      occupied,
      total,
    })),
    [
      { date: "2026-01-31", occupied: 1, total: 1 },
      { date: "2026-02-01", occupied: 1, total: 1 },
    ],
  );

  assert.ok(roomFilters.every((filter) => filter.hotelId === hotelId));
});

test("returns unavailable completion timing when the schema has no completion timestamp", async () => {
  const response = await invokeReport();

  assert.equal(response.status, 200);
  assert.equal(
    response.body.data.serviceRequests.avgCompletionTimeMinutes,
    null,
  );
  assert.equal(response.body.data.serviceRequests.avgResponseTimeMinutes, null);
});

test("returns zero-safe revenue and occupancy metrics for an empty hotel", async () => {
  const response = await invokeReport();
  const { revenue, occupancyTrend } = response.body.data;

  assert.equal(response.status, 200);
  assert.equal(revenue.roomRevenue, 0);
  assert.equal(revenue.foodRevenue, 0);
  assert.equal(revenue.totalRevenue, 0);
  assert.equal(revenue.avgDailyRate, 0);
  assert.equal(revenue.revPAR, 0);
  assert.equal(occupancyTrend[0].occupied, 0);
  assert.equal(occupancyTrend[0].total, 0);
  assert.equal(occupancyTrend[0].occupancyRate, 0);
});

test("rejects missing hotel identity and returns safe database errors", async () => {
  assert.equal((await invokeReport({}, null)).status, 400);

  Hotel.findById = () => {
    throw new Error("database connection details");
  };

  const response = await invokeReport();

  assert.equal(response.status, 500);
  assert.equal(response.body.message, "Failed to fetch report data");
  assert.equal(
    JSON.stringify(response.body).includes("database connection"),
    false,
  );
});

import assert from "node:assert/strict";
import crypto from "node:crypto";
import { describe, it, beforeEach } from "node:test";
import mongoose from "mongoose";
import Session from "./models/Session.js";
import KioskHandoff from "./models/KioskHandoff.js";
import Hotel from "#/modules/hotels/models/Hotel.js";
import Table from "#/modules/tables/models/Table.js";
import Room from "#/modules/rooms/models/Room.js";
import Booking from "#/modules/bookings/models/Booking.js";
import KioskDevice from "#/modules/kiosks/models/KioskDevice.js";
import Order from "#/modules/orders/models/Order.js";
import {
  createQrGuestSession,
  exchangeKioskHandoff,
  getKioskRoomStatus,
} from "./controllers/session.controller.js";
import { resetTable } from "#/modules/tables/controllers/table.controller.js";
import { createKioskHandoffCode } from "#/modules/kiosks/controllers/kioskDevice.controller.js";
import { authenticateSession } from "#/shared/middleware/sessionAuth.middleware.js";
import {
  createTableOrder,
  markPaymentFailed,
  getSessionOrders,
} from "#/modules/orders/controllers/order.controller.js";

// Helper mock response object
function createMockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    cookies: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    setHeader(key, val) {
      this.headers[key] = val;
      return this;
    },
    cookie(name, val, opts) {
      this.cookies[name] = { val, opts };
      return this;
    },
    clearCookie(name) {
      delete this.cookies[name];
      return this;
    },
  };
  return res;
}

describe("HotelOS Session Authentication & Security", () => {
  const fakeHotelId = new mongoose.Types.ObjectId();
  const fakeTableId = new mongoose.Types.ObjectId();
  const fakeKioskId = new mongoose.Types.ObjectId();

  const hotelCoords = { latitude: 28.6139, longitude: 77.209 }; // New Delhi
  const nearbyCoords = { latitude: 28.614, longitude: 77.2091 }; // ~15m away
  const distantCoords = { latitude: 28.62, longitude: 77.22 }; // ~1.2 km away

  let mockHotel;
  let mockTable;
  let mockKiosk;

  beforeEach(() => {
    mockHotel = {
      _id: fakeHotelId,
      name: "Grand Hotel",
      status: "ACTIVE",
      coordinates: hotelCoords,
      locationSettings: {
        tableRadiusMeters: 50,
        hotelRadiusMeters: 100,
        maxAccuracyMeters: 50,
        isLocationVerificationRequired: true,
      },
    };

    mockTable = {
      _id: fakeTableId,
      hotelId: fakeHotelId,
      tableNumber: "T-10",
      status: "AVAILABLE",
      isOrderingEnabled: true,
      sessionGeneration: 1,
      coordinates: null,
    };

    mockKiosk = {
      _id: fakeKioskId,
      hotelId: fakeHotelId,
      deviceId: "KIOSK-DEV-001",
      name: "Lobby Tablet",
      status: "ONLINE",
      isActive: true,
      isPaired: true,
      targetDashboard: "DIGITAL_MENU",
    };

    // Stubs for models
    Hotel.findById = async (id) =>
      id?.toString() === fakeHotelId.toString() ? mockHotel : null;

    Table.findOne = async (query) => {
      if (
        query._id?.toString() === fakeTableId.toString() &&
        query.hotelId?.toString() === fakeHotelId.toString()
      ) {
        return mockTable;
      }
      return null;
    };

    Table.findById = async (id) =>
      id?.toString() === fakeTableId.toString() ? mockTable : null;

    KioskDevice.findById = async (id) =>
      id?.toString() === fakeKioskId.toString() ? mockKiosk : null;

    Room.findById = undefined;
    Booking.findOne = undefined;
  });

  describe("QR Guest Session Creation", () => {
    it("successfully establishes a session when within permitted radius and accuracy", async () => {
      let createdSessionDoc = null;
      Session.create = async (doc) => {
        createdSessionDoc = { ...doc, _id: new mongoose.Types.ObjectId() };
        return createdSessionDoc;
      };

      const req = {
        body: {
          hotelId: fakeHotelId.toString(),
          tableId: fakeTableId.toString(),
          latitude: nearbyCoords.latitude,
          longitude: nearbyCoords.longitude,
          accuracy: 15,
        },
      };
      const res = createMockResponse();

      await createQrGuestSession(req, res);

      assert.equal(res.statusCode, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.sessionType, "QR_GUEST");
      assert.ok(res.body.data.token, "Opaque session token must be returned");
      assert.ok(createdSessionDoc, "Session must be stored in database");
      assert.equal(createdSessionDoc.tableSessionGeneration, 1);

      // Verify token in DB is a hash, not raw token
      const expectedHash = crypto
        .createHash("sha256")
        .update(res.body.data.token)
        .digest("hex");
      assert.equal(createdSessionDoc.tokenHash, expectedHash);

      // Verify 8-hour expiry
      const diffHours =
        (new Date(res.body.data.expiresAt).getTime() - Date.now()) /
        (1000 * 60 * 60);
      assert.ok(
        diffHours > 7.9 && diffHours <= 8.01,
        "Expiry must be set to 8 hours",
      );
    });

    it("rejects session creation when client is outside permitted radius", async () => {
      const req = {
        body: {
          hotelId: fakeHotelId.toString(),
          tableId: fakeTableId.toString(),
          latitude: distantCoords.latitude,
          longitude: distantCoords.longitude,
          accuracy: 20,
        },
      };
      const res = createMockResponse();

      await createQrGuestSession(req, res);

      assert.equal(res.statusCode, 403);
      assert.equal(res.body.code, "LOCATION_OUTSIDE_RADIUS");
      assert.match(res.body.message, /outside the permitted dining radius/);
    });

    it("rejects session creation when reported GPS accuracy exceeds threshold", async () => {
      const req = {
        body: {
          hotelId: fakeHotelId.toString(),
          tableId: fakeTableId.toString(),
          latitude: nearbyCoords.latitude,
          longitude: nearbyCoords.longitude,
          accuracy: 85, // max is 50m
        },
      };
      const res = createMockResponse();

      await createQrGuestSession(req, res);

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.code, "LOCATION_INACCURATE");
    });

    it("rejects session creation when coordinates are missing", async () => {
      const req = {
        body: {
          hotelId: fakeHotelId.toString(),
          tableId: fakeTableId.toString(),
        },
      };
      const res = createMockResponse();

      await createQrGuestSession(req, res);

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.code, "LOCATION_REQUIRED");
    });
  });

  describe("Table Reset & Generation Invalidation", () => {
    it("atomically increments sessionGeneration and invalidates active sessions on reset", async () => {
      let revokedCount = 0;
      Session.updateMany = async (filter, update) => {
        if (filter.status === "ACTIVE" && update.$set.status === "REVOKED") {
          revokedCount = 1;
        }
        return { modifiedCount: 1 };
      };

      Table.findOneAndUpdate = async (filter, update) => {
        mockTable.sessionGeneration += update.$inc.sessionGeneration;
        mockTable.status = update.$set.status;
        return mockTable;
      };

      const req = {
        params: { id: fakeTableId.toString() },
        user: { hotelId: fakeHotelId },
      };
      const res = createMockResponse();

      await resetTable(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(mockTable.sessionGeneration, 2);
      assert.equal(revokedCount, 1, "Active sessions must be revoked in DB");

      // Verify that middleware rejects older session generation
      const rawToken = "test_token_123";
      const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");
      const mockSession = {
        _id: new mongoose.Types.ObjectId(),
        tokenHash,
        type: "QR_GUEST",
        hotelId: fakeHotelId,
        tableId: fakeTableId,
        tableSessionGeneration: 1, // OLD generation
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + 3600000),
        save: async () => {},
      };

      Session.findOne = async () => mockSession;

      const mwReq = {
        headers: {
          "x-session-token": rawToken,
          "x-location-latitude": nearbyCoords.latitude,
          "x-location-longitude": nearbyCoords.longitude,
        },
      };
      const mwRes = createMockResponse();
      let nextCalled = false;

      const middleware = authenticateSession({ requireLocation: true });
      await middleware(mwReq, mwRes, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false, "Request must not proceed");
      assert.equal(mwRes.statusCode, 401);
      assert.equal(mwRes.body.code, "TABLE_SESSION_INVALIDATED");
      assert.equal(mockSession.status, "REVOKED");
    });
  });

  describe("Kiosk Handoff Code & Session Exchange", () => {
    it("generates single-use handoff code and exchanges it for a KIOSK session", async () => {
      let storedHandoff = null;
      KioskHandoff.create = async (doc) => {
        storedHandoff = { ...doc };
        return storedHandoff;
      };

      // 1. Native app requests handoff code
      const handoffReq = { kiosk: mockKiosk };
      const handoffRes = createMockResponse();
      await createKioskHandoffCode(handoffReq, handoffRes);

      assert.equal(handoffRes.statusCode, 200);
      const { handoffCode, expiresInSeconds } = handoffRes.body.data;
      assert.ok(handoffCode);
      assert.equal(expiresInSeconds, 60);

      // 2. Dashboard exchanges single-use code
      KioskHandoff.findOneAndUpdate = async (filter) => {
        const expectedHash = crypto
          .createHash("sha256")
          .update(handoffCode)
          .digest("hex");
        if (
          filter.codeHash === expectedHash &&
          filter.consumed === false &&
          !storedHandoff.consumed
        ) {
          storedHandoff.consumed = true;
          return storedHandoff;
        }
        return null;
      };

      Session.create = async (doc) => ({
        ...doc,
        _id: new mongoose.Types.ObjectId(),
      });

      const exchangeReq = { body: { handoffCode } };
      const exchangeRes = createMockResponse();
      await exchangeKioskHandoff(exchangeReq, exchangeRes);

      assert.equal(exchangeRes.statusCode, 200);
      assert.equal(exchangeRes.body.data.sessionType, "KIOSK");
      assert.equal(exchangeRes.body.data.deviceId, "KIOSK-DEV-001");

      // 3. Replay attack: reusing the same code must be rejected
      const replayReq = { body: { handoffCode } };
      const replayRes = createMockResponse();
      await exchangeKioskHandoff(replayReq, replayRes);

      assert.equal(replayRes.statusCode, 401);
      assert.equal(replayRes.body.code, "INVALID_OR_EXPIRED_HANDOFF_CODE");
    });

    it("allows Kiosk session to bypass location verification on protected requests", async () => {
      const rawToken = "kiosk_token_abc";
      const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");
      const mockSession = {
        _id: new mongoose.Types.ObjectId(),
        tokenHash,
        type: "KIOSK",
        hotelId: fakeHotelId,
        kioskId: fakeKioskId,
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + 3600000),
        save: async () => {},
      };

      Session.findOne = async () => mockSession;

      // Request WITHOUT any location headers
      const mwReq = {
        headers: {
          "x-session-token": rawToken,
        },
      };
      const mwRes = createMockResponse();
      let nextCalled = false;

      const middleware = authenticateSession({ requireLocation: true });
      await middleware(mwReq, mwRes, () => {
        nextCalled = true;
      });

      assert.equal(
        nextCalled,
        true,
        "Kiosk session must proceed without location",
      );
      assert.equal(mwReq.kiosk.deviceId, "KIOSK-DEV-001");
    });

    it("rejects kiosk session if device is disabled or unpaired", async () => {
      mockKiosk.status = "DISABLED";
      mockKiosk.isActive = false;

      const rawToken = "kiosk_token_abc";
      const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");
      const mockSession = {
        _id: new mongoose.Types.ObjectId(),
        tokenHash,
        type: "KIOSK",
        hotelId: fakeHotelId,
        kioskId: fakeKioskId,
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + 3600000),
        save: async () => {},
      };

      Session.findOne = async () => mockSession;

      const mwReq = { headers: { "x-session-token": rawToken } };
      const mwRes = createMockResponse();
      let nextCalled = false;

      const middleware = authenticateSession({ requireLocation: true });
      await middleware(mwReq, mwRes, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false);
      assert.equal(mwRes.statusCode, 401);
      assert.equal(mwRes.body.code, "KIOSK_UNAUTHORIZED");
      assert.equal(mockSession.status, "REVOKED");
    });

    it("handles GUEST_DASHBOARD kiosk handoff with vacant room (standby mode)", async () => {
      const guestKioskId = new mongoose.Types.ObjectId();
      const guestRoomId = new mongoose.Types.ObjectId();
      const guestKiosk = {
        _id: guestKioskId,
        deviceId: "ROOM-101-KIOSK",
        name: "Room 101 Tablet",
        hotelId: fakeHotelId,
        targetDashboard: "GUEST_DASHBOARD",
        roomId: guestRoomId,
        isActive: true,
        isPaired: true,
        status: "ONLINE",
      };

      KioskDevice.findById = async () => guestKiosk;
      Room.findById = () => ({
        select: () => ({
          _id: guestRoomId,
          roomNumber: "101",
          type: "Deluxe Suite",
        }),
      });
      Booking.findOne = () => ({
        sort: () => ({
          populate: async () => null, // No active checked-in booking
        }),
      });
      Hotel.findById = () => ({
        select: () => ({ name: "The Grand Hotel" }),
      });

      const rawCode = "handoff_code_vacant_123";
      KioskHandoff.findOneAndUpdate = async () => ({
        codeHash: crypto.createHash("sha256").update(rawCode).digest("hex"),
        kioskId: guestKioskId,
        hotelId: fakeHotelId,
        targetDashboard: "GUEST_DASHBOARD",
        roomId: guestRoomId,
        consumed: false,
      });

      Session.create = async (doc) => ({
        ...doc,
        _id: new mongoose.Types.ObjectId(),
      });

      const req = { body: { handoffCode: rawCode } };
      const res = createMockResponse();

      await exchangeKioskHandoff(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.data.activeStay, false);
      assert.equal(res.body.data.guestToken, null);
      assert.ok(
        res.body.data.standbyToken,
        "Standby token must be generated for vacant room tablet",
      );
      assert.equal(res.body.data.roomNumber, "101");
      assert.equal(res.body.data.hotelName, "The Grand Hotel");
    });

    it("handles GUEST_DASHBOARD kiosk handoff with checked-in guest (auto-login)", async () => {
      const guestKioskId = new mongoose.Types.ObjectId();
      const guestRoomId = new mongoose.Types.ObjectId();
      const guestUserId = new mongoose.Types.ObjectId();
      const guestKiosk = {
        _id: guestKioskId,
        deviceId: "ROOM-101-KIOSK",
        name: "Room 101 Tablet",
        hotelId: fakeHotelId,
        targetDashboard: "GUEST_DASHBOARD",
        roomId: guestRoomId,
        isActive: true,
        isPaired: true,
        status: "ONLINE",
      };

      KioskDevice.findById = async () => guestKiosk;
      Room.findById = () => ({
        select: () => ({
          _id: guestRoomId,
          roomNumber: "101",
          type: "Deluxe Suite",
        }),
      });
      Booking.findOne = () => ({
        sort: () => ({
          populate: async () => ({
            _id: new mongoose.Types.ObjectId(),
            reservationNo: "RES-9988",
            status: "checked-in",
            guestId: {
              _id: guestUserId,
              name: "Jane Doe",
              username: "janedoe",
              isActive: true,
              role: "GUEST",
            },
          }),
        }),
      });
      Hotel.findById = () => ({
        select: () => ({ name: "The Grand Hotel" }),
      });

      const rawCode = "handoff_code_checkedin_456";
      KioskHandoff.findOneAndUpdate = async () => ({
        codeHash: crypto.createHash("sha256").update(rawCode).digest("hex"),
        kioskId: guestKioskId,
        hotelId: fakeHotelId,
        targetDashboard: "GUEST_DASHBOARD",
        roomId: guestRoomId,
        consumed: false,
      });

      Session.create = async (doc) => ({
        ...doc,
        _id: new mongoose.Types.ObjectId(),
      });

      const req = { body: { handoffCode: rawCode } };
      const res = createMockResponse();

      await exchangeKioskHandoff(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.data.activeStay, true);
      assert.ok(res.body.data.guestToken);
      assert.equal(res.body.data.user.name, "Jane Doe");
      assert.equal(res.body.data.reservationNo, "RES-9988");
      assert.equal(res.body.data.roomNumber, "101");
    });

    it("idempotently returns room vacant status via getKioskRoomStatus", async () => {
      const guestKioskId = new mongoose.Types.ObjectId();
      const guestRoomId = new mongoose.Types.ObjectId();

      Booking.findOne = () => ({
        sort: () => ({
          populate: async () => null,
        }),
      });

      const req = {
        kiosk: {
          _id: guestKioskId,
          hotelId: fakeHotelId,
          roomId: guestRoomId,
        },
      };
      const res = createMockResponse();

      await getKioskRoomStatus(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.data.activeStay, false);
      assert.equal(res.body.data.guestToken, null);
    });

    it("idempotently returns active stay and guestToken via getKioskRoomStatus", async () => {
      const guestKioskId = new mongoose.Types.ObjectId();
      const guestRoomId = new mongoose.Types.ObjectId();
      const guestUserId = new mongoose.Types.ObjectId();

      Booking.findOne = () => ({
        sort: () => ({
          populate: async () => ({
            _id: new mongoose.Types.ObjectId(),
            reservationNo: "RES-7766",
            status: "checked-in",
            guestId: {
              _id: guestUserId,
              name: "Alice Smith",
              username: "alicesmith",
              isActive: true,
              role: "GUEST",
            },
          }),
        }),
      });

      const req = {
        kiosk: {
          _id: guestKioskId,
          hotelId: fakeHotelId,
          roomId: guestRoomId,
        },
      };
      const res = createMockResponse();

      await getKioskRoomStatus(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.data.activeStay, true);
      assert.ok(res.body.data.guestToken);
      assert.equal(res.body.data.user.name, "Alice Smith");
      assert.equal(res.body.data.reservationNo, "RES-7766");
    });
  });

  describe("Order Security & Payment Dismissal", () => {
    it("returns existing order when duplicate idempotencyKey is submitted", async () => {
      const existingOrder = {
        _id: new mongoose.Types.ObjectId(),
        hotelId: fakeHotelId,
        tableId: fakeTableId,
        items: [],
        totalAmount: 450,
        idempotencyKey: "idem_key_999",
      };

      Order.findOne = async (q) =>
        q.idempotencyKey === "idem_key_999" ? existingOrder : null;

      const req = {
        headers: { "x-idempotency-key": "idem_key_999" },
        body: {
          items: [{ foodItemId: "item_1", quantity: 1 }],
          paymentMode: "COD",
        },
        session: {
          _id: new mongoose.Types.ObjectId(),
          type: "QR_GUEST",
          hotelId: fakeHotelId,
          tableId: fakeTableId,
        },
      };
      const res = createMockResponse();

      await createTableOrder(req, res);

      assert.equal(res.statusCode, 200);
      assert.match(res.body.message, /idempotent response/);
      assert.equal(res.body.data.id.toString(), existingOrder._id.toString());
    });

    it("does not mark order as REJECTED when payment is failed or dismissed", async () => {
      const order = {
        _id: new mongoose.Types.ObjectId(),
        hotelId: fakeHotelId,
        tableId: fakeTableId,
        status: "NEW",
        paymentStatus: "PENDING",
        save: async function () {
          return this;
        },
      };

      Order.findById = async () => order;

      const req = {
        body: { orderId: order._id.toString() },
        session: {
          hotelId: fakeHotelId,
          tableId: fakeTableId,
          type: "QR_GUEST",
        },
      };
      const res = createMockResponse();

      await markPaymentFailed(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(order.paymentStatus, "FAILED");
      assert.equal(
        order.status,
        "NEW",
        "Order status must remain NEW and open for retry",
      );
    });
  });

  describe("Session Orders Retrieval (getSessionOrders)", () => {
    it("returns session orders for authenticated session", async () => {
      const sessionId = new mongoose.Types.ObjectId();
      const mockOrder = {
        _id: new mongoose.Types.ObjectId(),
        hotelId: fakeHotelId,
        tableId: fakeTableId,
        sessionId,
        items: [{ name: "Paneer Tikka", price: 250, quantity: 2 }],
        totalAmount: 500,
        subtotal: 500,
        discount: 0,
        gst: 25,
        status: "NEW",
        paymentStatus: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      Order.find = () => ({
        sort: () => ({
          limit: () => [mockOrder],
        }),
      });

      const req = {
        session: {
          _id: sessionId,
          hotelId: fakeHotelId,
          tableId: fakeTableId,
          createdAt: new Date(),
        },
      };
      const res = createMockResponse();

      await getSessionOrders(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.length, 1);
      assert.equal(res.body.data[0].id.toString(), mockOrder._id.toString());
      assert.equal(res.body.data[0].totalAmount, 500);
    });
  });
});

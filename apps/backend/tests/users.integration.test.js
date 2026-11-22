/**
 * Integration Tests for User Management, Soft Delete, Collision Handling & Kitchen Auth Isolation
 */

process.env.NODE_ENV = "test";

import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import User from "../src/modules/users/models/User.js";
import Hotel from "../src/modules/hotels/models/Hotel.js";
import { generateToken } from "../src/shared/utils/jwt.js";

let mongoServer;
let app;
let server;
let hotelId;
let superAdminToken;
let subAdminToken;
let testHotel;

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = "test-jwt-secret-key-that-is-at-least-32-chars-long";
  process.env.JWT_EXPIRES_IN = "1h";
  process.env.NODE_ENV = "test";

  const appModule = await import("../src/app.js");
  app = appModule.default;

  const dbModule = await import("../src/config/db.js");
  await dbModule.default(uri);

  const { createServer } = await import("node:http");
  server = createServer(app);
  await new Promise((resolve, reject) => {
    server.listen(5002, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
  try {
    const { redisConnection } = await import("../src/config/redis.js");
    if (
      redisConnection?.status === "ready" ||
      redisConnection?.status === "connecting"
    ) {
      redisConnection.disconnect();
    }
  } catch {}
});

beforeEach(async () => {
  await User.deleteMany({});
  await Hotel.deleteMany({});

  testHotel = await Hotel.create({
    name: "Grand Plaza Hotel",
    hotelCode: "GPH01",
    email: "grand@hotel.com",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    status: "ACTIVE",
  });
  hotelId = testHotel._id;

  const superAdmin = await User.create({
    name: "Super Admin",
    username: "superadmin",
    password: "Password123!",
    role: "SUPER_ADMIN",
    isActive: true,
  });
  superAdminToken = generateToken(superAdmin);

  const subAdmin = await User.create({
    name: "Hotel Manager",
    username: "manager_gph",
    password: "Password123!",
    role: "SUB_ADMIN",
    hotelId,
    isActive: true,
  });
  subAdminToken = generateToken(subAdmin);
});

describe("Kitchen Authentication Isolation", () => {
  it("rejects receptionist attempting to login with expectedRole KITCHEN", async () => {
    await User.create({
      name: "Front Desk Staff",
      username: "reception_1",
      password: "Password123!",
      role: "RECEPTIONIST",
      hotelId,
      isActive: true,
    });

    const res = await fetch("http://localhost:5002/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "reception_1",
        password: "Password123!",
        expectedRole: "KITCHEN",
      }),
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /kitchen access/i);
  });

  it("successfully logs in dedicated kitchen staff account with expectedRole KITCHEN", async () => {
    await User.create({
      name: "Chef Ramsay",
      username: "chef_ramsay",
      password: "Password123!",
      role: "KITCHEN",
      hotelId,
      isActive: true,
    });

    const res = await fetch("http://localhost:5002/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "chef_ramsay",
        password: "Password123!",
        expectedRole: "KITCHEN",
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.user.role, "KITCHEN");
  });
});

describe("User CRUD & Soft Deletion", () => {
  it("allows Sub-Admin to create a staff member with custom username and password", async () => {
    const res = await fetch("http://localhost:5002/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${subAdminToken}`,
      },
      body: JSON.stringify({
        name: "Chef Sanjay",
        role: "KITCHEN",
        username: "chef_sanjay",
        password: "SecurePass123!",
        email: "sanjay@hotel.com",
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.username, "chef_sanjay");
    assert.equal(body.data.role, "KITCHEN");
  });

  it("prevents duplicate active usernames", async () => {
    await User.create({
      name: "Chef Sanjay",
      username: "chef_sanjay",
      password: "SecurePass123!",
      role: "KITCHEN",
      hotelId,
      isActive: true,
    });

    const res = await fetch("http://localhost:5002/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${subAdminToken}`,
      },
      body: JSON.stringify({
        name: "Another Sanjay",
        role: "KITCHEN",
        username: "chef_sanjay",
        password: "SecurePass123!",
      }),
    });

    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /already taken/i);
  });

  it("soft-deletes member when deleted by Sub-Admin and frees up original username", async () => {
    const staff = await User.create({
      name: "Chef Sanjay",
      username: "chef_sanjay",
      password: "SecurePass123!",
      role: "KITCHEN",
      hotelId,
      isActive: true,
    });

    // Sub-Admin deletes user
    const deleteRes = await fetch(
      `http://localhost:5002/api/v1/users/${staff._id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${subAdminToken}` },
      },
    );

    assert.equal(deleteRes.status, 200);
    const deleteBody = await deleteRes.json();
    assert.equal(deleteBody.success, true);

    // Verify user is soft-deleted in DB
    const dbUser = await User.findById(staff._id);
    assert.ok(dbUser);
    assert.equal(dbUser.isDeleted, true);
    assert.equal(dbUser.isActive, false);
    assert.equal(dbUser.originalUsername, "chef_sanjay");
    assert.match(dbUser.username, /^chef_sanjay_deleted_\d+$/);

    // Verify Sub-Admin query does NOT return the soft-deleted user
    const queryRes = await fetch("http://localhost:5002/api/v1/users", {
      headers: { Authorization: `Bearer ${subAdminToken}` },
    });
    const queryBody = await queryRes.json();
    assert.equal(queryBody.data.length, 1); // Only Sub-Admin themselves
    assert.equal(queryBody.data[0].role, "SUB_ADMIN");

    // Recreate another user with the original username -> MUST succeed
    const recreateRes = await fetch("http://localhost:5002/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${subAdminToken}`,
      },
      body: JSON.stringify({
        name: "New Chef Sanjay",
        role: "KITCHEN",
        username: "chef_sanjay",
        password: "NewPass12345!",
      }),
    });

    assert.equal(recreateRes.status, 201);
    const recreateBody = await recreateRes.json();
    assert.equal(recreateBody.data.username, "chef_sanjay");
  });

  it("handles Super-Admin restore with username collision resolution", async () => {
    // 1. Create original user
    const originalStaff = await User.create({
      name: "Old Receptionist",
      username: "reception_front",
      password: "Password123!",
      role: "RECEPTIONIST",
      hotelId,
      isActive: true,
    });

    // 2. Soft-delete original user
    await fetch(`http://localhost:5002/api/v1/users/${originalStaff._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${subAdminToken}` },
    });

    // 3. Re-assign username "reception_front" to a new active user
    await User.create({
      name: "New Receptionist",
      username: "reception_front",
      password: "Password123!",
      role: "RECEPTIONIST",
      hotelId,
      isActive: true,
    });

    // 4. Super-Admin tries restoring original user without a new username -> 409 USERNAME_TAKEN
    const restoreRes = await fetch(
      `http://localhost:5002/api/v1/users/${originalStaff._id}/restore`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({}),
      },
    );

    assert.equal(restoreRes.status, 409);
    const restoreBody = await restoreRes.json();
    assert.equal(restoreBody.code, "USERNAME_TAKEN");
    assert.equal(restoreBody.originalUsername, "reception_front");

    // 5. Super-Admin restores with a new non-conflicting username
    const restoreWithNewUsernameRes = await fetch(
      `http://localhost:5002/api/v1/users/${originalStaff._id}/restore`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({ newUsername: "reception_front_restored" }),
      },
    );

    assert.equal(restoreWithNewUsernameRes.status, 200);
    const successBody = await restoreWithNewUsernameRes.json();
    assert.equal(successBody.data.username, "reception_front_restored");
    assert.equal(successBody.data.isDeleted, false);
    assert.equal(successBody.data.isActive, true);
  });

  it("allows Super-Admin to permanently delete a user from MongoDB", async () => {
    const staff = await User.create({
      name: "Temp Staff",
      username: "temp_staff_01",
      password: "Password123!",
      role: "KITCHEN",
      hotelId,
      isActive: true,
    });

    const res = await fetch(
      `http://localhost:5002/api/v1/users/${staff._id}?permanent=true`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${superAdminToken}` },
      },
    );

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.match(body.message, /permanently deleted/i);

    const exists = await User.findById(staff._id);
    assert.equal(exists, null);
  });

  it("excludes GUEST accounts from GET /api/v1/users by default unless ?role=GUEST is requested", async () => {
    // 1. Create a guest user
    const guest = await User.create({
      name: "John Guest",
      username: "guest_john_99",
      password: "Password123!",
      role: "GUEST",
      hotelId,
      isActive: true,
    });

    // 2. Query users for this hotel without specifying role
    const defaultRes = await fetch(
      `http://localhost:5002/api/v1/users?hotelId=${hotelId}`,
      {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      },
    );
    assert.equal(defaultRes.status, 200);
    const defaultBody = await defaultRes.json();
    const guestInDefault = defaultBody.data.find(
      (u) => u.username === "guest_john_99",
    );
    assert.equal(
      guestInDefault,
      undefined,
      "GUEST accounts must be excluded from default staff query",
    );

    // 3. Query explicitly with role=GUEST
    const guestRes = await fetch(
      `http://localhost:5002/api/v1/users?hotelId=${hotelId}&role=GUEST`,
      {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      },
    );
    assert.equal(guestRes.status, 200);
    const guestBody = await guestRes.json();
    const guestFound = guestBody.data.find(
      (u) => u.username === "guest_john_99",
    );
    assert.ok(
      guestFound,
      "GUEST accounts must be returned when ?role=GUEST is explicitly specified",
    );

    // Clean up
    await User.findByIdAndDelete(guest._id);
  });

  it("successfully updates hotel sections via PATCH /api/v1/hotels/:hotelId (Operations, Identity, Tax)", async () => {
    // 1. Operations & Wi-Fi section update
    const opsRes = await fetch(
      `http://localhost:5002/api/v1/hotels/${hotelId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({
          checkInTime: "14:00",
          checkOutTime: "11:00",
          wifiNetworkName: "GrandGuest_WiFi",
          wifiPassword: "WelcomeGuest2026",
        }),
      },
    );
    assert.equal(
      opsRes.status,
      200,
      "Operations section update must succeed with 200",
    );
    const opsBody = await opsRes.json();
    assert.equal(opsBody.data.checkInTime, "14:00");
    assert.equal(opsBody.data.checkOutTime, "11:00");
    assert.equal(opsBody.data.wifiNetworkName, "GrandGuest_WiFi");

    // 2. Identity section update with aiosellHotelCode = null
    const idRes = await fetch(
      `http://localhost:5002/api/v1/hotels/${hotelId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({
          name: "Renamed Grand Hotel",
          aiosellHotelCode: null,
        }),
      },
    );
    assert.equal(
      idRes.status,
      200,
      "Identity section update must succeed with 200",
    );
    const idBody = await idRes.json();
    assert.equal(idBody.data.name, "Renamed Grand Hotel");
    assert.equal(idBody.data.aiosellHotelCode, null);

    // 3. Tax section update with null/zero tax percent
    const taxRes = await fetch(
      `http://localhost:5002/api/v1/hotels/${hotelId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({
          gstin: "27ABCDE1234F1Z5",
          taxPercent: 18,
          currency: "INR",
        }),
      },
    );
    assert.equal(
      taxRes.status,
      200,
      "Tax section update must succeed with 200",
    );
    const taxBody = await taxRes.json();
    assert.equal(taxBody.data.taxPercent, 18);
    assert.equal(taxBody.data.gstin, "27ABCDE1234F1Z5");
  });
});

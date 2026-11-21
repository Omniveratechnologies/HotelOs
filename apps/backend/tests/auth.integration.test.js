/**
 * Integration Tests for Authentication Flows
 * Tests: Login, 2FA, Password Reset, Account Lockout
 */

process.env.NODE_ENV = "test";

import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import User from "../src/modules/users/models/User.js";
import {
  generateToken,
  generateAccountSelectionToken,
} from "../src/shared/utils/jwt.js";
import speakeasy from "speakeasy";

let mongoServer;
let app;
let server;

// Test utilities
const createTestUser = async (overrides = {}) => {
  const user = new User({
    name: "Test User",
    username: "testuser",
    email: "test@example.com",
    password: "TestPass123!",
    role: "SUPER_ADMIN",
    hotelId: new mongoose.Types.ObjectId(),
    isActive: true,
    mustChangePassword: false,
    ...overrides,
  });
  return user.save();
};

const createTestSuperAdmin = async (overrides = {}) => {
  return createTestUser({ role: "SUPER_ADMIN", ...overrides });
};

const _createTestSubAdmin = async (overrides = {}) => {
  return createTestUser({ role: "SUB_ADMIN", ...overrides });
};

const _createTestReceptionist = async (overrides = {}) => {
  return createTestUser({ role: "RECEPTIONIST", ...overrides });
};

// Setup and teardown
before(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = "test-jwt-secret-key-that-is-at-least-32-chars-long";
  process.env.JWT_EXPIRES_IN = "1h";
  process.env.NODE_ENV = "test";

  // Import app after env is set
  const appModule = await import("../src/app.js");
  app = appModule.default;

  // Connect to in-memory database
  const dbModule = await import("../src/config/db.js");
  await dbModule.default(uri);

  // Start HTTP server
  const { createServer } = await import("node:http");
  server = createServer(app);
  await new Promise((resolve, reject) => {
    server.listen(5001, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  global.testServer = server;
  global.testApp = app;
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
  // Clear database between tests ONLY on verified local test host
  const host = mongoose.connection?.host;
  const isLocalHost = host === "127.0.0.1" || host === "localhost";
  if (!isLocalHost) {
    throw new Error(
      `CRITICAL TEST SAFETY GUARD: Aborting User.deleteMany()! Mongoose is connected to non-local host: '${host}'`,
    );
  }
  await User.deleteMany({});
});

describe("Authentication Integration Tests", () => {
  describe("Login Flow", () => {
    it("should login successfully with valid credentials", async () => {
      await createTestSuperAdmin({ password: "TestPass123!" });

      const response = await fetch("http://localhost:5001/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "testuser",
          password: "TestPass123!",
        }),
      });

      const data = await response.json();
      assert.equal(response.status, 200);
      assert.equal(data.success, true);
      assert.ok(data.data.token);
      assert.equal(data.data.user.username, "testuser");
      assert.equal(data.data.user.role, "SUPER_ADMIN");
    });

    it("should reject login with invalid password", async () => {
      await createTestSuperAdmin({ password: "TestPass123!" });

      const response = await fetch("http://localhost:5001/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "testuser",
          password: "WrongPass123!",
        }),
      });

      const data = await response.json();
      assert.equal(response.status, 401);
      assert.equal(data.success, false);
      assert.equal(data.message, "Invalid credentials");
    });

    it("should reject login for non-existent user", async () => {
      const response = await fetch("http://localhost:5001/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "nonexistent",
          password: "TestPass123!",
        }),
      });

      const data = await response.json();
      assert.equal(response.status, 401);
      assert.equal(data.success, false);
      assert.equal(data.message, "Invalid credentials");
    });

    it("should reject login for disabled account", async () => {
      await createTestSuperAdmin({ isActive: false });

      const response = await fetch("http://localhost:5001/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "testuser",
          password: "TestPass123!",
        }),
      });

      const data = await response.json();
      assert.equal(response.status, 403);
      assert.equal(data.success, false);
      assert.equal(data.message, "Account is disabled");
    });

    it("should enforce account lockout after 5 failed attempts", async () => {
      await createTestSuperAdmin({ password: "TestPass123!" });

      // Make 5 failed attempts
      const loginRequests = Array.from({ length: 5 }, () =>
        fetch("http://localhost:5001/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "testuser",
            password: "WrongPass123!",
          }),
        }),
      );
      const responses = await Promise.all(loginRequests);
      for (const response of responses) {
        assert.equal(response.status, 401);
      }

      // 6th attempt should be locked
      const response = await fetch("http://localhost:5001/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "testuser",
          password: "WrongPass123!",
        }),
      });

      const data = await response.json();
      assert.equal(response.status, 423);
      assert.equal(data.success, false);
      assert.ok(data.message.includes("locked"));
    });

    it("should reset failed attempts on successful login", async () => {
      await createTestSuperAdmin({ password: "TestPass123!" });

      // 3 failed attempts
      const failedRequests = Array.from({ length: 3 }, () =>
        fetch("http://localhost:5001/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "testuser",
            password: "WrongPass123!",
          }),
        }),
      );
      await Promise.all(failedRequests);

      // Successful login
      const response = await fetch("http://localhost:5001/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "testuser",
          password: "TestPass123!",
        }),
      });

      const data = await response.json();
      assert.equal(response.status, 200);
      assert.equal(data.success, true);
    });
  });

  describe("Password Reset Flow", () => {
    it("should send reset email for valid user", async () => {
      await createTestSuperAdmin({ email: "test@example.com" });

      const response = await fetch(
        "http://localhost:5001/api/v1/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@example.com" }),
        },
      );

      const data = await response.json();
      assert.equal(response.status, 200);
      assert.equal(data.success, true);
      assert.ok(data.message.includes("reset"));
    });

    it("should not reveal if email exists (prevent enumeration)", async () => {
      const response = await fetch(
        "http://localhost:5001/api/v1/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "nonexistent@example.com" }),
        },
      );

      const data = await response.json();
      assert.equal(response.status, 200);
      assert.equal(data.success, true);
      // Should return same message regardless of email existence
    });

    it("should reject reset with invalid token", async () => {
      const response = await fetch(
        "http://localhost:5001/api/v1/auth/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: "invalid-token",
            password: "NewPass123!",
          }),
        },
      );

      const data = await response.json();
      assert.equal(response.status, 400);
      assert.equal(data.success, false);
    });

    it("should enforce password strength on reset", async () => {
      const user = await createTestSuperAdmin();
      user.resetPasswordToken = "valid-token";
      user.resetPasswordExpires = new Date(Date.now() + 3600000);
      await user.save();

      // Weak password
      const response = await fetch(
        "http://localhost:5001/api/v1/auth/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: "valid-token", password: "weak" }),
        },
      );

      const data = await response.json();
      assert.equal(response.status, 400);
      assert.equal(data.success, false);
      assert.ok(data.message.includes("password"));
    });

    it("should prevent password reuse", async () => {
      const user = await createTestSuperAdmin({ password: "OldPass123!" });
      user.resetPasswordToken = "valid-token";
      user.resetPasswordExpires = new Date(Date.now() + 3600000);
      await user.save();

      const response = await fetch(
        "http://localhost:5001/api/v1/auth/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: "valid-token",
            password: "OldPass123!",
          }),
        },
      );

      const data = await response.json();
      assert.equal(response.status, 400);
      assert.equal(data.success, false);
      assert.ok(data.message.includes("reused"));
    });
  });

  describe("Multi-Dashboard & Multi-Account Recovery Flow", () => {
    it("should scope forgot-username to portal when superadmin and subadmin share an email", async () => {
      const email = "shared_recovery@example.com";
      await createTestUser({
        username: "super_admin_shared",
        email,
        role: "SUPER_ADMIN",
      });
      await createTestUser({
        username: "sub_admin_shared",
        email,
        role: "SUB_ADMIN",
      });

      const response = await fetch(
        "http://localhost:5001/api/v1/auth/forgot-username",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, portal: "SUB_ADMIN" }),
        },
      );

      const data = await response.json();
      assert.equal(response.status, 200);
      assert.equal(data.success, true);
    });

    it("should scope forgot-password to portal and not touch other dashboards when email is shared", async () => {
      const email = "shared_pwd@example.com";
      const superUser = await createTestUser({
        username: "super_pwd_user",
        email,
        role: "SUPER_ADMIN",
      });
      const subUser = await createTestUser({
        username: "sub_pwd_user",
        email,
        role: "SUB_ADMIN",
      });

      const response = await fetch(
        "http://localhost:5001/api/v1/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, portal: "SUB_ADMIN" }),
        },
      );

      const data = await response.json();
      assert.equal(response.status, 200);
      assert.equal(data.success, true);

      // Verify that Sub-Admin user received reset token, but Super-Admin user was untouched
      const refreshedSub = await User.findById(subUser._id).select(
        "+resetPasswordToken",
      );
      const refreshedSuper = await User.findById(superUser._id).select(
        "+resetPasswordToken",
      );

      assert.ok(refreshedSub.resetPasswordToken);
      assert.ok(!refreshedSuper.resetPasswordToken);
    });

    it("should require account selection when 1 email has multiple accounts in the same portal", async () => {
      const email = "multi_subadmin@example.com";
      const sub1 = await createTestUser({
        username: "hotel1_admin",
        email,
        role: "SUB_ADMIN",
      });
      const sub2 = await createTestUser({
        username: "hotel2_admin",
        email,
        role: "SUB_ADMIN",
      });

      // Request forgot-password with email
      const response = await fetch(
        "http://localhost:5001/api/v1/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, portal: "SUB_ADMIN" }),
        },
      );

      const data = await response.json();
      assert.equal(response.status, 200);
      assert.equal(data.success, true);

      // Verify NO resetPasswordToken is assigned yet to either user (prevent premature reset tokens)
      const freshSub1 = await User.findById(sub1._id).select(
        "+resetPasswordToken",
      );
      const freshSub2 = await User.findById(sub2._id).select(
        "+resetPasswordToken",
      );
      assert.ok(!freshSub1.resetPasswordToken);
      assert.ok(!freshSub2.resetPasswordToken);

      // Verify selection token allows fetching accounts
      const selectionToken = generateAccountSelectionToken({
        email,
        portal: "SUB_ADMIN",
      });

      const accountsRes = await fetch(
        `http://localhost:5001/api/v1/auth/reset-password/accounts?token=${selectionToken}`,
      );
      const accountsData = await accountsRes.json();
      assert.equal(accountsRes.status, 200);
      assert.equal(accountsData.success, true);
      assert.equal(accountsData.data.accounts.length, 2);

      const usernames = new Set(
        accountsData.data.accounts.map((a) => a.username),
      );
      assert.ok(usernames.has("hotel1_admin"));
      assert.ok(usernames.has("hotel2_admin"));

      // Select hotel1_admin
      const selectRes = await fetch(
        "http://localhost:5001/api/v1/auth/reset-password/select-account",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: selectionToken,
            username: "hotel1_admin",
          }),
        },
      );
      const selectData = await selectRes.json();
      assert.equal(selectRes.status, 200);
      assert.equal(selectData.success, true);
      assert.ok(selectData.data.resetToken);

      // Check DB: hotel1_admin now has reset token, hotel2_admin still does not
      const finalSub1 = await User.findById(sub1._id).select(
        "+resetPasswordToken",
      );
      const finalSub2 = await User.findById(sub2._id).select(
        "+resetPasswordToken",
      );
      assert.equal(finalSub1.resetPasswordToken, selectData.data.resetToken);
      assert.ok(!finalSub2.resetPasswordToken);

      // Perform reset password using the returned resetToken
      const resetRes = await fetch(
        "http://localhost:5001/api/v1/auth/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: selectData.data.resetToken,
            password: "NewBrandNewPass123!",
          }),
        },
      );
      const resetData = await resetRes.json();
      assert.equal(resetRes.status, 200);
      assert.equal(resetData.success, true);
    });

    it("should allow direct password reset by username without disambiguation", async () => {
      const email = "direct_user@example.com";
      const subUser = await createTestUser({
        username: "direct_sub_user",
        email,
        role: "SUB_ADMIN",
      });

      const response = await fetch(
        "http://localhost:5001/api/v1/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: "direct_sub_user",
            portal: "SUB_ADMIN",
          }),
        },
      );

      const data = await response.json();
      assert.equal(response.status, 200);
      assert.equal(data.success, true);

      const refreshed = await User.findById(subUser._id).select(
        "+resetPasswordToken",
      );
      assert.ok(refreshed.resetPasswordToken);
    });

    it("should prevent enumeration for forgot-username and forgot-password with nonexistent accounts", async () => {
      const resUsername = await fetch(
        "http://localhost:5001/api/v1/auth/forgot-username",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "notexists@example.com",
            portal: "SUB_ADMIN",
          }),
        },
      );
      const dataUsername = await resUsername.json();
      assert.equal(resUsername.status, 200);
      assert.equal(dataUsername.success, true);

      const resPassword = await fetch(
        "http://localhost:5001/api/v1/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: "nonexistent_username",
            portal: "SUB_ADMIN",
          }),
        },
      );
      const dataPassword = await resPassword.json();
      assert.equal(resPassword.status, 200);
      assert.equal(dataPassword.success, true);
    });

    it("should scope forgot-password to KITCHEN portal when kitchen and superadmin share an email", async () => {
      const email = "shared_kitchen@example.com";
      const superUser = await createTestUser({
        username: "super_kitchen_shared",
        email,
        role: "SUPER_ADMIN",
      });
      const kitchenUser = await createTestUser({
        username: "kitchen_staff_shared",
        email,
        role: "KITCHEN",
      });

      const response = await fetch(
        "http://localhost:5001/api/v1/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, portal: "KITCHEN" }),
        },
      );

      const data = await response.json();
      assert.equal(response.status, 200);
      assert.equal(data.success, true);

      const refreshedKitchen = await User.findById(kitchenUser._id).select(
        "+resetPasswordToken",
      );
      const refreshedSuper = await User.findById(superUser._id).select(
        "+resetPasswordToken",
      );

      assert.ok(refreshedKitchen.resetPasswordToken);
      assert.ok(!refreshedSuper.resetPasswordToken);
    });

    it("should scope forgot-username and forgot-password to GUEST portal", async () => {
      const email = "guest_recovery@example.com";
      const guestUser = await createTestUser({
        username: "guest_user_1",
        email,
        role: "GUEST",
      });

      const resUser = await fetch(
        "http://localhost:5001/api/v1/auth/forgot-username",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, portal: "GUEST" }),
        },
      );
      const dataUser = await resUser.json();
      assert.equal(resUser.status, 200);
      assert.equal(dataUser.success, true);

      const resPass = await fetch(
        "http://localhost:5001/api/v1/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, portal: "GUEST" }),
        },
      );
      const dataPass = await resPass.json();
      assert.equal(resPass.status, 200);
      assert.equal(dataPass.success, true);

      const refreshedGuest = await User.findById(guestUser._id).select(
        "+resetPasswordToken",
      );
      assert.ok(refreshedGuest.resetPasswordToken);
    });
  });

  describe("Change Password (Authenticated)", () => {
    it("should change password with valid current password", async () => {
      const user = await createTestSuperAdmin({ password: "TestPass123!" });
      const token = generateToken(user);

      const response = await fetch(
        "http://localhost:5001/api/v1/auth/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: "TestPass123!",
            newPassword: "NewPass456!",
            confirmPassword: "NewPass456!",
          }),
        },
      );

      const data = await response.json();
      assert.equal(response.status, 200);
      assert.equal(data.success, true);
    });

    it("should reject change with wrong current password", async () => {
      const user = await createTestSuperAdmin({ password: "TestPass123!" });
      const token = generateToken(user);

      const response = await fetch(
        "http://localhost:5001/api/v1/auth/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: "WrongPass123!",
            newPassword: "NewPass456!",
            confirmPassword: "NewPass456!",
          }),
        },
      );

      const data = await response.json();
      assert.equal(response.status, 401);
      assert.equal(data.success, false);
    });

    it("should enforce password strength on change", async () => {
      const user = await createTestSuperAdmin({ password: "TestPass123!" });
      const token = generateToken(user);

      const response = await fetch(
        "http://localhost:5001/api/v1/auth/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: "TestPass123!",
            newPassword: "weak",
            confirmPassword: "weak",
          }),
        },
      );

      const data = await response.json();
      assert.equal(response.status, 400);
      assert.equal(data.success, false);
    });

    it("should prevent password reuse on change", async () => {
      const user = await createTestSuperAdmin({ password: "TestPass123!" });
      const token = generateToken(user);

      const response = await fetch(
        "http://localhost:5001/api/v1/auth/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: "TestPass123!",
            newPassword: "TestPass123!",
            confirmPassword: "TestPass123!",
          }),
        },
      );

      const data = await response.json();
      assert.equal(response.status, 400);
      assert.equal(data.success, false);
      assert.ok(data.message.includes("reused"));
    });
  });

  describe("Two-Factor Authentication", () => {
    it("should generate 2FA secret and QR code", async () => {
      const user = await createTestSuperAdmin();
      const token = generateToken(user);

      const response = await fetch(
        "http://localhost:5001/api/v1/auth/2fa/setup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      assert.equal(response.status, 200);
      assert.equal(data.success, true);
      assert.ok(data.data.secret);
      assert.ok(data.data.qrCodeUrl);
      assert.ok(data.data.backupCodes);
      assert.equal(data.data.backupCodes.length, 10);
    });

    it("should enable 2FA after valid token verification", async () => {
      const user = await createTestSuperAdmin();
      const token = generateToken(user);

      // Setup 2FA
      const setupResponse = await fetch(
        "http://localhost:5001/api/v1/auth/2fa/setup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const setupData = await setupResponse.json();
      const secret = setupData.data.secret;

      // Generate valid TOTP token
      const totp = speakeasy.totp({ secret, encoding: "base32" });

      // Verify and enable
      const verifyResponse = await fetch(
        "http://localhost:5001/api/v1/auth/2fa/setup/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ token: totp }),
        },
      );

      const verifyData = await verifyResponse.json();
      assert.equal(verifyResponse.status, 200);
      assert.equal(verifyData.success, true);
      assert.equal(verifyData.data.enabled, true);

      // Check 2FA status
      const statusResponse = await fetch(
        "http://localhost:5001/api/v1/auth/2fa/status",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const statusData = await statusResponse.json();
      assert.equal(statusData.data.enabled, true);
    });

    it("should reject invalid 2FA token during setup", async () => {
      const user = await createTestSuperAdmin();
      const token = generateToken(user);

      await fetch("http://localhost:5001/api/v1/auth/2fa/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await fetch(
        "http://localhost:5001/api/v1/auth/2fa/setup/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ token: "000000" }),
        },
      );

      const data = await response.json();
      assert.equal(response.status, 400);
      assert.equal(data.success, false);
    });

    it("should require 2FA on login when enabled", async () => {
      const user = await createTestSuperAdmin({ password: "TestPass123!" });
      const token = generateToken(user);

      // Setup and enable 2FA
      const setupResponse = await fetch(
        "http://localhost:5001/api/v1/auth/2fa/setup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const setupData = await setupResponse.json();
      const secret = setupData.data.secret;
      const totp = speakeasy.totp({ secret, encoding: "base32" });

      await fetch("http://localhost:5001/api/v1/auth/2fa/setup/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: totp }),
      });

      // Now login should require 2FA
      const loginResponse = await fetch(
        "http://localhost:5001/api/v1/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "testuser",
            password: "TestPass123!",
          }),
        },
      );

      const loginData = await loginResponse.json();
      assert.equal(loginResponse.status, 200);
      assert.equal(loginData.success, true);
      assert.equal(loginData.requires2FA, true);
      assert.ok(loginData.data.userId);

      // Verify 2FA to complete login
      const totp2 = speakeasy.totp({ secret, encoding: "base32" });
      const verifyResponse = await fetch(
        "http://localhost:5001/api/v1/auth/2fa/verify-login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: loginData.data.userId, token: totp2 }),
        },
      );

      const verifyData = await verifyResponse.json();
      assert.equal(verifyResponse.status, 200);
      assert.equal(verifyData.success, true);
      assert.ok(verifyData.data.token);
    });

    it("should reject subsequent login with the same 2FA token (replay prevention)", async () => {
      // 1. Setup and enable 2FA
      const user = await createTestSuperAdmin({ password: "TestPass123!" });
      const authToken = generateToken(user);

      const setupResponse = await fetch(
        "http://localhost:5001/api/v1/auth/2fa/setup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      const setupData = await setupResponse.json();
      const secret = setupData.data.secret;

      // Enable 2FA
      const setupTotp = speakeasy.totp({ secret, encoding: "base32" });
      await fetch("http://localhost:5001/api/v1/auth/2fa/setup/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token: setupTotp }),
      });

      // 2. First login attempt with 2FA
      const login1 = await fetch("http://localhost:5001/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "testuser",
          password: "TestPass123!",
        }),
      });
      const login1Data = await login1.json();
      assert.equal(login1Data.requires2FA, true);

      // Generate current TOTP code and complete first login
      const totpCode = speakeasy.totp({ secret, encoding: "base32" });
      const verify1 = await fetch(
        "http://localhost:5001/api/v1/auth/2fa/verify-login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: login1Data.data.userId,
            token: totpCode,
          }),
        },
      );
      assert.equal(verify1.status, 200);
      const verify1Data = await verify1.json();
      assert.equal(verify1Data.success, true);
      assert.ok(verify1Data.data.token);

      // 3. Subsequent login with the EXACT SAME code must be REJECTED (RFC 6238 replay prevention)
      const login2 = await fetch("http://localhost:5001/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "testuser",
          password: "TestPass123!",
        }),
      });
      const login2Data = await login2.json();
      assert.equal(login2Data.requires2FA, true);

      const verify2 = await fetch(
        "http://localhost:5001/api/v1/auth/2fa/verify-login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: login2Data.data.userId,
            token: totpCode,
          }),
        },
      );
      assert.equal(verify2.status, 401);
      const verify2Data = await verify2.json();
      assert.equal(verify2Data.success, false);

      // 4. Subsequent login with the NEXT rolling time-step code must SUCCEED
      const nextTotpCode = speakeasy.totp({
        secret,
        encoding: "base32",
        time: Date.now() / 1000 + 30,
      });
      const verify3 = await fetch(
        "http://localhost:5001/api/v1/auth/2fa/verify-login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: login2Data.data.userId,
            token: nextTotpCode,
          }),
        },
      );
      assert.equal(verify3.status, 200);
      const verify3Data = await verify3.json();
      assert.equal(verify3Data.success, true);
      assert.ok(verify3Data.data.token);
    });

    it("should allow backup code for 2FA verification", async () => {
      const user = await createTestSuperAdmin({ password: "TestPass123!" });
      const token = generateToken(user);

      // Setup and enable 2FA
      const setupResponse = await fetch(
        "http://localhost:5001/api/v1/auth/2fa/setup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const setupData = await setupResponse.json();
      const backupCode = setupData.data.backupCodes[0];

      await fetch("http://localhost:5001/api/v1/auth/2fa/setup/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          token: speakeasy.totp({
            secret: setupData.data.secret,
            encoding: "base32",
          }),
        }),
      });

      // Login with backup code
      const loginResponse = await fetch(
        "http://localhost:5001/api/v1/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "testuser",
            password: "TestPass123!",
          }),
        },
      );
      const loginData = await loginResponse.json();

      const verifyResponse = await fetch(
        "http://localhost:5001/api/v1/auth/2fa/verify-login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: loginData.data.userId, backupCode }),
        },
      );

      const verifyData = await verifyResponse.json();
      assert.equal(verifyResponse.status, 200);
      assert.equal(verifyData.success, true);

      // Backup code should be consumed
      const statusResponse = await fetch(
        "http://localhost:5001/api/v1/auth/2fa/status",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const statusData = await statusResponse.json();
      assert.equal(statusData.data.backupCodesRemaining, 9);
    });

    it("should disable 2FA with password and token", async () => {
      const user = await createTestSuperAdmin({ password: "TestPass123!" });
      const token = generateToken(user);

      // Setup and enable 2FA
      const setupResponse = await fetch(
        "http://localhost:5001/api/v1/auth/2fa/setup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const setupData = await setupResponse.json();
      const totp = speakeasy.totp({
        secret: setupData.data.secret,
        encoding: "base32",
      });

      await fetch("http://localhost:5001/api/v1/auth/2fa/setup/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: totp }),
      });

      // Disable 2FA
      const disableResponse = await fetch(
        "http://localhost:5001/api/v1/auth/2fa/disable",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            password: "TestPass123!",
            token: speakeasy.totp({
              secret: setupData.data.secret,
              encoding: "base32",
            }),
          }),
        },
      );

      const disableData = await disableResponse.json();
      assert.equal(disableResponse.status, 200);
      assert.equal(disableData.success, true);
      assert.equal(disableData.data.enabled, false);

      // Login should no longer require 2FA
      const loginResponse = await fetch(
        "http://localhost:5001/api/v1/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "testuser",
            password: "TestPass123!",
          }),
        },
      );
      const loginData = await loginResponse.json();
      assert.equal(loginData.requires2FA, undefined);
    });

    it("should regenerate backup codes", async () => {
      const user = await createTestSuperAdmin({ password: "TestPass123!" });
      const token = generateToken(user);

      // Setup and enable 2FA
      const setupResponse = await fetch(
        "http://localhost:5001/api/v1/auth/2fa/setup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const setupData = await setupResponse.json();
      const totp = speakeasy.totp({
        secret: setupData.data.secret,
        encoding: "base32",
      });

      await fetch("http://localhost:5001/api/v1/auth/2fa/setup/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: totp }),
      });

      // Regenerate backup codes
      const regenResponse = await fetch(
        "http://localhost:5001/api/v1/auth/2fa/backup-codes/regenerate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            password: "TestPass123!",
            token: speakeasy.totp({
              secret: setupData.data.secret,
              encoding: "base32",
            }),
          }),
        },
      );

      const regenData = await regenResponse.json();
      assert.equal(regenResponse.status, 200);
      assert.equal(regenData.success, true);
      assert.ok(regenData.data.backupCodes);
      assert.equal(regenData.data.backupCodes.length, 10);
    });
  });

  describe("Rate Limiting", () => {
    it("should enforce rate limit on login endpoint", async () => {
      await createTestSuperAdmin({ password: "TestPass123!" });

      // Make 6 sequential requests (limit is 5)
      const responses = [];
      for (let i = 0; i < 6; i++) {
        const res = await fetch("http://localhost:5001/api/v1/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-test-rate-limit": "true",
          },
          body: JSON.stringify({
            username: "testuser",
            password: "WrongPass123!",
          }),
        });
        responses.push(res);
      }
      for (let i = 0; i < responses.length; i++) {
        if (i < 5) {
          assert.equal(responses[i].status, 401);
        } else {
          assert.equal(responses[i].status, 429);
        }
      }
    });

    it("should enforce rate limit on password reset", async () => {
      // Make 11 sequential requests (limit is 10)
      const responses = [];
      for (let i = 0; i < 11; i++) {
        const res = await fetch(
          "http://localhost:5001/api/v1/auth/forgot-password",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-test-rate-limit": "true",
            },
            body: JSON.stringify({ email: "test@example.com" }),
          },
        );
        responses.push(res);
      }
      for (let i = 0; i < responses.length; i++) {
        if (i < 10) {
          assert.equal(responses[i].status, 200);
        } else {
          assert.equal(responses[i].status, 429);
        }
      }
    });
  });

  describe("Validation", () => {
    it("should validate login request body", async () => {
      const response = await fetch("http://localhost:5001/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "", password: "" }),
      });

      const data = await response.json();
      assert.equal(response.status, 400);
      assert.equal(data.success, false);
      assert.ok(data.errors);
      assert.ok(data.errors.body);
    });

    it("should validate password reset request", async () => {
      const response = await fetch(
        "http://localhost:5001/api/v1/auth/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: "abc", password: "short" }),
        },
      );

      const data = await response.json();
      assert.equal(response.status, 400);
      assert.equal(data.success, false);
      assert.ok(data.errors);
    });

    it("should validate 2FA setup token format", async () => {
      const user = await createTestSuperAdmin();
      const token = generateToken(user);

      await fetch("http://localhost:5001/api/v1/auth/2fa/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await fetch(
        "http://localhost:5001/api/v1/auth/2fa/setup/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ token: "abc" }), // Not 6 digits
        },
      );

      const data = await response.json();
      assert.equal(response.status, 400);
      assert.equal(data.success, false);
    });
  });
});

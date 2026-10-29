import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import mongoose from "mongoose";
import KioskDevice from "./models/KioskDevice.js";
import Table from "#/modules/tables/models/Table.js";
import { resolveKioskAssignedUrl } from "./config/kioskDashboards.js";
import { updateKioskDevice } from "./controllers/kioskDevice.controller.js";
import { getTables } from "#/modules/tables/controllers/table.controller.js";
import env from "#/config/env.js";

function createMockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

describe("Kiosk Dashboard Assignment & Role Authorization", () => {
  const hotelIdA = new mongoose.Types.ObjectId();
  const hotelIdB = new mongoose.Types.ObjectId();
  const tableId1 = new mongoose.Types.ObjectId();
  const kioskId1 = new mongoose.Types.ObjectId();

  beforeEach(() => {
    // Reset stubs
    KioskDevice.findById = undefined;
    KioskDevice.find = undefined;
    KioskDevice.aggregate = undefined;
    Table.find = undefined;
  });

  describe("URL Resolution (resolveKioskAssignedUrl)", () => {
    it("resolves GUEST_DASHBOARD and SELF_CHECKIN to base frontend URLs", () => {
      const guestUrl = resolveKioskAssignedUrl("GUEST_DASHBOARD");
      assert.equal(guestUrl, env.frontendUrls.guest);

      const checkInUrl = resolveKioskAssignedUrl("SELF_CHECKIN");
      assert.equal(checkInUrl, env.frontendUrls.selfCheckin);
    });

    it("resolves DIGITAL_MENU with tableId directly to the table order route", () => {
      const deviceObj = {
        targetDashboard: "DIGITAL_MENU",
        hotelId: hotelIdA,
        tableId: tableId1,
      };

      const resolved = resolveKioskAssignedUrl(deviceObj);
      assert.equal(
        resolved,
        `${env.frontendUrls.tableOrder}/${hotelIdA}/table/${tableId1}/menu`,
      );
    });

    it("resolves DIGITAL_MENU without tableId to base tableOrder URL", () => {
      const deviceObj = {
        targetDashboard: "DIGITAL_MENU",
        hotelId: hotelIdA,
        tableId: null,
      };

      const resolved = resolveKioskAssignedUrl(deviceObj);
      assert.equal(resolved, env.frontendUrls.tableOrder);
    });
  });

  describe("Kiosk Update Role-Based Access Control", () => {
    it("allows Receptionist to toggle maintenance mode on a kiosk in their hotel", async () => {
      const storedKiosk = {
        _id: kioskId1,
        hotelId: hotelIdA,
        status: "ONLINE",
        targetDashboard: "GUEST_DASHBOARD",
        save: async () => {},
      };

      KioskDevice.findById = () => ({
        populate: () => ({
          populate: () => ({
            lean: async () => ({
              ...storedKiosk,
              status: "MAINTENANCE",
            }),
          }),
        }),
      });

      // Override findById for initial fetch
      const origFindById = KioskDevice.findById;
      let calls = 0;
      KioskDevice.findById = (id) => {
        calls++;
        if (calls === 1) {
          return Promise.resolve(storedKiosk);
        }
        return origFindById(id);
      };

      const req = {
        params: { id: kioskId1.toString() },
        user: { role: "RECEPTIONIST", hotelId: hotelIdA },
        body: { status: "MAINTENANCE" },
      };
      const res = createMockResponse();

      await updateKioskDevice(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
    });

    it("rejects Receptionist attempting to mutate dashboard assignment or table binding", async () => {
      const storedKiosk = {
        _id: kioskId1,
        hotelId: hotelIdA,
        targetDashboard: "GUEST_DASHBOARD",
      };

      KioskDevice.findById = async () => storedKiosk;

      const req = {
        params: { id: kioskId1.toString() },
        user: { role: "RECEPTIONIST", hotelId: hotelIdA },
        body: { targetDashboard: "DIGITAL_MENU", tableId: tableId1.toString() },
      };
      const res = createMockResponse();

      await updateKioskDevice(req, res);
      assert.equal(res.statusCode, 403);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /Super Admin/i);
    });

    it("allows Super Admin to reassign hotel, dashboard, table, and features", async () => {
      const storedKiosk = {
        _id: kioskId1,
        hotelId: hotelIdA,
        name: "Lobby Kiosk #1",
        targetDashboard: "GUEST_DASHBOARD",
        tableId: null,
        supportedFeatures: ["CHECK_IN"],
        save: async () => {},
      };

      let calls = 0;
      KioskDevice.findById = () => {
        calls++;
        if (calls === 1) {
          return Promise.resolve(storedKiosk);
        }
        return {
          populate: () => ({
            populate: () => ({
              lean: async () => ({
                ...storedKiosk,
                hotelId: hotelIdB,
                targetDashboard: "DIGITAL_MENU",
                tableId: { _id: tableId1, tableNumber: "12" },
                supportedFeatures: ["CHECK_IN", "DIGITAL_MENU"],
              }),
            }),
          }),
        };
      };

      const req = {
        params: { id: kioskId1.toString() },
        user: { role: "SUPER_ADMIN" },
        body: {
          hotelId: hotelIdB.toString(),
          targetDashboard: "DIGITAL_MENU",
          tableId: tableId1.toString(),
          supportedFeatures: ["CHECK_IN", "DIGITAL_MENU"],
        },
      };
      const res = createMockResponse();

      await updateKioskDevice(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(
        res.body.data.assignedUrl,
        `${env.frontendUrls.tableOrder}/${hotelIdB}/table/${tableId1}/menu`,
      );
    });
  });

  describe("Table Query Filtering (getTables)", () => {
    it("allows Super Admin to query tables filtered by hotelId query parameter", async () => {
      let capturedFilter = null;
      Table.find = (filter) => {
        capturedFilter = filter;
        return {
          sort: () => [
            {
              _id: tableId1,
              tableNumber: "5",
              seats: 4,
              section: "Terrace",
              status: "AVAILABLE",
              hotelId: hotelIdA,
            },
          ],
        };
      };

      const req = {
        user: { role: "SUPER_ADMIN" },
        query: { hotelId: hotelIdA.toString() },
      };
      const res = createMockResponse();

      await getTables(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(capturedFilter.hotelId, hotelIdA.toString());
      assert.equal(res.body.data.length, 1);
      assert.equal(res.body.data[0].tableNumber, "5");
    });
  });
});

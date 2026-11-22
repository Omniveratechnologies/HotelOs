import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateDistanceMeters } from "./geo.js";

describe("calculateDistanceMeters", () => {
  it("calculates distance between identical points as 0", () => {
    const dist = calculateDistanceMeters(28.6139, 77.209, 28.6139, 77.209);
    assert.equal(Math.round(dist), 0);
  });

  it("calculates accurate distance between known coordinates", () => {
    // New Delhi (28.6139, 77.2090) to Mumbai (19.0760, 72.8777) ~ 1148 km
    const dist = calculateDistanceMeters(28.6139, 77.209, 19.076, 72.8777);
    const distKm = Math.round(dist / 1000);
    assert.ok(
      distKm >= 1140 && distKm <= 1160,
      `Expected ~1148 km, got ${distKm} km`,
    );
  });

  it("calculates proximity correctly for small radius within 50 metres", () => {
    // 0.0003 degrees latitude difference ~ 33.3 metres
    const lat1 = 28.6139;
    const lon1 = 77.209;
    const lat2 = 28.6142;
    const lon2 = 77.209;
    const dist = calculateDistanceMeters(lat1, lon1, lat2, lon2);
    assert.ok(dist > 30 && dist < 36, `Expected ~33.3 metres, got ${dist}`);
  });

  it("throws TypeError if coordinate is not a valid number", () => {
    assert.throws(
      () => calculateDistanceMeters("28.6", 77.2, 28.6, 77.2),
      TypeError,
    );
    assert.throws(
      () => calculateDistanceMeters(NaN, 77.2, 28.6, 77.2),
      TypeError,
    );
  });
});

/**
 * HotelOS Load Tests using k6
 * Tests critical endpoints under load
 * Run with: k6 run load-tests/hotelos-load-test.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// Custom metrics
const loginErrors = new Rate("login_errors");
const bookingErrors = new Rate("booking_errors");
const checkinErrors = new Rate("checkin_errors");
const loginDuration = new Trend("login_duration");
const bookingDuration = new Trend("booking_duration");
const checkinDuration = new Trend("checkin_duration");
const totalRequests = new Counter("total_requests");

// Test configuration
export const options = {
  stages: [
    // Ramp up
    { duration: "30s", target: 10 },
    { duration: "1m", target: 25 },
    { duration: "2m", target: 50 },
    { duration: "1m", target: 25 },
    { duration: "30s", target: 10 },
    // Stress test
    { duration: "30s", target: 100 },
    { duration: "1m", target: 100 },
    // Ramp down
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000", "p(99)<5000"],
    http_req_failed: ["rate<0.05"],
    login_duration: ["p(95)<1000"],
    booking_duration: ["p(95)<1500"],
    checkin_duration: ["p(95)<2000"],
    login_errors: ["rate<0.02"],
    booking_errors: ["rate<0.02"],
    checkin_errors: ["rate<0.02"],
  },
};

// Base URL from environment or default
const BASE_URL = __ENV.API_URL || "http://localhost:5001";
const API_VERSION = "/api/v1";

// Test data
const testUsers = [
  { username: "loadtest1", password: "LoadTest123!" },
  { username: "loadtest2", password: "LoadTest123!" },
  { username: "loadtest3", password: "LoadTest123!" },
];

let authTokens = [];

export function setup() {
  // Pre-create test users or login to get tokens
  // In real scenario, these would be pre-created
  const users = [];
  for (const user of testUsers) {
    const res = http.post(
      `${BASE_URL}${API_VERSION}/auth/login`,
      JSON.stringify({
        username: user.username,
        password: user.password,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    if (res.status === 200) {
      const data = res.json();
      if (data.success && data.data?.token) {
        users.push({ token: data.data.token, user: data.data.user });
      }
    }
  }

  return { users };
}

export default function (data) {
  const user = data.users[Math.floor(Math.random() * data.users.length)];
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token}`,
  };

  // Test 1: Login (unauthenticated)
  loginTest();

  // Test 2: Authenticated endpoints
  if (user?.token) {
    authenticatedTests(user.token, headers);
  }

  sleep(Math.random() * 2 + 1); // 1-3 seconds between iterations
}

function loginTest() {
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  const startTime = new Date();

  const res = http.post(
    `${BASE_URL}${API_VERSION}/auth/login`,
    JSON.stringify({
      username: user.username,
      password: user.password,
    }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { endpoint: "login" },
    },
  );

  const duration = new Date() - startTime;
  loginDuration.add(duration);

  const success = check(res, {
    "login status 200": (r) => r.status === 200,
    "login has token": (r) => {
      try {
        const data = r.json();
        return data.success && data.data?.token;
      } catch {
        return false;
      }
    },
  });

  loginErrors.add(!success);
  totalRequests.add(1);
}

function authenticatedTests(token, headers) {
  // Test: Get current user profile
  profileTest(headers);

  // Test: Get hotels list
  hotelsTest(headers);

  // Test: Get bookings
  bookingsTest(headers);

  // Test: Create booking
  createBookingTest(headers);

  // Test: Check-in
  checkInTest(headers);

  // Test: Get dashboard
  dashboardTest(headers);
}

function profileTest(headers) {
  const startTime = new Date();
  const res = http.get(`${BASE_URL}${API_VERSION}/auth/me`, {
    headers,
    tags: { endpoint: "profile" },
  });
  const duration = new Date() - startTime;

  const success = check(res, {
    "profile status 200": (r) => r.status === 200,
    "profile has user": (r) => {
      try {
        return r.json().success === true;
      } catch {
        return false;
      }
    },
  });

  loginErrors.add(!success);
  totalRequests.add(1);
}

function hotelsTest(headers) {
  const startTime = new Date();
  const res = http.get(`${BASE_URL}${API_VERSION}/hotels`, {
    headers,
    tags: { endpoint: "hotels" },
  });
  const duration = new Date() - startTime;

  const success = check(res, {
    "hotels status 200": (r) => r.status === 200,
    "hotels has data": (r) => {
      try {
        const data = r.json();
        return data.success && Array.isArray(data.data);
      } catch {
        return false;
      }
    },
  });

  bookingErrors.add(!success);
  totalRequests.add(1);
}

function bookingsTest(headers) {
  const startTime = new Date();
  const res = http.get(`${BASE_URL}${API_VERSION}/bookings`, {
    headers,
    tags: { endpoint: "bookings" },
  });
  const duration = new Date() - startTime;

  const success = check(res, {
    "bookings status 200": (r) => r.status === 200,
    "bookings has data": (r) => {
      try {
        const data = r.json();
        return data.success;
      } catch {
        return false;
      }
    },
  });

  bookingErrors.add(!success);
  totalRequests.add(1);
}

function createBookingTest(headers) {
  // Only 10% of requests create bookings to avoid overload
  if (Math.random() > 0.1) return;

  const startTime = new Date();
  const payload = JSON.stringify({
    hotelId: "test-hotel-id",
    roomTypeCode: "STD",
    checkIn: new Date(Date.now() + 86400000).toISOString().split("T")[0], // Tomorrow
    checkOut: new Date(Date.now() + 172800000).toISOString().split("T")[0], // Day after
    adults: 2,
    children: 0,
    source: "DIRECT",
  });

  const res = http.post(`${BASE_URL}${API_VERSION}/bookings`, payload, {
    headers: { ...headers, "Content-Type": "application/json" },
    tags: { endpoint: "create-booking" },
  });
  const duration = new Date() - startTime;
  bookingDuration.add(duration);

  const success = check(res, {
    "create booking status 201/400": (r) =>
      r.status === 201 || r.status === 400,
  });

  bookingErrors.add(!success);
  totalRequests.add(1);
}

function checkInTest(headers) {
  const startTime = new Date();
  const res = http.get(`${BASE_URL}${API_VERSION}/check-in/pending`, {
    headers,
    tags: { endpoint: "checkin-pending" },
  });
  const duration = new Date() - startTime;
  checkinDuration.add(duration);

  const success = check(res, {
    "checkin status 200": (r) => r.status === 200,
  });

  checkinErrors.add(!success);
  totalRequests.add(1);
}

function dashboardTest(headers) {
  const startTime = new Date();
  const res = http.get(`${BASE_URL}${API_VERSION}/dashboard/summary`, {
    headers,
    tags: { endpoint: "dashboard" },
  });
  const duration = new Date() - startTime;

  const success = check(res, {
    "dashboard status 200": (r) => r.status === 200,
  });

  bookingErrors.add(!success);
  totalRequests.add(1);
}

export function teardown(data) {
  // Clean up test data if needed
  console.log("Load test completed");
  console.log(`Total requests: ${totalRequests.values.count}`);
}

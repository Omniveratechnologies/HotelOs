import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import compression from "compression";

import logger from "#/utils/logger.js";
import { env } from "#/config/env.js";
import { getConnectionStatus } from "#/config/db.js";
import { redisConnection } from "#/config/redis.js";
import { sanitizeRequest } from "#/shared/middleware/sanitize.middleware.js";
import {
  correlationMiddleware,
  requestLoggingMiddleware,
} from "#/shared/middleware/correlation.middleware.js";
import {
  apiVersionMiddleware,
  getVersionInfo,
} from "#/shared/middleware/version.middleware.js";

import hotelRoutes from "#/modules/hotels/index.js";
import authRoutes from "#/modules/auth/index.js";
import userRoutes from "#/modules/users/index.js";
import inviteRoutes from "#/modules/invites/index.js";
import bookingRoutes from "#/modules/bookings/index.js";
import dashboardRoutes from "#/modules/dashboard/index.js";
import roomRoutes from "#/modules/rooms/index.js";
import guestRoutes from "#/modules/guests/index.js";
import foodItemRoutes from "#/modules/food-items/index.js";
import { orderRouter, kitchenOrdersRouter } from "#/modules/orders/index.js";
import serviceRequestRoutes from "#/modules/service-requests/index.js";
import channelManagerRoutes from "#/modules/channel-manager/index.js";
import {
  checkInRouter,
  publicCheckInRouter,
} from "#/modules/check-ins/index.js";
import ratePlanRoutes from "#/modules/rate-plans/index.js";
import roomTypeRoutes from "#/modules/room-types/index.js";
import inventoryRoutes from "#/modules/inventory/index.js";
import reportRoutes from "#/modules/reports/index.js";
import intelligenceRoutes from "#/modules/intelligence/index.js";
import tableRoutes from "#/modules/tables/routes/table.routes.js";
import menuRoutes from "#/modules/menu/routes/menu.routes.js";
import billingRoutes from "#/modules/billing/routes/billing.routes.js";
import upsellingRoutes from "#/modules/upselling/routes/upselling.routes.js";
import pmsIntegrationRoutes from "#/modules/integrations/routes/pmsIntegration.routes.js";
import corporateCompanyRoutes from "#/modules/corporate-companies/index.js";
import keyCardRoutes from "./modules/key-cards/routes/keyCard.routes.js";
import kioskDeviceRoutes from "./modules/kiosks/routes/kioskDevice.routes.js";
import sessionRoutes from "./modules/sessions/routes/session.routes.js";
import staffManagementRoutes from "#/modules/staff-management/index.js";
import attendanceRoutes from "#/modules/attendance/index.js";
import leaveManagementRoutes from "#/modules/leaveManagement/index.js";
import shiftScheduleRoutes from "#/modules/shift-schedule/index.js";
import holidayRoutes from "#/modules/holiday/index.js";
import staffReportsRoutes from "#/modules/staff-reports/index.js";
import manageStaffDashboardRoutes from "./modules/managestaff-dashboard/index.js";

const app = express();

// API Version middleware (early - before auth)
app.use(apiVersionMiddleware());

// Correlation ID middleware (for request tracing)
app.use(correlationMiddleware());

// Request logging middleware
app.use(requestLoggingMiddleware());

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          ...(env.socketCorsOrigins?.split(",").filter(Boolean) || []),
        ],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

// Structured request logging
app.use(
  pinoHttp({
    logger,
    customLogLevel: (res, err) => {
      if (res.statusCode >= 500 || err) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        query: req.query,
        headers: { "user-agent": req.headers["user-agent"] },
        correlationId: req.correlationId,
      }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  }),
);

// CORS - only allow configured frontend origins
const allowedOrigins = new Set(
  [
    env.frontendUrls.superAdmin,
    env.frontendUrls.subAdmin,
    env.frontendUrls.receptionist,
    env.frontendUrls.kitchen,
    env.frontendUrls.guest,
    env.frontendUrls.selfCheckin,
    env.frontendUrls.tableOrder,
  ].filter(Boolean),
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.has(origin) ||
        (env.nodeEnv === "development" &&
          (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
            /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
            /^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin)))
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// NoSQL injection prevention - sanitize all requests
app.use(sanitizeRequest);

// Compression middleware - compress responses > 1KB
app.use(compression({ threshold: 1024 }));

app.use("/api/v1/tables", tableRoutes);

const healthCheckHandler = (req, res, next) => {
  try {
    const mongoStatus = getConnectionStatus();
    const redisStatus = redisConnection?.status || "disconnected";

    const isHealthy = mongoStatus === "connected" && redisStatus === "ready";

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      message: isHealthy
        ? "HotelOS backend is healthy"
        : "HotelOS backend has degraded dependencies",
      timestamp: new Date().toISOString(),
      version: getVersionInfo(),
      dependencies: {
        mongodb: mongoStatus,
        redis: redisStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

app.get("/api/v1/health", healthCheckHandler);

// Version endpoint
app.get("/api/v1/version", (req, res) => {
  res.json({
    success: true,
    message: "API version information",
    data: getVersionInfo(),
  });
});

app.use("/api/v1/hotels", hotelRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/invites", inviteRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/rooms", roomRoutes);
app.use("/api/v1/guests", guestRoutes);
app.use("/api/v1/food-items", foodItemRoutes);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/service-requests", serviceRequestRoutes);
app.use("/api/kitchen/orders", kitchenOrdersRouter);

app.use("/api/v1/channel-manager", channelManagerRoutes);
app.use("/api/v1/check-in", checkInRouter);
app.use("/api/v1/public/check-in", publicCheckInRouter);
app.use("/api/v1/rate-plans", ratePlanRoutes);
app.use("/api/v1/room-types", roomTypeRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/intelligence", intelligenceRoutes);
app.use("/api/v1/corporate-companies", corporateCompanyRoutes);
app.use("/api/v1/key-cards", keyCardRoutes);
app.use("/api/v1/kiosks", kioskDeviceRoutes);
app.use("/api/v1/sessions", sessionRoutes);

app.use("/api/v1/menu", menuRoutes);
app.use("/api/v1/upselling", upsellingRoutes);
app.use("/api/v1/billing", billingRoutes);
app.use("/api/v1/integrations/pms", pmsIntegrationRoutes);
app.use("/api/v1/staffManagement", staffManagementRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/leaveManagement", leaveManagementRoutes);
app.use("/api/v1/shiftSchedule", shiftScheduleRoutes);
app.use("/api/v1/holidays", holidayRoutes);
app.use("/api/v1/staffReports", staffReportsRoutes);
app.use("/api/v1/manageStaffDashboard", manageStaffDashboardRoutes);

app.use((err, req, res, _next) => {
  logger.error(err, "Unhandled application error");
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

export default app;

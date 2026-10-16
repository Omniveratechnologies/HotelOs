import express from "express";
import cors from "cors";
// import pinoHttp from "pino-http";

import logger from "#/utils/logger.js";

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
import ratePlanRoutes from "#/modules/rate-plans/index.js";
import roomTypeRoutes from "#/modules/room-types/index.js";
import inventoryRoutes from "#/modules/inventory/index.js";
import reportRoutes from "#/modules/reports/index.js";
import tableRoutes from "#/modules/tables/routes/table.routes.js";
import menuRoutes from "#/modules/menu/routes/menu.routes.js";
import billingRoutes from "#/modules/billing/routes/billing.routes.js";
import upsellingRoutes from "#/modules/upselling/routes/upselling.routes.js";
import pmsIntegrationRoutes from "#/modules/integrations/routes/pmsIntegration.routes.js";

const app = express();

// app.use(pinoHttp({ logger }));

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/tables", tableRoutes);

app.get("/api/v1/health", (req, res) => {
  res.json({
    success: true,
    message: "HotelOS backend is running",
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
app.use("/api/v1/rate-plans", ratePlanRoutes);
app.use("/api/v1/room-types", roomTypeRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/v1/reports", reportRoutes);

app.use("/api/v1/menu", menuRoutes);
app.use("/api/v1/upselling", upsellingRoutes);
app.use("/api/v1/billing", billingRoutes);
app.use("/api/v1/integrations/pms", pmsIntegrationRoutes);

app.use((err, req, res, _next) => {
  logger.error(err, "Unhandled application error");
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

export default app;

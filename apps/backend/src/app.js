import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";

import logger from "#src/utils/logger.js";

import hotelRoutes from "#src/modules/hotels/index.js";
import authRoutes from "#src/modules/auth/index.js";
import userRoutes from "#src/modules/users/index.js";
import inviteRoutes from "#src/modules/invites/index.js";
import bookingRoutes from "#src/modules/bookings/index.js";
import dashboardRoutes from "#src/modules/dashboard/index.js";
import roomRoutes from "#src/modules/rooms/index.js";
import guestRoutes from "#src/modules/guests/index.js";
import foodItemRoutes from "#src/modules/food-items/index.js";
import { orderRouter, kitchenOrdersRouter } from "#src/modules/orders/index.js";
import serviceRequestRoutes from "#src/modules/service-requests/index.js";

const app = express();

app.use(pinoHttp({ logger }));

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use((err, req, res, _next) => {
  logger.error(err, "Unhandled application error");
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

export default app;

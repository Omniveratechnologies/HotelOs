import express from "express";
import cors from "cors";

import hotelRoutes from "./modules/hotels/index.js";
import authRoutes from "./modules/auth/index.js";
import userRoutes from "./modules/users/index.js";
import inviteRoutes from "./modules/bookings/index.js";
import dashboardRoutes from "./modules/dashboard/index.js";
import roomRoutes from "./modules/rooms/index.js";
import guestRoutes from "./modules/guests/index.js";
import foodItemRoutes from "./modules/food-items/index.js";
import { orderRouter, kitchenOrdersRouter } from "./modules/orders/index.js";
import serviceRequestRoutes from "./modules/service-requests/index.js";

const app = express();

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
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/rooms", roomRoutes);
app.use("/api/v1/guests", guestRoutes);
app.use("/api/v1/food-items", foodItemRoutes);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/service-requests", serviceRequestRoutes);
app.use("/api/kitchen/orders", kitchenOrdersRouter);

export default app;

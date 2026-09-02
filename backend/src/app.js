import express from "express";
import cors from "cors";


import guestRoutes from "./routes/guest.routes.js";
import foodItemRoutes from "./routes/foodItem.routes.js";
import orderRoutes from "./routes/order.routes.js";
import serviceRequestRoutes from "./routes/serviceRequest.routes.js";

import hotelRoutes from "./routes/hotel.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/v1/health", (req, res) => {
  res.json({
    success: true,
    message: "HotelOS backend is running"
  });
});

app.use("/api/v1/hotels", hotelRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);

app.use("/api/v1/guests", guestRoutes);
app.use("/api/v1/food-items", foodItemRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/service-requests", serviceRequestRoutes);

export default app;
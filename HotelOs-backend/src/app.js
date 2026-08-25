import express from "express";
import cors from "cors";

import hotelRoutes from "./routes/hotel.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import inviteRoutes from "./routes/invite.routes.js";

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
app.use("/api/v1/invites", inviteRoutes);

export default app;
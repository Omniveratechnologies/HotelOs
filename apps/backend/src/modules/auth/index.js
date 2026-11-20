import express from "express";
import authRouter from "./routes/auth.routes.js";
import twoFactorRouter from "./routes/twoFactor.routes.js";

const router = express.Router();

router.use("/auth", authRouter);
router.use("/2fa", twoFactorRouter);

export default router;

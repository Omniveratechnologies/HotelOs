import express from "express";
import authRouter from "./routes/auth.routes.js";
import twoFactorRouter from "./routes/twoFactor.routes.js";

const router = express.Router();

router.use("/2fa", twoFactorRouter);
router.use("/", authRouter);

export default router;

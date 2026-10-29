import express from "express";
import {
  createTable,
  getTables,
  updateTable,
  deleteTable,
  getTableQr,
  getPublicTable,
  resetTable,
} from "../controllers/table.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";

const router = express.Router();

// Public — scanned by guests, no auth
router.get("/public/:hotelId/:tableId", getPublicTable);

// Staff-managed & Super Admin accessible
router.use(
  authenticate,
  authorize("SUPER_ADMIN", "SUB_ADMIN", "KITCHEN", "RECEPTIONIST"),
);
router.get("/", getTables);
router.post("/", createTable);
router.patch("/:id", updateTable);
router.delete("/:id", deleteTable);
router.post("/:id/reset", resetTable);
router.get("/:id/qr", getTableQr);

export default router;

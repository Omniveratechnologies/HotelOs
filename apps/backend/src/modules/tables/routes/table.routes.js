import express from "express";
import {
  createTable,
  getTables,
  updateTable,
  deleteTable,
  getTableQr,
  getPublicTable,
} from "../controllers/table.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";

const router = express.Router();

// Public — scanned by guests, no auth
router.get("/public/:hotelId/:tableId", getPublicTable);

// Staff-managed
router.use(authenticate, authorize("SUB_ADMIN", "KITCHEN", "RECEPTIONIST"));
router.get("/", getTables);
router.post("/", createTable);
router.patch("/:id", updateTable);
router.delete("/:id", deleteTable);
router.get("/:id/qr", getTableQr);

export default router;

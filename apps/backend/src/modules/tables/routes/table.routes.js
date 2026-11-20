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
import { validate } from "#/shared/middleware/validate.middleware.js";
import {
  createTableBodySchema,
  updateTableBodySchema,
  tableIdParamsSchema,
  publicTableParamsSchema,
} from "../schemas.js";

const router = express.Router();

// Public — scanned by guests, no auth
router.get(
  "/public/:hotelId/:tableId",
  validate({ params: publicTableParamsSchema }),
  getPublicTable,
);

// Staff-managed & Super Admin accessible
router.use(
  authenticate,
  authorize("SUPER_ADMIN", "SUB_ADMIN", "KITCHEN", "RECEPTIONIST"),
);
router.get("/", getTables);
router.post("/", validate({ body: createTableBodySchema }), createTable);
router.patch(
  "/:id",
  validate({ params: tableIdParamsSchema, body: updateTableBodySchema }),
  updateTable,
);
router.delete("/:id", validate({ params: tableIdParamsSchema }), deleteTable);
router.post(
  "/:id/reset",
  validate({ params: tableIdParamsSchema }),
  resetTable,
);
router.get("/:id/qr", validate({ params: tableIdParamsSchema }), getTableQr);

export default router;

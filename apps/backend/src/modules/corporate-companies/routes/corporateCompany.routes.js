import { Router } from "express";
import {
  getCorporateCompanies,
  getCorporateCompany,
  createCorporateCompany,
  updateCorporateCompany,
  deleteCorporateCompany,
} from "../controllers/corporateCompany.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";

export const corporateCompanyRouter = Router();
corporateCompanyRouter.use(
  authenticate,
  authorize("SUB_ADMIN", "RECEPTIONIST"),
);

corporateCompanyRouter.get("/", getCorporateCompanies);
corporateCompanyRouter.post("/", createCorporateCompany);
corporateCompanyRouter.get("/:id", getCorporateCompany);
corporateCompanyRouter.patch("/:id", updateCorporateCompany);
corporateCompanyRouter.delete("/:id", deleteCorporateCompany);

export default corporateCompanyRouter;

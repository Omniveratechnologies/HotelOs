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
import { validate } from "#/shared/middleware/validate.middleware.js";
import {
  createCorporateCompanyBodySchema,
  updateCorporateCompanyBodySchema,
  getCorporateCompaniesQuerySchema,
  corporateCompanyIdParamsSchema,
} from "../schemas.js";

export const corporateCompanyRouter = Router();
corporateCompanyRouter.use(
  authenticate,
  authorize("SUB_ADMIN", "RECEPTIONIST"),
);

corporateCompanyRouter.get(
  "/",
  validate({ query: getCorporateCompaniesQuerySchema }),
  getCorporateCompanies,
);
corporateCompanyRouter.post(
  "/",
  validate({ body: createCorporateCompanyBodySchema }),
  createCorporateCompany,
);
corporateCompanyRouter.get(
  "/:id",
  validate({ params: corporateCompanyIdParamsSchema }),
  getCorporateCompany,
);
corporateCompanyRouter.patch(
  "/:id",
  validate({
    params: corporateCompanyIdParamsSchema,
    body: updateCorporateCompanyBodySchema,
  }),
  updateCorporateCompany,
);
corporateCompanyRouter.delete(
  "/:id",
  validate({ params: corporateCompanyIdParamsSchema }),
  deleteCorporateCompany,
);

export default corporateCompanyRouter;

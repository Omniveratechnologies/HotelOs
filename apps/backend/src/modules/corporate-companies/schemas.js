import { z } from "zod";

const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// =====================================================
// CORPORATE COMPANY SCHEMAS
// =====================================================

export const createCorporateCompanyBodySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  code: z.string().min(1, "Company code is required"),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  creditLimit: z.number().nonnegative().default(0),
  paymentTerms: z.number().int().nonnegative().default(30),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  notes: z.string().optional(),
});

export const updateCorporateCompanyBodySchema = z
  .object({
    name: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    contactPerson: z.string().optional(),
    email: z.string().email("Invalid email").optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().optional(),
    gstin: z.string().optional(),
    pan: z.string().optional(),
    creditLimit: z.number().nonnegative().optional(),
    paymentTerms: z.number().int().nonnegative().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    notes: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const getCorporateCompaniesQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// =====================================================
// PARAMS SCHEMAS
// =====================================================

export const corporateCompanyIdParamsSchema = z.object({
  id: mongoIdSchema,
});

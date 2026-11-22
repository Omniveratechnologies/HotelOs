import { z } from "zod";

const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");
const GUEST_ID_TYPES = [
  "Aadhaar",
  "Passport",
  "Driving License",
  "Voter ID",
  "Other",
];

// =====================================================
// GUEST UPDATE
// =====================================================

export const updateGuestBodySchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  email: z.string().email("Invalid email").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  idType: z.enum(GUEST_ID_TYPES).optional(),
  idNumber: z.string().optional(),
  nationality: z.string().optional(),
  documents: z
    .array(
      z.object({
        docType: z.enum(GUEST_ID_TYPES).optional(),
        filename: z.string(),
        key: z.string(),
        mimeType: z.string(),
        size: z.number().positive(),
      }),
    )
    .optional(),
});

// =====================================================
// GUEST CREDENTIALS UPDATE
// =====================================================

export const updateGuestCredentialsBodySchema = z
  .object({
    action: z.enum(["regenerate", "set"]).default("set"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .optional(),
    reveal: z.boolean().optional(),
  })
  .refine((data) => data.action === "regenerate" || data.password, {
    message: "Password is required when action is 'set'",
    path: ["password"],
  });

// =====================================================
// UPDATE DND
// =====================================================

export const updateDNDBodySchema = z.object({
  enabled: z.boolean(),
});

// =====================================================
// DOCUMENT UPLOAD URLS
// =====================================================

const documentFileSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().positive(),
  docType: z.enum(GUEST_ID_TYPES).optional(),
});

export const getDocumentUploadUrlsBodySchema = z.object({
  files: z.array(documentFileSchema).min(1).max(10),
});

// =====================================================
// SEARCH GUESTS
// =====================================================

export const searchGuestsQuerySchema = z.object({
  q: z.string().optional(),
});

// =====================================================
// GET GUESTS
// =====================================================

export const getGuestsQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

// =====================================================
// PARAMS SCHEMAS
// =====================================================

export const guestIdParamsSchema = z.object({
  id: mongoIdSchema,
});

export const guestDocumentParamsSchema = z.object({
  guestId: mongoIdSchema,
  docId: mongoIdSchema,
});

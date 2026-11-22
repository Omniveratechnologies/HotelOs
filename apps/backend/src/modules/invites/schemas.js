import { z } from "zod";

const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// =====================================================
// SEND INVITATION
// =====================================================

export const sendInviteBodySchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    username: z.string().min(1, "Username is required"),
    email: z.string().email("Invalid email"),
    role: z.enum(["SUB_ADMIN", "RECEPTIONIST", "KITCHEN"]),
    hotelId: mongoIdSchema.optional(),
  })
  .refine(
    (data) => {
      // If role is SUB_ADMIN, hotelId is required
      if (data.role === "SUB_ADMIN") {
        return data.hotelId !== undefined;
      }
      return true;
    },
    {
      message: "hotelId is required when inviting a Sub Admin",
      path: ["hotelId"],
    },
  );

// =====================================================
// VERIFY INVITATION
// =====================================================

export const verifyInviteBodySchema = z.object({
  token: z.string().min(1, "Invitation token is required"),
});

// =====================================================
// ACCEPT INVITATION
// =====================================================

export const acceptInviteBodySchema = z.object({
  token: z.string().min(1, "Invitation token is required"),
  name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

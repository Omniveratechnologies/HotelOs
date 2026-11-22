import { z } from "zod";

export const staffSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Full name is required.")
      .max(120, "Name cannot exceed 120 characters."),
    dob: z.string().optional(),
    phone: z
      .string()
      .trim()
      .min(1, "Phone number is required.")
      .regex(/^[0-9+()\-\s]{7,20}$/, "Enter a valid phone number."),
    email: z
      .union([z.string().trim().email("Enter a valid email."), z.literal("")])
      .optional(),
    address: z.string().optional(),
    govIdType: z.string().optional(),
    govIdNumber: z.string().optional(),
    // departmentId: z.string().min(1, "Select a department."),
    // designationId: z.string().min(1, "Select a designation."),
    shiftId: z.string().optional(),
    managerId: z.string().optional(),
    employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]),
    status: z.enum(["ACTIVE", "INACTIVE"]),
    joinedOn: z.string().min(1, "Joining date is required."),
  })
  .superRefine((data, ctx) => {
    if (data.dob) {
      const dob = new Date(`${data.dob}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (Number.isNaN(dob.getTime()) || dob > today) {
        ctx.addIssue({
          code: "custom",
          path: ["dob"],
          message: "Date of birth cannot be in the future.",
        });
      }
    }

    if (data.govIdNumber?.trim() && !data.govIdType) {
      ctx.addIssue({
        code: "custom",
        path: ["govIdType"],
        message: "Select a government ID type.",
      });
    }
  });

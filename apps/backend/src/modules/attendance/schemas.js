import { z } from "zod";

const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// =====================================================
// ATTENDANCE SCHEMAS
// =====================================================

export const listAttendanceQuerySchema = z.object({
  staff_id: mongoIdSchema.optional(),
  date_from: z.string().datetime({ offset: true }).optional(),
  date_to: z.string().datetime({ offset: true }).optional(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "ON_LEAVE"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createAttendanceBodySchema = z.object({
  staffId: mongoIdSchema,
  date: z.string().datetime({ offset: true }),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "ON_LEAVE"]),
  checkIn: z.string().datetime({ offset: true }).optional(),
  checkOut: z.string().datetime({ offset: true }).optional(),
  deviceId: mongoIdSchema.optional(),
  notes: z.string().optional(),
});

export const correctAttendanceBodySchema = z
  .object({
    status: z.enum(["PRESENT", "ABSENT", "LATE", "ON_LEAVE"]).optional(),
    checkIn: z.string().datetime({ offset: true }).nullable().optional(),
    checkOut: z.string().datetime({ offset: true }).nullable().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const checkInBodySchema = z.object({
  staffId: mongoIdSchema.optional(),
  deviceId: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const checkOutBodySchema = z.object({
  staffId: mongoIdSchema.optional(),
  deviceId: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const closeDayBodySchema = z.object({
  date: z.string().datetime({ offset: true }).optional(),
});

export const attendanceStatsQuerySchema = z.object({
  date_from: z.string().datetime({ offset: true }).optional(),
  date_to: z.string().datetime({ offset: true }).optional(),
  department_id: mongoIdSchema.optional(),
});

export const attendanceTrendQuerySchema = z.object({
  date_from: z.string().datetime({ offset: true }).optional(),
  date_to: z.string().datetime({ offset: true }).optional(),
});

export const attendanceActivityQuerySchema = z.object({
  date_from: z.string().datetime({ offset: true }).optional(),
  date_to: z.string().datetime({ offset: true }).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const exportAttendanceQuerySchema = z.object({
  date_from: z.string().datetime({ offset: true }).optional(),
  date_to: z.string().datetime({ offset: true }).optional(),
  staff_id: mongoIdSchema.optional(),
});

// =====================================================
// DEVICE SCHEMAS
// =====================================================

const ipRegex =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export const createDeviceBodySchema = z.object({
  deviceId: z.string().min(1, "Device ID is required"),
  name: z.string().min(1, "Device name is required"),
  type: z.enum(["FINGERPRINT", "FACE", "RFID", "PIN", "QR"]),
  location: z.string().optional(),
  ipAddress: z.string().regex(ipRegex, "Invalid IP address").optional(),
  port: z.number().int().positive().max(65535).optional(),
});

export const updateDeviceBodySchema = z
  .object({
    name: z.string().min(1).optional(),
    type: z.enum(["FINGERPRINT", "FACE", "RFID", "PIN", "QR"]).optional(),
    location: z.string().optional(),
    ipAddress: z.string().regex(ipRegex, "Invalid IP address").optional(),
    port: z.number().int().positive().max(65535).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const deviceHeartbeatBodySchema = z.object({
  deviceId: z.string().min(1, "Device ID is required"),
  timestamp: z.string().datetime({ offset: true }).optional(),
  status: z.enum(["ONLINE", "OFFLINE", "ERROR"]).optional(),
});

export const syncAllDevicesBodySchema = z.object({});

export const regenerateDeviceTokenBodySchema = z.object({});

export const createDeviceCommandBodySchema = z.object({
  command: z.enum(["REBOOT", "SYNC", "UPDATE_FIRMWARE", "CLEAR_LOGS"]),
  payload: z.record(z.unknown()).optional(),
});

export const ackDeviceCommandBodySchema = z.object({
  status: z.enum(["SUCCESS", "FAILED"]),
  output: z.string().optional(),
});

export const deviceSummaryQuerySchema = z.object({});

export const deviceStatsQuerySchema = z.object({
  date_from: z.string().datetime({ offset: true }).optional(),
  date_to: z.string().datetime({ offset: true }).optional(),
});

export const deviceMapQuerySchema = z.object({});

export const deviceActivityQuerySchema = z.object({
  date_from: z.string().datetime({ offset: true }).optional(),
  date_to: z.string().datetime({ offset: true }).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// =====================================================
// PARAMS SCHEMAS
// =====================================================

export const attendanceIdParamsSchema = z.object({
  id: mongoIdSchema,
});

export const deviceIdParamsSchema = z.object({
  id: mongoIdSchema,
});

export const deviceCommandIdParamsSchema = z.object({
  id: mongoIdSchema,
  commandId: mongoIdSchema,
});

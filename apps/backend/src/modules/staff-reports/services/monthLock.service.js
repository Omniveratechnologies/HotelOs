import { MonthlyStaffSummary } from "../models/monthlyStaffSummary.js";
import { ApiError } from "../../../utils/http.js";

const monthOf = (date) => String(date).slice(0, 7);

export const isMonthLocked = async (hotelId, month) =>
  Boolean(await MonthlyStaffSummary.exists({ hotelId, month, locked: true }));

export const assertMonthOpen = async (hotelId, date) => {
  const month = monthOf(date);
  if (await isMonthLocked(hotelId, month)) {
    throw new ApiError(
      409,
      `Attendance for ${month} is locked for payroll. Unlock the month before changing it.`,
    );
  }
};

export const markMonthStale = (hotelId, date) =>
  MonthlyStaffSummary.updateMany(
    { hotelId, month: monthOf(date), locked: { $ne: true } },
    { $set: { stale: true } },
  )
    .exec()
    .catch((err) =>
      console.error(
        "[reports] could not mark the monthly summary stale:",
        err.message,
      ),
    );

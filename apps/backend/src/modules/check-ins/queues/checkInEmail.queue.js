import { Queue } from "bullmq";
import redisConnection from "#/config/redis.js";
import Hotel from "#/modules/hotels/models/Hotel.js";
import Booking from "#/modules/bookings/models/Booking.js";
import logger from "#/utils/logger.js";

export const CHECK_IN_EMAIL_QUEUE_NAME = "check-in-email";

export const checkInEmailQueue = new Queue(CHECK_IN_EMAIL_QUEUE_NAME, {
  connection: redisConnection,
});

/**
 * Calculates milliseconds delay until 2 hours before the hotel check-in time on arrival day.
 * Returns null if the booking check-out has already passed.
 * Returns 0 if scheduled time is reached or past, but stay is active today.
 */
export function calculateCheckInReminderDelay(
  checkInDate,
  checkInTimeStr = "14:00",
) {
  const checkIn = new Date(checkInDate);
  if (Number.isNaN(checkIn.getTime())) return null;

  const [hoursStr, minutesStr] = String(checkInTimeStr || "14:00").split(":");
  const hours = Number.parseInt(hoursStr, 10) || 14;
  const minutes = Number.parseInt(minutesStr, 10) || 0;

  // Combine arrival date with hotel's default check-in time
  const scheduledTime = new Date(checkIn);
  scheduledTime.setHours(hours, minutes, 0, 0);

  // Scheduled time is 2 hours before check-in time
  scheduledTime.setTime(scheduledTime.getTime() - 2 * 60 * 60 * 1000);

  const now = Date.now();
  const delay = scheduledTime.getTime() - now;

  // If already past the scheduled time
  if (delay <= 0) {
    // If arrival was today or upcoming within the active stay, send immediately (delay 0)
    const endOfArrivalDay = new Date(checkIn);
    endOfArrivalDay.setHours(23, 59, 59, 999);
    if (now <= endOfArrivalDay.getTime()) {
      return 0;
    }
    // Past arrival day
    return null;
  }

  return delay;
}

/**
 * Schedules a delayed email reminder for a booking in BullMQ.
 * Uses deterministic jobId to prevent duplicates and enable clean reschedules on date changes.
 */
export async function scheduleCheckInReminder(booking) {
  try {
    if (!booking?._id || !booking.hotelId || !booking.checkIn) {
      return;
    }

    const eligibleStatuses = ["confirmed", "reserved"];
    if (!eligibleStatuses.includes(booking.status)) {
      return;
    }

    const hotel = await Hotel.findById(booking.hotelId)
      .select("checkInTime name")
      .lean();
    const checkInTime = hotel?.checkInTime || "14:00";

    const delay = calculateCheckInReminderDelay(booking.checkIn, checkInTime);
    if (delay === null) {
      logger.debug(
        { bookingId: booking._id },
        "Check-in reminder skipped: booking arrival date is in the past",
      );
      return;
    }

    const jobId = `checkin-reminder-${booking._id.toString()}`;

    // Remove existing delayed job if rescheduling date/time
    const existingJob = await checkInEmailQueue.getJob(jobId);
    if (existingJob) {
      await existingJob.remove();
    }

    await checkInEmailQueue.add(
      "send-checkin-reminder",
      { bookingId: booking._id.toString() },
      {
        jobId,
        delay,
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    logger.info(
      {
        bookingId: booking._id,
        jobId,
        delayHours: (delay / (1000 * 60 * 60)).toFixed(2),
      },
      "Check-in reminder email job scheduled in BullMQ",
    );
  } catch (error) {
    logger.error(
      { error, bookingId: booking?._id },
      "Failed to schedule check-in reminder job",
    );
  }
}

/**
 * Cancels a scheduled check-in email reminder job (e.g. on cancellation or early check-in).
 */
export async function cancelCheckInReminder(bookingId) {
  try {
    if (!bookingId) return;
    const jobId = `checkin-reminder-${bookingId.toString()}`;
    const existingJob = await checkInEmailQueue.getJob(jobId);
    if (existingJob) {
      await existingJob.remove();
      logger.info({ jobId }, "Cancelled scheduled check-in reminder job");
    }
  } catch (error) {
    logger.error(
      { error, bookingId },
      "Failed to cancel check-in reminder job",
    );
  }
}

/**
 * Startup Reconciler:
 * Scans MongoDB for upcoming active bookings and ensures a delayed job is registered in Redis.
 * Guarantees zero schedule loss across server restarts and crashes.
 */
export async function reconcileCheckInReminders() {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const upcomingBookings = await Booking.find({
      status: { $in: ["confirmed", "reserved"] },
      checkIn: { $gte: startOfToday },
    }).select("_id hotelId checkIn checkOut status");

    logger.info(
      { count: upcomingBookings.length },
      "Reconciling check-in reminder schedules from MongoDB...",
    );

    await Promise.all(upcomingBookings.map((b) => scheduleCheckInReminder(b)));

    logger.info("Check-in reminder schedules reconciled successfully");
  } catch (error) {
    logger.error({ error }, "Error reconciling check-in reminder schedules");
  }
}

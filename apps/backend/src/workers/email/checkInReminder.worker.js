import { Worker } from "bullmq";
import redisConnection from "#/config/redis.js";
import { CHECK_IN_EMAIL_QUEUE_NAME } from "#/modules/check-ins/queues/checkInEmail.queue.js";
// Pre-register referenced models required by Booking.populate("guestId").populate("hotelId")
import "#/modules/users/models/User.js";
import "#/modules/hotels/models/Hotel.js";
import Booking from "#/modules/bookings/models/Booking.js";
import CheckInSession from "#/modules/check-ins/models/CheckInSession.js";
import { createSessionToken } from "#/modules/check-ins/services/token.service.js";
import { sendCheckInEmail } from "#/shared/services/email.service.js";
import env from "#/config/env.js";
import logger from "#/utils/logger.js";

function expiresAtFor(reservation) {
  const expiresAt = new Date(reservation.checkOut);
  expiresAt.setHours(23, 59, 59, 999);
  return expiresAt;
}

/**
 * Processor for "check-in-email" queue jobs.
 */
export async function processCheckInReminderJob(job) {
  const { bookingId } = job.data;
  logger.info(
    { bookingId, jobId: job.id, attempt: job.attemptsMade + 1 },
    "Processing check-in reminder job",
  );

  const booking = await Booking.findById(bookingId)
    .populate("guestId", "name email phone")
    .populate("hotelId", "name checkInTime");

  if (!booking) {
    logger.warn(
      { bookingId },
      "Booking no longer exists, discarding reminder job",
    );
    return { skipped: true, reason: "booking_not_found" };
  }

  const eligibleStatuses = ["confirmed", "reserved"];
  if (!eligibleStatuses.includes(booking.status)) {
    logger.info(
      { bookingId, status: booking.status },
      "Booking status is not confirmed/reserved, skipping reminder",
    );
    return { skipped: true, reason: `status_${booking.status}` };
  }

  const guestEmail = booking.guestId?.email;
  if (!guestEmail) {
    logger.warn(
      { bookingId },
      "Guest has no email address associated, cannot send check-in email",
    );
    return { skipped: true, reason: "no_guest_email" };
  }

  // Find or create check-in session
  let session = await CheckInSession.findOne({ reservationId: booking._id });
  const { token, tokenHash } = createSessionToken();

  if (session) {
    // If guest already submitted or completed check-in, do not send reminder
    if (["submitted", "approved", "completed"].includes(session.status)) {
      logger.info(
        { bookingId, sessionStatus: session.status },
        "Session already submitted or approved, skipping",
      );
      return { skipped: true, reason: "session_already_submitted" };
    }
    // Update existing session with fresh tokenHash and status
    session.tokenHash = tokenHash;
    session.status = "link-sent";
    session.sentAt = new Date();
  } else {
    session = new CheckInSession({
      hotelId: booking.hotelId._id,
      reservationId: booking._id,
      tokenHash,
      expiresAt: expiresAtFor(booking),
      status: "link-sent",
      sentVia: "EMAIL",
      sentAt: new Date(),
    });
  }

  const checkInUrl = `${env.frontendUrls.selfCheckin}/check-in/${token}`;
  const hotelName = booking.hotelId?.name || "the hotel";
  const guestName = booking.guestId?.name || "Guest";
  const checkInTime = booking.hotelId?.checkInTime;
  const timeNote = checkInTime ? ` Check-in begins at ${checkInTime}.` : "";

  // Dispatch email (will throw if SMTP fails, triggering BullMQ exponential retry)
  await sendCheckInEmail({
    email: guestEmail,
    name: guestName,
    hotelName,
    subject: `Complete your online check-in - ${hotelName}`,
    heading: "Your stay begins today!",
    body: `Your room at ${hotelName} is getting ready.${timeNote} Complete your digital check-in now to skip the front desk line and enjoy instant room access.`,
    actionUrl: checkInUrl,
    actionLabel: "Start Self Check-In",
  });

  session.auditTrail.push({
    action: "reminder-sent",
    note: `Automated check-in reminder dispatched via BullMQ worker (Attempt ${job.attemptsMade + 1})`,
  });

  await session.save();

  logger.info(
    { bookingId, guestEmail, sessionId: session._id },
    "Check-in reminder email sent successfully",
  );

  return { success: true, bookingId, guestEmail, sessionId: session._id };
}

/**
 * Initializes and starts the BullMQ Worker for check-in emails.
 */
export function initCheckInReminderWorker() {
  const worker = new Worker(
    CHECK_IN_EMAIL_QUEUE_NAME,
    processCheckInReminderJob,
    {
      connection: redisConnection,
      concurrency: 5,
    },
  );

  worker.on("completed", (job, result) => {
    logger.info(
      { jobId: job.id, result },
      "Check-in email worker job completed",
    );
  });

  worker.on("failed", (job, error) => {
    logger.error(
      {
        jobId: job?.id,
        attemptsMade: job?.attemptsMade,
        maxAttempts: job?.opts?.attempts,
        error: error?.message || error,
      },
      "Check-in email worker job failed (retry scheduled if attempts remain)",
    );
  });

  worker.on("error", (error) => {
    logger.error(
      { error: error?.message || error },
      "Check-in email worker internal error",
    );
  });

  return worker;
}

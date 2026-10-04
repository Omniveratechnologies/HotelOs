import Booking from "#/modules/bookings/models/Booking.js";
import Hotel from "#/modules/hotels/models/Hotel.js";
import CheckInSession, { CHECKIN_STATUSES } from "../models/CheckInSession.js";
import { checkInSessionDTO } from "../dto/checkIn.dto.js";
import { createSessionToken, hashToken } from "../services/token.service.js";
import { sendCheckInEmail } from "#/shared/services/email.service.js";
import logger from "#/utils/logger.js";

// Receptionist-facing digital check-in link management + review.

const BOOKABLE_STATUSES = new Set([
  "confirmed",
  "reserved",
  "pending",
  "checked-in",
]);

function buildCheckInUrl(token) {
  // Guest self check-in lives in the receptionist app (public route).
  const base = (
    process.env.RECEPTIONIST_FRONTEND_URL ||
    process.env.CLIENT_URL ||
    "http://localhost:5175"
  ).replace(/\/$/, "");
  return `${base}/check-in/${token}`;
}

function expiresAtFor(reservation) {
  // The link stays valid until the end of the check-out day.
  const expiresAt = new Date(reservation.checkOut);
  expiresAt.setHours(23, 59, 59, 999);
  return expiresAt;
}

async function loadReservation(req, id) {
  return Booking.findOne({ _id: id, hotelId: req.user.hotelId })
    .populate("guestId", "name email phone nationality")
    .populate("roomId", "roomNumber type roomCode");
}

// =====================================================
// SEND CHECK-IN LINK
// =====================================================

export const createCheckInLink = async (req, res) => {
  try {
    const { reservationId, message } = req.body;

    const reservation = await loadReservation(req, reservationId);
    if (!reservation) {
      return res
        .status(404)
        .json({ success: false, message: "Reservation not found" });
    }

    if (!BOOKABLE_STATUSES.has(reservation.status)) {
      return res.status(409).json({
        success: false,
        message: `Check-in links can only be sent for active reservations (current: ${reservation.status})`,
      });
    }

    const guestEmail =
      reservation.guestId?.email || reservation.populated("guestId")?.email;
    if (!guestEmail) {
      return res.status(400).json({
        success: false,
        message:
          "Notification could not be shared — the reservation has no email on file",
      });
    }

    // Reuse an open session for the same reservation, else create one.
    let session = await CheckInSession.findOne({
      reservationId: reservation._id,
      status: { $in: ["link-sent", "in-progress", "correction-requested"] },
    });

    const { token, tokenHash } = createSessionToken();
    const expiresAt = expiresAtFor(reservation);

    if (session) {
      session.tokenHash = tokenHash;
      session.expiresAt = expiresAt;
      session.sentAt = new Date();
      if (session.status !== "correction-requested") {
        session.status = "link-sent";
      }
      session.auditTrail.push({
        by: req.user._id,
        action: "link-resend",
        note: "Link re-sent by receptionist",
      });
      await session.save();
    } else {
      session = await CheckInSession.create({
        hotelId: req.user.hotelId,
        reservationId: reservation._id,
        tokenHash,
        expiresAt,
        status: "link-sent",
        sentVia: "EMAIL",
        sentAt: new Date(),
        auditTrail: [
          { by: req.user._id, action: "link-sent", note: "Check-in link sent" },
        ],
      });
    }

    const hotel = await Hotel.findById(req.user.hotelId).select("name").lean();

    const url = buildCheckInUrl(token);
    let emailSent = true;
    try {
      await sendCheckInEmail({
        email: guestEmail,
        name: reservation.guestId?.name || "Guest",
        hotelName: hotel?.name || "HotelOS",
        subject: "Complete your online check-in",
        heading: "Complete your check-in online",
        body:
          message?.trim() ||
          "Please complete your check-in online before arrival to skip the queue.",
        actionUrl: url,
        actionLabel: "Start Check-in",
      });
    } catch (error) {
      logger.error(error, "Check-in link email failed");
      emailSent = false;
    }

    return res.status(session ? 200 : 201).json({
      success: true,
      message: emailSent
        ? "Check-in link sent"
        : "Check-in link created, but the email could not be sent",
      data: {
        ...(await checkInSessionDTO(
          await session.populate([
            { path: "reservationId", populate: ["guestId", "roomId"] },
          ]),
        )),
        link: url,
        emailSent,
      },
    });
  } catch (error) {
    logger.error(error, "Create Check-in Link Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to create check-in link" });
  }
};

// =====================================================
// LIST SESSIONS (filters, tabs, KPIs)
// =====================================================

export const getCheckInSessions = async (req, res) => {
  try {
    const { status, q, from, to, page = 1, limit = 20 } = req.query;
    const filter = { hotelId: req.user.hotelId };

    if (status && CHECKIN_STATUSES.includes(status)) {
      filter.status = status;
    }

    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;
    if (fromDate || toDate) {
      filter.sentAt = {
        ...(fromDate ? { $gte: fromDate } : {}),
        ...(toDate ? { $lte: toDate } : {}),
      };
    }

    if (q?.trim()) {
      const searchReservations = await Booking.find({
        hotelId: req.user.hotelId,
        $or: [
          { reservationNo: new RegExp(q.trim(), "i") },
          { roomTypeCode: new RegExp(q.trim(), "i") },
        ],
      })
        .select("_id")
        .limit(200)
        .lean();

      const rx = new RegExp(
        q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
      const searchGuests = await Booking.find({
        hotelId: req.user.hotelId,
      })
        .populate({
          path: "guestId",
          match: { $or: [{ name: rx }, { phone: rx }, { email: rx }] },
          select: "_id",
        })
        .select("_id guestId")
        .limit(200);

      const byGuest = searchGuests.filter((b) => b.guestId).map((b) => b._id);
      const ids = [
        ...new Set([...searchReservations.map((b) => b._id), ...byGuest]),
      ];
      filter.reservationId = { $in: ids.length ? ids : [null] };
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [sessions, total, kpis] = await Promise.all([
      CheckInSession.find(filter)
        .populate({
          path: "reservationId",
          select:
            "reservationNo source status checkIn checkOut roomTypeCode roomId adults children infants",
          populate: [
            { path: "guestId", select: "name email phone nationality" },
            { path: "roomId", select: "roomNumber type" },
          ],
        })
        .populate("review.reviewedBy", "name")
        .sort({ sentAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      CheckInSession.countDocuments(filter),
      CheckInSession.aggregate([
        { $match: { hotelId: req.user.hotelId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const sentToday = await CheckInSession.countDocuments({
      hotelId: req.user.hotelId,
      sentAt: { $gte: startOfToday },
    });

    const statusMap = Object.fromEntries(kpis.map((k) => [k._id, k.count]));

    return res.status(200).json({
      success: true,
      message: "Check-in sessions fetched",
      data: {
        sessions: await Promise.all(sessions.map(checkInSessionDTO)),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum) || 1,
        },
        stats: {
          sentToday,
          submitted:
            (statusMap.submitted || 0) +
            (statusMap.approved || 0) +
            (statusMap["correction-requested"] || 0),
          pendingVerification: statusMap.submitted || 0,
          approved: statusMap.approved || 0,
          rejected: statusMap.rejected || 0,
          expired: statusMap.expired || 0,
          byStatus: statusMap,
        },
      },
    });
  } catch (error) {
    logger.error(error, "Get Check-in Sessions Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch check-in sessions" });
  }
};

// =====================================================
// SESSION DETAIL (review pane)
// =====================================================

export const getCheckInSession = async (req, res) => {
  try {
    const session = await CheckInSession.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    })
      .populate({
        path: "reservationId",
        select:
          "reservationNo source status checkIn checkOut roomTypeCode roomId adults children infants ratePlanId paymentStatus pricing otaInfo specialRequests",
        populate: [
          {
            path: "guestId",
            select: "name email phone nationality idType idNumber address",
          },
          { path: "roomId", select: "roomNumber type" },
        ],
      })
      .populate("review.reviewedBy", "name");

    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Check-in session not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Check-in session fetched",
      data: await checkInSessionDTO(session),
    });
  } catch (error) {
    logger.error(error, "Get Check-in Session Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch check-in session" });
  }
};

// =====================================================
// RESEND LINK
// =====================================================

export const resendCheckInLink = async (req, res) => {
  try {
    const session = await CheckInSession.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    }).populate({
      path: "reservationId",
      populate: ["guestId"],
    });

    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Check-in session not found" });
    }

    if (["approved", "rejected"].includes(session.status)) {
      return res.status(409).json({
        success: false,
        message: `Cannot resend a link for a ${session.status} session`,
      });
    }

    const { token, tokenHash } = createSessionToken();
    session.tokenHash = tokenHash;
    session.expiresAt = expiresAtFor(session.reservationId);
    session.sentAt = new Date();
    session.status =
      session.status === "expired" ? "link-sent" : session.status;
    session.auditTrail.push({
      by: req.user._id,
      action: "link-resend",
      note: null,
    });
    await session.save();

    const hotel = await Hotel.findById(req.user.hotelId).select("name").lean();
    const guestEmail = session.reservationId?.guestId?.email;

    let emailSent = true;
    if (guestEmail) {
      try {
        await sendCheckInEmail({
          email: guestEmail,
          name: session.reservationId?.guestId?.name || "Guest",
          hotelName: hotel?.name || "HotelOS",
          subject: "Complete your online check-in",
          heading: "Your check-in link",
          body: "Please complete your check-in online before arrival.",
          actionUrl: buildCheckInUrl(token),
          actionLabel: "Continue Check-in",
        });
      } catch (error) {
        logger.error(error, "Check-in resend email failed");
        emailSent = false;
      }
    }

    return res.status(200).json({
      success: true,
      message: !guestEmail
        ? "Notification could not be shared — no email on file"
        : emailSent
          ? "Check-in link re-sent"
          : "Check-in link created, but the email could not be sent",
      data: await checkInSessionDTO(session),
    });
  } catch (error) {
    logger.error(error, "Resend Check-in Link Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to resend check-in link" });
  }
};

// =====================================================
// REVIEW ACTIONS — request correction / reject / approve
// =====================================================

async function reviewSession(req, res, decision) {
  try {
    const session = await CheckInSession.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    }).populate({
      path: "reservationId",
      populate: ["guestId", "roomId"],
    });

    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Check-in session not found" });
    }

    if (!["submitted", "correction-requested"].includes(session.status)) {
      return res.status(409).json({
        success: false,
        message: `Only submitted sessions can be reviewed (current: ${session.status})`,
      });
    }

    const { message, steps } = req.body;

    if (decision !== "approved" && !message?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "A message/reason is required" });
    }

    session.review = {
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
      decision,
      message: message?.trim() || null,
      steps: Array.isArray(steps) ? steps : [],
    };
    session.status =
      decision === "approved"
        ? "approved"
        : decision === "rejected"
          ? "rejected"
          : "correction-requested";
    session.auditTrail.push({
      by: req.user._id,
      action: decision,
      note: message?.trim() || null,
    });
    await session.save();

    // Approval marks the booking check-in-verified (room assignment/deposit/
    // key flow stays with front-desk check-in once that step lands).
    if (decision === "approved" && session.reservationId) {
      await Booking.findByIdAndUpdate(session.reservationId._id, {
        $set: { checkInVerified: true },
        $push: {
          auditTrail: {
            by: req.user._id,
            action: "check-in-verified",
            note: "Digital check-in approved",
          },
        },
      });
    }

    const hotel = await Hotel.findById(req.user.hotelId).select("name").lean();
    const guest = session.reservationId?.guestId;

    if (guest?.email) {
      const config = {
        approved: {
          subject: "Your check-in is approved",
          heading: "Check-in approved",
          body: "Your details have been verified. See you at the front desk!",
        },
        rejected: {
          subject: "Your check-in was rejected",
          heading: "Check-in rejected",
          body: message?.trim() || "Your check-in could not be approved.",
        },
        "correction-requested": {
          subject: "Action needed: correct your check-in details",
          heading: "Correction requested",
          body:
            message?.trim() ||
            "Please review and correct the requested details in your check-in.",
        },
      }[decision];

      try {
        // For corrections we issue a fresh link (the stored tokenHash is not
        // a usable token).
        const { token } = createSessionToken();
        if (decision === "correction-requested") {
          session.tokenHash = hashToken(token);
          await session.save();
        }
        await sendCheckInEmail({
          email: guest.email,
          name: guest.name || "Guest",
          hotelName: hotel?.name || "HotelOS",
          subject: config.subject,
          heading: config.heading,
          body: config.body,
          actionUrl:
            decision === "correction-requested"
              ? buildCheckInUrl(token)
              : undefined,
          actionLabel: "Open Check-in",
        });
      } catch (error) {
        logger.error(error, "Check-in review email failed");
      }
    }

    return res.status(200).json({
      success: true,
      message: `Check-in ${decision}`,
      data: await checkInSessionDTO(session),
    });
  } catch (error) {
    logger.error(error, "Review Check-in Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to review check-in" });
  }
}

export const approveCheckIn = (req, res) => reviewSession(req, res, "approved");
export const rejectCheckIn = (req, res) => reviewSession(req, res, "rejected");
export const requestCheckInCorrection = (req, res) =>
  reviewSession(req, res, "correction-requested");

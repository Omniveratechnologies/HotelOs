import Booking from "../models/Booking.js";
import { bookingDTO, bookingListDTO } from "../dto/booking.dto.js";
import Room from "#/modules/rooms/models/Room.js";
import Hotel from "#/modules/hotels/models/Hotel.js";
import User from "#/modules/users/models/User.js";
import UserInvite from "#/modules/invites/models/UserInvite.js";

import {
  generateUsername,
  generateTemporaryPassword,
} from "#/shared/utils/generateCredentials.js";

import { sendGuestCredentialsEmail } from "#/shared/services/email.service.js";

import { deleteObjects } from "#/config/r2.js";

import { GUEST_ID_TYPES } from "#/shared/constants/guest.js";
import {
  RESERVATION_STATUSES,
  RESERVATION_SOURCES,
  PAYMENT_STATUSES,
  ACTIVE_STAY_STATUSES,
  canTransition,
} from "../constants.js";
import {
  resolveNightlyRate,
  computePricing,
  occupancyForGuests,
} from "../services/pricing.service.js";
import {
  getTypeAvailability,
  listAvailableRooms,
  assertTypeAvailability,
} from "../services/availability.service.js";
import { nextReservationNo } from "../services/reservationNo.service.js";

import {
  aiosellSyncInventory,
  calculateSyncDateRange,
} from "#/shared/services/inventory.service.js";

import logger from "#/utils/logger.js";

// =====================================================
// HELPERS
// =====================================================

async function generateGuestUsername(hotelCode) {
  let number = 1;
  let username;

  // Loop until an unused username is found
  do {
    username = generateUsername(
      hotelCode,
      "GST",
      String(number).padStart(3, "0"),
    );

    // oxlint-disable-next-line no-await-in-loop -- sequential uniqueness check; each iteration depends on the previous query result
    const existingUser = await User.findOne({ username });

    if (!existingUser) {
      break;
    }

    number++;
  } while (number <= 9999);

  return username;
}

// Documents arrive as JSON metadata referencing R2 objects the client has
// already uploaded. Each entry: { key, filename, docType, size, mimeType }.
function resolveDocuments(req) {
  if (!Array.isArray(req.body.documents)) {
    return [];
  }

  return req.body.documents.map((doc) => ({
    docType: doc.docType || null,
    filename: doc.filename,
    path: doc.key,
  }));
}

// Best-effort removal of R2 objects referenced by their keys
async function removeFilesQuietly(keys) {
  await deleteObjects(keys);
}

// Free a room back to cleaning state
async function freeRoom(roomId) {
  await Room.findByIdAndUpdate(roomId, {
    status: "cleaning",
    currentGuest: null,
    checkIn: null,
    checkOut: null,
  });
}

// Occupy/reserve a room with guest display info
async function claimRoom(roomId, { guestName, checkIn, checkOut, reserved }) {
  await Room.findByIdAndUpdate(roomId, {
    status: reserved ? "reserved" : "occupied",
    currentGuest: guestName,
    checkIn: checkIn || null,
    checkOut: checkOut || null,
  });
}

async function sendCredentialsQuietly({
  email,
  name,
  username,
  temporaryPassword,
  hotelName,
}) {
  try {
    await sendGuestCredentialsEmail({
      email,
      name,
      username,
      password: temporaryPassword,
      hotelName,
    });

    return true;
  } catch (error) {
    logger.error(error, "Guest credentials email failed");

    return false;
  }
}

function badRequest(res, message) {
  return res.status(400).json({ success: false, message });
}

// Dates are day-granular (hotel nights). Truncate to local midnight so a
// checkout day is free for the next guest's check-in on the same day.
function parseDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

// Create the primary guest login if new, or link to an existing guest in the
// same hotel (matched by email or phone). Existing guests keep their account
// and credentials untouched.
async function createOrLinkGuest({
  hotel,
  name,
  email,
  phone,
  address,
  idType,
  idNumber,
  nationality,
  documents,
}) {
  const normalizedEmail = email?.trim().toLowerCase() || "";
  const normalizedPhone = phone?.trim() || "";

  if (normalizedEmail || normalizedPhone) {
    const existing = await User.findOne({
      hotelId: hotel._id,
      role: "GUEST",
      $or: [
        ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
        ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
      ],
    });

    if (existing) {
      return { user: existing, credentials: null, createdNew: false };
    }
  }

  const username = await generateGuestUsername(hotel.hotelCode);
  const temporaryPassword = generateTemporaryPassword();

  const user = await User.create({
    name: name.trim(),
    username,
    email: normalizedEmail || undefined,
    password: temporaryPassword,
    role: "GUEST",
    hotelId: hotel._id,
    phone: normalizedPhone,
    address: address?.trim() || "",
    idType: idType || "Aadhaar",
    idNumber: idNumber?.trim() || "",
    nationality: nationality?.trim() || null,
    documents: documents || [],
    isActive: true,
    mustChangePassword: false,
  });

  let emailSent = false;
  if (normalizedEmail) {
    emailSent = await sendCredentialsQuietly({
      email: normalizedEmail,
      name: user.name,
      username,
      temporaryPassword,
      hotelName: hotel.name,
    });
  }

  return {
    user,
    createdNew: true,
    credentials: {
      username,
      temporaryPassword,
      emailSent,
      note: normalizedEmail
        ? undefined
        : "No email on file — login credentials could not be shared.",
    },
  };
}

// Shared create/update pricing resolution; returns a pricing snapshot object.
async function buildPricingSnapshot({
  hotelId,
  hotelTaxPercent,
  roomTypeCode,
  ratePlanId,
  adults,
  mealPlan,
  rateOverride,
  checkIn,
  checkOut,
  rooms,
  addOns,
  discount,
  taxPercent,
  commissionPercent,
}) {
  const nights = Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  const { nightlyRate, rateSource, ratePlan } = await resolveNightlyRate({
    hotelId,
    roomTypeCode,
    ratePlanId,
    occupancy: occupancyForGuests(adults),
    mealPlan,
    overrideRate: rateOverride,
  });

  const pricing = {
    ...computePricing({
      nightlyRate,
      nights,
      rooms,
      addOns,
      discount,
      taxPercent: taxPercent ?? hotelTaxPercent ?? 12,
      commissionPercent,
    }),
    rateSource,
  };

  return { pricing, resolvedRatePlan: ratePlan };
}

// =====================================================
// CREATE RESERVATION (guest-or-link + booking + pricing)
// =====================================================

export const createReservation = async (req, res) => {
  let createdUser = null;
  let createdBooking = null;
  let uploadedPaths = [];

  try {
    const {
      name,
      email,
      phone,
      address,
      idType,
      idNumber,
      nationality,
      roomId,
      roomTypeCode,
      ratePlanId,
      mealPlan,
      rateOverride,
      checkIn,
      checkOut,
      rooms = 1,
      adults = 1,
      children = 0,
      infants = 0,
      purpose,
      specialRequests,
      guestType,
      source,
      status,
      addOns,
      discount,
      taxPercent,
      paymentStatus,
    } = req.body;

    // =================================================
    // VALIDATION
    // =================================================

    if (!name?.trim()) {
      return badRequest(res, "Guest name is required");
    }

    if (!phone?.trim() && !email?.trim()) {
      return badRequest(res, "Guest phone or email is required");
    }

    const checkInDate = parseDate(checkIn);
    const checkOutDate = parseDate(checkOut);

    if (!checkInDate || !checkOutDate) {
      return badRequest(res, "Check-in and check-out dates are required");
    }

    if (checkOutDate <= checkInDate) {
      return badRequest(res, "Check-out must be after check-in");
    }

    const bookingStatus =
      status && RESERVATION_STATUSES.includes(status) ? status : "confirmed";

    const bookingSource =
      source && RESERVATION_SOURCES.includes(source) ? source : "DIRECT";

    if (bookingSource === "OTA") {
      return badRequest(
        res,
        "OTA reservations are created by channel import only",
      );
    }

    if (idType && !GUEST_ID_TYPES.includes(idType)) {
      return badRequest(res, "Invalid ID type");
    }

    const hotel = await Hotel.findById(req.user.hotelId).select(
      "hotelCode name taxPercent",
    );

    if (!hotel) {
      return badRequest(res, "You are not assigned to a valid hotel");
    }

    // Specific room must belong to the hotel and be reservable
    let roomDoc = null;
    if (roomId) {
      roomDoc = await Room.findOne({
        _id: roomId,
        hotelId: req.user.hotelId,
      });

      if (!roomDoc) {
        return res
          .status(404)
          .json({ success: false, message: "Room not found" });
      }

      if (roomDoc.channelVerified === false || roomDoc.pendingDelete === true) {
        return res.status(409).json({
          success: false,
          message:
            "This room is awaiting channel verification and cannot be used yet.",
        });
      }
    }

    const effectiveRoomTypeCode = roomTypeCode || roomDoc?.roomCode || null;

    // Availability guard (drafts don't hold inventory until confirmed)
    if (bookingStatus !== "draft") {
      if (effectiveRoomTypeCode) {
        const { ok, available } = await assertTypeAvailability(
          req.user.hotelId,
          effectiveRoomTypeCode,
          checkInDate,
          checkOutDate,
          rooms,
        );
        if (!ok) {
          return res.status(409).json({
            success: false,
            message: `Only ${available} room(s) of this type available for the selected dates`,
          });
        }
      }

      if (roomId) {
        const freeRooms = await listAvailableRooms(
          req.user.hotelId,
          roomDoc.roomCode || String(roomDoc.type).toLowerCase(),
          checkInDate,
          checkOutDate,
        );
        if (!freeRooms.some((r) => String(r._id) === String(roomId))) {
          return res
            .status(409)
            .json({ success: false, message: "This room is not available" });
        }
      }
    }

    // =================================================
    // GUEST (create or link) — skipped for drafts without guest details
    // =================================================

    const documents = resolveDocuments(req);
    uploadedPaths = documents.map((d) => d.path);

    const {
      user: guestUser,
      credentials,
      createdNew,
    } = await createOrLinkGuest({
      hotel,
      name,
      email,
      phone,
      address,
      idType,
      idNumber,
      nationality,
      documents,
    });
    createdUser = createdNew ? guestUser : null;

    // =================================================
    // PRICING SNAPSHOT
    // =================================================

    const { pricing } = await buildPricingSnapshot({
      hotelId: req.user.hotelId,
      hotelTaxPercent: hotel.taxPercent,
      roomTypeCode: effectiveRoomTypeCode,
      ratePlanId,
      adults,
      mealPlan,
      rateOverride,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      rooms,
      addOns,
      discount,
      taxPercent: taxPercent != null ? Number(taxPercent) : undefined,
    });

    const reservationNo = await nextReservationNo(req.user.hotelId);

    createdBooking = await Booking.create({
      reservationNo,
      source: bookingSource,
      channel: bookingSource === "DIRECT" ? "DIRECT" : bookingSource,
      guestId: guestUser._id,
      hotelId: req.user.hotelId,
      roomId: roomDoc?._id || null,
      roomTypeCode: effectiveRoomTypeCode,
      ratePlanId: ratePlanId || null,
      mealPlan: mealPlan || null,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      status: bookingStatus,
      rooms: Math.max(1, Number(rooms) || 1),
      adults: Math.max(0, Number(adults) || 1),
      children: Math.max(0, Number(children) || 0),
      infants: Math.max(0, Number(infants) || 0),
      guestType: guestType || "individual",
      purpose: purpose?.trim() || null,
      specialRequests: specialRequests?.trim() || null,
      pricing,
      paymentStatus:
        paymentStatus && PAYMENT_STATUSES.includes(paymentStatus)
          ? paymentStatus
          : "unpaid",
      totalAmountBeforeTax: pricing.taxableBase,
      tax: pricing.taxAmount,
      currency: pricing.currency,
      auditTrail: [
        {
          by: req.user._id,
          action: "created",
          to: bookingStatus,
          note: `Source: ${bookingSource}`,
        },
      ],
    });

    // =================================================
    // SYNC THE ROOM (only when a specific room is assigned)
    // =================================================

    if (roomDoc && bookingStatus !== "draft") {
      await claimRoom(roomDoc._id, {
        guestName: guestUser.name,
        checkIn: createdBooking.checkIn,
        checkOut: createdBooking.checkOut,
        reserved: bookingStatus !== "checked-in",
      });
    }

    // =================================================
    // SYNC INVENTORY TO AIOSELL (non-critical side effect)
    // =================================================

    const [syncStart, syncEnd] = calculateSyncDateRange(
      createdBooking.checkIn,
      createdBooking.checkOut,
    );
    await aiosellSyncInventory(req.user.hotelId, syncStart, syncEnd);

    logger.info(
      {
        bookingId: createdBooking._id,
        reservationNo,
        guestId: guestUser._id,
        credentials,
      },
      "Reservation created",
    );

    const populated = await Booking.findById(createdBooking._id)
      .populate("guestId")
      .populate("roomId", "roomNumber type rate floor roomCode")
      .populate("ratePlanId", "name mealPlan occupancy rate");

    return res.status(201).json({
      success: true,
      message: "Reservation created successfully",
      data: {
        ...(await bookingDTO(populated)),
        credentials: credentials
          ? {
              username: credentials.username,
              temporaryPassword: credentials.temporaryPassword,
              emailSent: credentials.emailSent,
              note: credentials.note,
            }
          : undefined,
      },
    });
  } catch (error) {
    logger.error(error, "Create Reservation Error");

    if (createdBooking) {
      try {
        await Booking.deleteOne({ _id: createdBooking._id });
      } catch {
        // Best effort rollback
      }
    }

    // Only delete the guest user when this request created a brand-new one
    // (linked existing guests must not be removed).
    if (createdUser) {
      const otherBookings = await Booking.exists({
        guestId: createdUser._id,
        _id: { $ne: createdBooking?._id },
      });
      if (!otherBookings) {
        try {
          await User.deleteOne({ _id: createdUser._id });
          await UserInvite.deleteMany({ userId: createdUser._id });
        } catch {
          // Best effort rollback
        }
      }
    }

    await removeFilesQuietly(uploadedPaths);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A reservation or user with these details already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create reservation",
    });
  }
};

// =====================================================
// QUOTE — live pricing + availability for the summary panel
// =====================================================

export const getQuote = async (req, res) => {
  try {
    const {
      roomTypeCode,
      roomId,
      ratePlanId,
      mealPlan,
      rateOverride,
      checkIn,
      checkOut,
      rooms = 1,
      adults = 1,
      addOns,
      discount,
      taxPercent,
    } = req.body;

    const checkInDate = parseDate(checkIn);
    const checkOutDate = parseDate(checkOut);

    if (!checkInDate || !checkOutDate || checkOutDate <= checkInDate) {
      return badRequest(res, "A valid check-in/check-out range is required");
    }

    const hotel = await Hotel.findById(req.user.hotelId)
      .select("taxPercent")
      .lean();

    let effectiveRoomTypeCode = roomTypeCode;
    if (!effectiveRoomTypeCode && roomId) {
      const room = await Room.findOne({
        _id: roomId,
        hotelId: req.user.hotelId,
      })
        .select("roomCode type")
        .lean();
      effectiveRoomTypeCode =
        room?.roomCode || (room ? String(room.type).toLowerCase() : null);
    }

    const { pricing, resolvedRatePlan } = await buildPricingSnapshot({
      hotelId: req.user.hotelId,
      hotelTaxPercent: hotel?.taxPercent,
      roomTypeCode: effectiveRoomTypeCode,
      ratePlanId,
      adults,
      mealPlan,
      rateOverride,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      rooms,
      addOns,
      discount,
      taxPercent: taxPercent != null ? Number(taxPercent) : undefined,
    });

    let availability = null;
    if (effectiveRoomTypeCode) {
      availability = await assertTypeAvailability(
        req.user.hotelId,
        effectiveRoomTypeCode,
        checkInDate,
        checkOutDate,
        rooms,
      );
    }

    return res.status(200).json({
      success: true,
      message: "Quote computed",
      data: {
        pricing,
        ratePlan: resolvedRatePlan
          ? {
              id: resolvedRatePlan._id,
              name: resolvedRatePlan.name,
              mealPlan: resolvedRatePlan.mealPlan,
              occupancy: resolvedRatePlan.occupancy,
            }
          : null,
        availability,
      },
    });
  } catch (error) {
    logger.error(error, "Quote Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to compute quote" });
  }
};

// =====================================================
// AVAILABILITY — per room type for a date range
// =====================================================

export const getAvailability = async (req, res) => {
  try {
    const checkInDate = parseDate(req.query.checkIn);
    const checkOutDate = parseDate(req.query.checkOut);

    if (!checkInDate || !checkOutDate || checkOutDate <= checkInDate) {
      return badRequest(res, "A valid check-in/check-out range is required");
    }

    const availability = await getTypeAvailability(
      req.user.hotelId,
      checkInDate,
      checkOutDate,
    );

    return res.status(200).json({
      success: true,
      message: "Availability fetched",
      data: availability,
    });
  } catch (error) {
    logger.error(error, "Availability Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch availability" });
  }
};

// =====================================================
// AVAILABLE ROOMS — concrete rooms of a type free for a range
// =====================================================

export const getAvailableRooms = async (req, res) => {
  try {
    const { roomTypeCode } = req.query;
    const checkInDate = parseDate(req.query.checkIn);
    const checkOutDate = parseDate(req.query.checkOut);

    if (
      !roomTypeCode ||
      !checkInDate ||
      !checkOutDate ||
      checkOutDate <= checkInDate
    ) {
      return badRequest(
        res,
        "roomTypeCode and a valid check-in/check-out range are required",
      );
    }

    const rooms = await listAvailableRooms(
      req.user.hotelId,
      roomTypeCode,
      checkInDate,
      checkOutDate,
    );

    return res.status(200).json({
      success: true,
      message: "Available rooms fetched",
      data: rooms.map((r) => ({
        id: r._id,
        roomNumber: r.roomNumber,
        type: r.type,
        roomCode: r.roomCode,
        floor: r.floor,
        rate: r.rate,
        status: r.status,
      })),
    });
  } catch (error) {
    logger.error(error, "Available Rooms Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch available rooms" });
  }
};

// =====================================================
// LIST BOOKINGS (filters + search + pagination + sorting)
// =====================================================

const SORTABLE = {
  createdAt: "createdAt",
  checkIn: "checkIn",
  checkOut: "checkOut",
  grandTotal: "pricing.grandTotal",
};

export const getBookings = async (req, res) => {
  try {
    const filter = { hotelId: req.user.hotelId };
    const {
      status,
      source,
      otaChannel,
      roomType,
      ratePlanId,
      q,
      from,
      to,
      page = 1,
      limit = 50,
      sort = "-createdAt",
    } = req.query;

    if (status && RESERVATION_STATUSES.includes(status)) {
      filter.status = status;
    }
    if (source && RESERVATION_SOURCES.includes(source)) {
      filter.source = source;
    }
    if (otaChannel) {
      filter["otaInfo.channel"] = otaChannel;
    }
    if (roomType) {
      filter.roomTypeCode = roomType;
    }
    if (ratePlanId) {
      filter.ratePlanId = ratePlanId;
    }

    const fromDate = from ? parseDate(from) : null;
    const toDate = to ? parseDate(to) : null;
    if (fromDate || toDate) {
      filter.checkIn = {
        ...(fromDate ? { $gte: fromDate } : {}),
        ...(toDate ? { $lte: toDate } : {}),
      };
    }

    const search = q?.trim();
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const matchingGuests = await User.find({
        hotelId: req.user.hotelId,
        role: "GUEST",
        $or: [{ name: rx }, { phone: rx }, { email: rx }],
      })
        .select("_id")
        .limit(200)
        .lean();

      filter.$or = [
        { reservationNo: rx },
        { aiosellBookingId: rx },
        { "otaInfo.otaBookingId": rx },
        { "otaInfo.confirmationCode": rx },
        ...(matchingGuests.length
          ? [{ guestId: { $in: matchingGuests.map((g) => g._id) } }]
          : []),
      ];
    }

    const sortField = String(sort).replace(/^-/, "");
    const sortDir = String(sort).startsWith("-") ? -1 : 1;
    const sortKey = SORTABLE[sortField] || "createdAt";

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 50));

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate("guestId", "name email phone idType idNumber nationality")
        .populate("roomId", "roomNumber type rate floor roomCode")
        .populate("ratePlanId", "name mealPlan occupancy rate")
        .sort({ [sortKey]: sortDir })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Booking.countDocuments(filter),
    ]);

    const data = await Promise.all(bookings.map((b) => bookingListDTO(b)));

    return res.status(200).json({
      success: true,
      message: "Bookings fetched successfully",
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    logger.error(error, "Get Bookings Error");

    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
    });
  }
};

// Aggregate rows [{_id, count}] → plain map (with a DIRECT fallback for the
// legacy `channel`-only rows whose source group is null).
const toSourceMap = (rows) =>
  Object.fromEntries(rows.map((r) => [r._id || "DIRECT", r.count]));

// =====================================================
// STATS — KPI tiles + tab counts + footer cards
// =====================================================

export const getBookingStats = async (req, res) => {
  try {
    const hotelId = req.user.hotelId;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const [bySource, byStatus, arrivalsToday, departuresToday, inHouse] =
      await Promise.all([
        Booking.aggregate([
          { $match: { hotelId } },
          { $group: { _id: "$source", count: { $sum: 1 } } },
        ]),
        Booking.aggregate([
          { $match: { hotelId } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Booking.countDocuments({
          hotelId,
          status: "confirmed",
          checkIn: { $gte: startOfToday, $lt: endOfToday },
        }),
        Booking.countDocuments({
          hotelId,
          status: "checked-in",
          checkOut: { $gte: startOfToday, $lt: endOfToday },
        }),
        Booking.countDocuments({ hotelId, status: "checked-in" }),
      ]);

    const toMap = toSourceMap;
    const sourceMap = toMap(bySource);
    const statusMap = toMap(byStatus);

    return res.status(200).json({
      success: true,
      message: "Booking stats fetched",
      data: {
        total: bySource.reduce((s, r) => s + r.count, 0),
        bySource: sourceMap,
        byStatus: statusMap,
        otaChannels: (
          await Booking.aggregate([
            { $match: { hotelId, source: "OTA" } },
            { $group: { _id: "$otaInfo.channel", count: { $sum: 1 } } },
          ])
        ).reduce((acc, r) => {
          acc[r._id || "OTHER"] = r.count;
          return acc;
        }, {}),
        today: {
          arrivals: arrivalsToday,
          departures: departuresToday,
          inHouse,
        },
      },
    });
  } catch (error) {
    logger.error(error, "Booking Stats Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch booking stats" });
  }
};

// =====================================================
// GET SINGLE BOOKING
// =====================================================

export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    })
      .populate("guestId")
      .populate("roomId", "roomNumber type rate floor roomCode")
      .populate("ratePlanId", "name mealPlan occupancy rate");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking fetched successfully",
      data: await bookingDTO(booking),
    });
  } catch (error) {
    logger.error(error, "Get Booking Error");

    return res.status(500).json({
      success: false,
      message: "Failed to fetch booking",
    });
  }
};

// =====================================================
// UPDATE BOOKING (details + status transitions + re-pricing)
// =====================================================

// Fields whose change re-runs the pricing engine.
const REPRICE_FIELDS = [
  "checkIn",
  "checkOut",
  "rooms",
  "ratePlanId",
  "mealPlan",
  "rateOverride",
  "addOns",
  "discount",
  "taxPercent",
  "adults",
  "roomTypeCode",
];

export const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const {
      status: rawStatus,
      checkIn,
      checkOut,
      roomId,
      roomTypeCode,
      ratePlanId,
      mealPlan,
      rateOverride,
      rooms,
      adults,
      children,
      infants,
      guestType,
      purpose,
      specialRequests,
      addOns,
      discount,
      taxPercent,
      paymentStatus,
      note,
      name,
      phone,
      email,
      nationality,
      idType,
      idNumber,
    } = req.body || {};

    const status = rawStatus ? String(rawStatus).toLowerCase() : undefined;

    const originalCheckIn = booking.checkIn;
    const originalCheckOut = booking.checkOut;
    const audit = [];

    const guestUser = await User.findById(booking.guestId).select("name");

    // Update guest user personal info if provided
    if (
      booking.guestId &&
      (name ||
        phone ||
        email !== undefined ||
        nationality !== undefined ||
        idType !== undefined ||
        idNumber !== undefined)
    ) {
      const guestUpdates = {};
      if (name) guestUpdates.name = name.trim();
      if (phone) guestUpdates.phone = phone.trim();
      if (email !== undefined) guestUpdates.email = email ? email.trim() : null;
      if (nationality !== undefined)
        guestUpdates.nationality = nationality ? nationality.trim() : null;
      if (idType !== undefined) guestUpdates.idType = idType || null;
      if (idNumber !== undefined)
        guestUpdates.idNumber = idNumber ? idNumber.trim() : null;
      if (Object.keys(guestUpdates).length > 0) {
        await User.findByIdAndUpdate(booking.guestId, guestUpdates);
      }
    }

    // Room reassignment
    const targetCheckIn = checkIn ? parseDate(checkIn) : booking.checkIn;
    const targetCheckOut = checkOut ? parseDate(checkOut) : booking.checkOut;

    if (!targetCheckIn || !targetCheckOut || targetCheckOut <= targetCheckIn) {
      return badRequest(res, "Check-out must be after check-in");
    }

    if (roomId && String(roomId) !== String(booking.roomId)) {
      const room = await Room.findOne({
        _id: roomId,
        hotelId: req.user.hotelId,
      });

      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }

      if (room.channelVerified === false || room.pendingDelete === true) {
        return res.status(409).json({
          success: false,
          message:
            "This room is awaiting channel verification and cannot be used yet.",
        });
      }

      const roomCodeForConflict =
        room.roomCode || String(room.type).toLowerCase();
      const freeRooms = await listAvailableRooms(
        req.user.hotelId,
        roomCodeForConflict,
        targetCheckIn,
        targetCheckOut,
        booking._id,
      );
      const roomFree = freeRooms.some((r) => String(r._id) === String(roomId));
      if (!roomFree) {
        return res.status(409).json({
          success: false,
          message: "This room is not available",
        });
      }

      await claimRoom(room._id, {
        guestName: guestUser?.name,
        checkIn: targetCheckIn,
        checkOut: targetCheckOut,
        reserved: booking.status !== "checked-in",
      });

      if (booking.roomId) {
        await freeRoom(booking.roomId);
      }

      audit.push({
        by: req.user._id,
        action: "room-changed",
        from: booking.roomId ? String(booking.roomId) : null,
        to: String(room._id),
        note,
      });

      booking.roomId = room._id;
      booking.roomTypeCode = booking.roomTypeCode || roomCodeForConflict;
    }

    if (checkIn) {
      booking.checkIn = targetCheckIn;
    }

    if (checkOut) {
      booking.checkOut = targetCheckOut;
    }

    if (roomTypeCode !== undefined) booking.roomTypeCode = roomTypeCode || null;
    if (ratePlanId !== undefined) booking.ratePlanId = ratePlanId || null;
    if (mealPlan !== undefined) booking.mealPlan = mealPlan || null;
    if (rooms !== undefined) booking.rooms = Math.max(1, Number(rooms) || 1);
    if (adults !== undefined) booking.adults = Math.max(0, Number(adults) || 1);
    if (children !== undefined)
      booking.children = Math.max(0, Number(children) || 0);
    if (infants !== undefined)
      booking.infants = Math.max(0, Number(infants) || 0);
    if (guestType !== undefined) booking.guestType = guestType || "individual";

    if (purpose !== undefined) {
      booking.purpose = purpose?.trim() || null;
    }

    if (specialRequests !== undefined) {
      booking.specialRequests = specialRequests?.trim() || null;
    }

    if (
      paymentStatus !== undefined &&
      PAYMENT_STATUSES.includes(paymentStatus)
    ) {
      booking.paymentStatus = paymentStatus;
    }

    if (status && status !== booking.status) {
      if (!RESERVATION_STATUSES.includes(status)) {
        return badRequest(res, "Invalid booking status");
      }

      if (!canTransition(booking.status, status)) {
        return res.status(409).json({
          success: false,
          message: `Cannot change status from "${booking.status}" to "${status}"`,
        });
      }

      const wasCheckedOut = booking.status === "checked-out";
      const previous = booking.status;

      booking.status = status;

      if (status === "checked-out" && !wasCheckedOut && booking.roomId) {
        await freeRoom(booking.roomId);
      }

      if (status === "cancelled" && booking.roomId) {
        const stillHeld = await Booking.exists({
          roomId: booking.roomId,
          hotelId: req.user.hotelId,
          status: { $in: ACTIVE_STAY_STATUSES },
          _id: { $ne: booking._id },
        });
        if (!stillHeld) {
          await freeRoom(booking.roomId);
        }
      }

      if (wasCheckedOut && status !== "checked-out" && booking.roomId) {
        await claimRoom(booking.roomId, {
          guestName: guestUser?.name,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          reserved: status !== "checked-in",
        });
      }

      if (status === "cancelled") {
        booking.cancellation = {
          reason: req.body?.reason?.trim() || null,
          at: new Date(),
          by: req.user._id,
          charge: Math.max(0, Number(req.body?.cancellationCharge) || 0),
        };
      }

      audit.push({
        by: req.user._id,
        action: "status-changed",
        from: previous,
        to: status,
        note: note || req.body?.reason || null,
      });
    }

    // Re-price when a pricing input changed
    const repriced = REPRICE_FIELDS.some(
      (f) => (req.body || {})[f] !== undefined,
    );
    if (repriced) {
      const hotel = await Hotel.findById(req.user.hotelId)
        .select("taxPercent")
        .lean();

      const { pricing } = await buildPricingSnapshot({
        hotelId: req.user.hotelId,
        hotelTaxPercent: hotel?.taxPercent,
        roomTypeCode: booking.roomTypeCode,
        ratePlanId: booking.ratePlanId,
        adults: booking.adults,
        mealPlan: booking.mealPlan,
        rateOverride,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        rooms: booking.rooms,
        addOns: addOns !== undefined ? addOns : booking.pricing?.addOns,
        discount: discount !== undefined ? discount : booking.pricing?.discount,
        taxPercent:
          taxPercent !== undefined
            ? Number(taxPercent)
            : booking.pricing?.taxPercent,
      });

      booking.pricing = pricing;
      booking.totalAmountBeforeTax = pricing.taxableBase;
      booking.tax = pricing.taxAmount;
    }

    if (audit.length) {
      booking.auditTrail.push(...audit);
    }

    await booking.save();

    // =================================================
    // SYNC INVENTORY TO AIOSELL (non-critical side effect)
    // =================================================

    const syncDates = [
      originalCheckIn,
      originalCheckOut,
      booking.checkIn,
      booking.checkOut,
    ]
      .filter(Boolean)
      .map((d) => new Date(d).toISOString().slice(0, 10));

    const earliestCheckIn =
      syncDates.length > 0
        ? syncDates.reduce((min, d) => (d < min ? d : min))
        : null;
    const latestCheckOut =
      syncDates.length > 0
        ? syncDates.reduce((max, d) => (d > max ? d : max))
        : null;

    const [syncStart, syncEnd] = calculateSyncDateRange(
      earliestCheckIn,
      latestCheckOut,
    );
    await aiosellSyncInventory(req.user.hotelId, syncStart, syncEnd);

    const populated = await Booking.findById(booking._id)
      .populate("guestId")
      .populate("roomId", "roomNumber type rate floor roomCode")
      .populate("ratePlanId", "name mealPlan occupancy rate");

    return res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: await bookingDTO(populated),
    });
  } catch (error) {
    logger.error(error, "Update Booking Error");

    return res.status(500).json({
      success: false,
      message: "Failed to update booking",
    });
  }
};

// =====================================================
// ACTIONS — cancel / reconfirm / change-room / extend-stay / history
// =====================================================

async function findBookingOr404(req, res) {
  const booking = await Booking.findOne({
    _id: req.params.id,
    hotelId: req.user.hotelId,
  });
  if (!booking) {
    res.status(404).json({ success: false, message: "Booking not found" });
    return null;
  }
  return booking;
}

async function syncInventoryQuietly(hotelId, ...dates) {
  try {
    const flat = dates
      .filter(Boolean)
      .map((d) => new Date(d).toISOString().slice(0, 10));
    if (!flat.length) return;
    const start = flat.reduce((min, d) => (d < min ? d : min));
    const end = flat.reduce((max, d) => (d > max ? d : max));
    const [syncStart, syncEnd] = calculateSyncDateRange(start, end);
    await aiosellSyncInventory(hotelId, syncStart, syncEnd);
  } catch (error) {
    logger.warn(error, "Aiosell inventory sync failed (non-fatal)");
  }
}

async function releaseRoomIfFree(hotelId, booking) {
  if (!booking.roomId) return;
  const stillHeld = await Booking.exists({
    roomId: booking.roomId,
    hotelId,
    status: { $in: ACTIVE_STAY_STATUSES },
    _id: { $ne: booking._id },
  });
  if (!stillHeld) {
    await freeRoom(booking.roomId);
  }
}

export const cancelBooking = async (req, res) => {
  try {
    const booking = await findBookingOr404(req, res);
    if (!booking) return;

    const { reason } = req.body;
    if (!reason?.trim()) {
      return badRequest(res, "A cancellation reason is required");
    }

    if (!canTransition(booking.status, "cancelled")) {
      return res.status(409).json({
        success: false,
        message: `Cannot cancel a booking with status "${booking.status}"`,
      });
    }

    // OTA cancellation policy → compute penalty (one night after free window).
    let charge = 0;
    let policyNote = null;
    if (booking.source === "OTA" && booking.otaInfo) {
      const freeUntil = booking.otaInfo.cancellationPolicy?.freeUntil;
      if (freeUntil && new Date() < new Date(freeUntil)) {
        policyNote = "Free cancellation per OTA policy";
      } else {
        charge = booking.pricing?.nightlyRate || 0;
        policyNote =
          booking.otaInfo.cancellationPolicy?.penalty ||
          "After free-cancellation window: one-night charge applies";
      }
    }

    const previous = booking.status;
    booking.status = "cancelled";
    booking.cancellation = {
      reason: reason.trim(),
      at: new Date(),
      by: req.user._id,
      charge,
    };
    booking.auditTrail.push({
      by: req.user._id,
      action: "status-changed",
      from: previous,
      to: "cancelled",
      note: reason.trim(),
    });
    await booking.save();

    await releaseRoomIfFree(req.user.hotelId, booking);
    await syncInventoryQuietly(
      req.user.hotelId,
      booking.checkIn,
      booking.checkOut,
    );

    return res.status(200).json({
      success: true,
      message: "Reservation cancelled",
      data: {
        ...(await bookingDTO(booking)),
        cancellationCharge: charge,
        policyNote,
      },
    });
  } catch (error) {
    logger.error(error, "Cancel Booking Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to cancel booking" });
  }
};

export const reconfirmBooking = async (req, res) => {
  try {
    const booking = await findBookingOr404(req, res);
    if (!booking) return;

    const allowed = ["draft", "pending", "cancelled", "no-show"];
    if (!allowed.includes(booking.status)) {
      return res.status(409).json({
        success: false,
        message: `Cannot reconfirm a booking with status "${booking.status}"`,
      });
    }

    // Re-validate inventory before confirming again.
    if (booking.roomTypeCode) {
      const { ok, available } = await assertTypeAvailability(
        req.user.hotelId,
        booking.roomTypeCode,
        booking.checkIn,
        booking.checkOut,
        booking.rooms || 1,
        booking._id,
      );
      if (!ok) {
        return res.status(409).json({
          success: false,
          message: `Only ${available} room(s) of this type available for the selected dates`,
        });
      }
    }

    const previous = booking.status;
    booking.status = "confirmed";
    booking.auditTrail.push({
      by: req.user._id,
      action: "status-changed",
      from: previous,
      to: "confirmed",
      note: req.body.note?.trim() || "Reconfirmed",
    });
    await booking.save();

    if (booking.roomId) {
      await claimRoom(booking.roomId, {
        guestName:
          (await User.findById(booking.guestId).select("name"))?.name ||
          "Guest",
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        reserved: true,
      });
    }

    await syncInventoryQuietly(
      req.user.hotelId,
      booking.checkIn,
      booking.checkOut,
    );

    return res.status(200).json({
      success: true,
      message: "Reservation reconfirmed",
      data: await bookingDTO(booking),
    });
  } catch (error) {
    logger.error(error, "Reconfirm Booking Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to reconfirm booking" });
  }
};

export const changeBookingRoom = async (req, res) => {
  try {
    const booking = await findBookingOr404(req, res);
    if (!booking) return;

    if (
      !["confirmed", "reserved", "pending", "checked-in", "draft"].includes(
        booking.status,
      )
    ) {
      return res.status(409).json({
        success: false,
        message: `Cannot change room for a booking with status "${booking.status}"`,
      });
    }

    const { roomId } = req.body;
    if (!roomId) {
      return badRequest(res, "roomId is required");
    }

    const room = await Room.findOne({ _id: roomId, hotelId: req.user.hotelId });
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }
    if (room.channelVerified === false || room.pendingDelete === true) {
      return res.status(409).json({
        success: false,
        message:
          "This room is awaiting channel verification and cannot be used yet.",
      });
    }

    const roomCode = room.roomCode || String(room.type).toLowerCase();
    const freeRooms = await listAvailableRooms(
      req.user.hotelId,
      roomCode,
      booking.checkIn,
      booking.checkOut,
      booking._id,
    );
    if (
      String(room._id) !== String(booking.roomId) &&
      !freeRooms.some((r) => String(r._id) === String(room._id))
    ) {
      return res
        .status(409)
        .json({ success: false, message: "This room is not available" });
    }

    const guestUser = await User.findById(booking.guestId).select("name");
    const previousRoomId = booking.roomId;

    booking.roomId = room._id;
    booking.roomTypeCode = booking.roomTypeCode || roomCode;
    booking.auditTrail.push({
      by: req.user._id,
      action: "room-changed",
      from: previousRoomId ? String(previousRoomId) : null,
      to: String(room._id),
      note: req.body.note?.trim() || null,
    });
    await booking.save();

    if (booking.status !== "draft") {
      await claimRoom(room._id, {
        guestName: guestUser?.name,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        reserved: booking.status !== "checked-in",
      });
      if (previousRoomId)
        await releaseRoomIfFree(req.user.hotelId, {
          ...booking.toObject(),
          roomId: previousRoomId,
        });
    }

    await syncInventoryQuietly(
      req.user.hotelId,
      booking.checkIn,
      booking.checkOut,
    );

    const populated = await Booking.findById(booking._id)
      .populate("guestId")
      .populate("roomId", "roomNumber type rate floor roomCode")
      .populate("ratePlanId", "name mealPlan occupancy rate");

    return res.status(200).json({
      success: true,
      message: "Room changed",
      data: await bookingDTO(populated),
    });
  } catch (error) {
    logger.error(error, "Change Room Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to change room" });
  }
};

export const extendBookingStay = async (req, res) => {
  try {
    const booking = await findBookingOr404(req, res);
    if (!booking) return;

    if (
      !["confirmed", "reserved", "pending", "checked-in", "draft"].includes(
        booking.status,
      )
    ) {
      return res.status(409).json({
        success: false,
        message: `Cannot extend a booking with status "${booking.status}"`,
      });
    }

    const newCheckOut = parseDate(req.body.checkOut);
    if (!newCheckOut || newCheckOut <= booking.checkOut) {
      return badRequest(
        res,
        "New check-out must be a valid date after the current check-out",
      );
    }

    // The room (if assigned) and the room type must stay free for the added nights.
    if (booking.roomId) {
      const code = booking.roomTypeCode;
      if (code) {
        const freeRooms = await listAvailableRooms(
          req.user.hotelId,
          code,
          booking.checkIn,
          newCheckOut,
          booking._id,
        );
        if (!freeRooms.some((r) => String(r._id) === String(booking.roomId))) {
          return res.status(409).json({
            success: false,
            message:
              "The assigned room is not available for the extended dates",
          });
        }
      }
    } else if (booking.roomTypeCode && booking.status !== "draft") {
      const { ok, available } = await assertTypeAvailability(
        req.user.hotelId,
        booking.roomTypeCode,
        booking.checkIn,
        newCheckOut,
        booking.rooms || 1,
        booking._id,
      );
      if (!ok) {
        return res.status(409).json({
          success: false,
          message: `Only ${available} room(s) of this type available for the extended dates`,
        });
      }
    }

    const previousCheckOut = booking.checkOut;
    booking.checkOut = newCheckOut;

    const hotel = await Hotel.findById(req.user.hotelId)
      .select("taxPercent")
      .lean();

    const { pricing } = await buildPricingSnapshot({
      hotelId: req.user.hotelId,
      hotelTaxPercent: hotel?.taxPercent,
      roomTypeCode: booking.roomTypeCode,
      ratePlanId: booking.ratePlanId,
      adults: booking.adults,
      mealPlan: booking.mealPlan,
      rateOverride: req.body.rateOverride,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      rooms: booking.rooms,
      addOns: booking.pricing?.addOns,
      discount: booking.pricing?.discount,
      taxPercent: booking.pricing?.taxPercent,
    });

    booking.pricing = pricing;
    booking.totalAmountBeforeTax = pricing.taxableBase;
    booking.tax = pricing.taxAmount;
    booking.auditTrail.push({
      by: req.user._id,
      action: "stay-extended",
      from: previousCheckOut.toISOString().slice(0, 10),
      to: newCheckOut.toISOString().slice(0, 10),
      note: null,
    });
    await booking.save();

    if (booking.roomId) {
      await Room.findByIdAndUpdate(booking.roomId, {
        checkOut: booking.checkOut,
      });
    }

    await syncInventoryQuietly(
      req.user.hotelId,
      booking.checkIn,
      previousCheckOut,
      newCheckOut,
    );

    const populated = await Booking.findById(booking._id)
      .populate("guestId")
      .populate("roomId", "roomNumber type rate floor roomCode")
      .populate("ratePlanId", "name mealPlan occupancy rate");

    return res.status(200).json({
      success: true,
      message: "Stay extended",
      data: await bookingDTO(populated),
    });
  } catch (error) {
    logger.error(error, "Extend Stay Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to extend stay" });
  }
};

export const getBookingHistory = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    })
      .select("reservationNo auditTrail")
      .populate("auditTrail.by", "name role")
      .lean();

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Booking history fetched",
      data: {
        reservationNo: booking.reservationNo,
        history: booking.auditTrail || [],
      },
    });
  } catch (error) {
    logger.error(error, "Booking History Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch booking history" });
  }
};

// =====================================================
// DELETE BOOKING
// =====================================================

export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const roomId = booking.roomId;
    const wasActive = booking.status !== "checked-out";

    const guest = await User.findById(booking.guestId);

    // Deleting a booking removes its guest login only when the guest has no
    // other bookings (guests can now be linked to multiple reservations).
    const otherBookings = await Booking.exists({
      guestId: booking.guestId,
      _id: { $ne: booking._id },
    });

    if (guest && !otherBookings) {
      await User.deleteOne({ _id: guest._id });
      await UserInvite.deleteMany({ userId: guest._id });

      await removeFilesQuietly(guest.documents.map((d) => d.path));
    }

    await booking.deleteOne();

    // Free the room only if no other active booking holds it
    if (wasActive && roomId) {
      const stillHeld = await Booking.exists({
        roomId,
        hotelId: req.user.hotelId,
        status: { $ne: "checked-out" },
        _id: { $ne: booking._id },
      });

      if (!stillHeld) {
        await freeRoom(roomId);
      }
    }

    // =================================================
    // SYNC INVENTORY TO AIOSELL (non-critical side effect)
    // =================================================

    const [syncStart, syncEnd] = calculateSyncDateRange(
      booking.checkIn,
      booking.checkOut,
    );
    await aiosellSyncInventory(req.user.hotelId, syncStart, syncEnd);

    logger.info({ bookingId: booking._id }, "Booking deleted");

    return res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error) {
    logger.error(error, "Delete Booking Error");

    return res.status(500).json({
      success: false,
      message: "Failed to delete booking",
    });
  }
};

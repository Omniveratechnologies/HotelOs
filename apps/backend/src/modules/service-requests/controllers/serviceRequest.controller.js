import ServiceRequest from "../models/ServiceRequest.js";
import Booking from "#/modules/bookings/models/Booking.js";
import Room from "#/modules/rooms/models/Room.js";
import User from "#/modules/users/models/User.js";
import {
  serviceRequestDTO,
  staffServiceRequestDTO,
} from "../dto/serviceRequest.dto.js";
import { emitToHotel, emitToGuest } from "#/shared/services/socket.service.js";
import { SOCKET_EVENTS } from "#/config/socket-events.js";
import logger from "#/utils/logger.js";

const VALID_REQUEST_STATUSES = new Set([
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

// Enrich a request with its room number and guest name for staff consumers, then
// broadcast it to the hotel's live room so desk dashboards stay in sync.
// The guest's own channel receives the base DTO so the dashboard updates live.
async function publishRequest(
  hotelId,
  request,
  event = SOCKET_EVENTS.SERVICE_REQUEST_CREATED,
) {
  const [room, guest] = await Promise.all([
    Room.findById(request.roomId).select("roomNumber"),
    User.findById(request.guestId).select("name"),
  ]);

  const data = staffServiceRequestDTO(request, room, guest);

  emitToHotel(hotelId, event, data);
  emitToGuest(request.guestId, event, serviceRequestDTO(request));

  return data;
}

export const createServiceRequest = async (req, res) => {
  try {
    const { type, description, items, details } = req.body;
    if (!type)
      return res
        .status(400)
        .json({ success: false, message: "type is required" });

    const request = await ServiceRequest.create({
      guestId: req.user._id,
      hotelId: req.user.hotelId,
      roomId: req.currentBooking?.roomId ?? null,
      type,
      description,
      items: items || [],
      details: details || {},
      status: "REQUESTED",
      priority: type === "EMERGENCY" ? "high" : "normal",
    });

    await publishRequest(req.user.hotelId, request);

    return res.status(201).json({
      success: true,
      message: "Service request created successfully",
      data: serviceRequestDTO(request),
    });
  } catch (error) {
    logger.error(error, "Create service request error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to create service request" });
  }
};

export const getMyServiceRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({ guestId: req.user._id }).sort({
      createdAt: -1,
    });
    return res
      .status(200)
      .json({ success: true, data: requests.map(serviceRequestDTO) });
  } catch (error) {
    logger.error(error, "Get service requests error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch service requests" });
  }
};

// =====================================================
// STAFF-FACING (hotel-scoped) ENDPOINTS
// =====================================================

export const getHotelRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({
      hotelId: req.user.hotelId,
    }).sort({ createdAt: -1 });

    const roomIds = [
      ...new Set(requests.map((r) => r.roomId && r.roomId.toString())),
    ].filter(Boolean);
    const guestIds = [
      ...new Set(requests.map((r) => r.guestId && r.guestId.toString())),
    ].filter(Boolean);

    const [rooms, guests] = await Promise.all([
      roomIds.length
        ? Room.find({ _id: { $in: roomIds } }).select("roomNumber")
        : [],
      guestIds.length
        ? User.find({ _id: { $in: guestIds } }).select("name")
        : [],
    ]);

    const roomMap = new Map(rooms.map((r) => [r._id.toString(), r]));
    const guestMap = new Map(guests.map((g) => [g._id.toString(), g]));

    const data = requests.map((request) =>
      staffServiceRequestDTO(
        request,
        roomMap.get(request.roomId?.toString()),
        guestMap.get(request.guestId?.toString()),
      ),
    );

    return res.status(200).json({
      success: true,
      message: "Service requests fetched successfully",
      data,
    });
  } catch (error) {
    logger.error(error, "Get hotel service requests error");
    return res.status(500).json({
      success: false,
      message: "Failed to fetch service requests",
    });
  }
};

// Receptionist-created request for a room. Resolves the guest from the room's
// active stay so tenant/guest isolation is preserved.
export const createDeskRequest = async (req, res) => {
  try {
    const { roomId, type, description, items, priority } = req.body;

    if (!roomId || !type) {
      return res.status(400).json({
        success: false,
        message: "roomId and type are required",
      });
    }

    const booking = await Booking.findOne({
      roomId,
      hotelId: req.user.hotelId,
      status: { $in: ["reserved", "checked-in"] },
    }).sort({ createdAt: -1 });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "No active stay found for this room",
      });
    }

    const request = await ServiceRequest.create({
      guestId: booking.guestId,
      hotelId: req.user.hotelId,
      roomId: booking.roomId,
      type,
      description,
      items: items || [],
      priority: priority || "normal",
      status: "REQUESTED",
    });

    const data = await publishRequest(req.user.hotelId, request);

    return res.status(201).json({
      success: true,
      message: "Service request created successfully",
      data,
    });
  } catch (error) {
    logger.error(error, "Create desk service request error");
    return res.status(500).json({
      success: false,
      message: "Failed to create service request",
    });
  }
};

export const updateHotelRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !VALID_REQUEST_STATUSES.has(status)) {
      return res.status(400).json({
        success: false,
        message: "A valid status is required",
      });
    }

    const request = await ServiceRequest.findOneAndUpdate(
      { _id: req.params.id, hotelId: req.user.hotelId },
      { status },
      { new: true },
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Service request not found",
      });
    }

    const data = await publishRequest(
      req.user.hotelId,
      request,
      SOCKET_EVENTS.SERVICE_REQUEST_UPDATED,
    );

    return res.status(200).json({
      success: true,
      message: "Service request status updated successfully",
      data,
    });
  } catch (error) {
    logger.error(error, "Update hotel service request status error");
    return res.status(500).json({
      success: false,
      message: "Failed to update service request",
    });
  }
};

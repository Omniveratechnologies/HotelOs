import ServiceRequest from "../models/ServiceRequest.js";
import { serviceRequestDTO } from "../dto/serviceRequest.dto.js";
import logger from "#src/utils/logger.js";
import { getIo } from "#src/config/socket.js";

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
      priority: type === "EMERGENCY" ? "URGENT" : "NORMAL",
    });

    getIo()
      .to(`guest:${req.user._id}`)
      .emit("request:update", serviceRequestDTO(request));
    getIo()
      .to(`hotel:${req.user.hotelId}`)
      .emit("request:update", serviceRequestDTO(request));

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

// NEW — Reception-only, hotel-wide, all guests, all types
export const getHotelServiceRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({
      hotelId: req.user.hotelId,
    }).sort({ priority: -1, createdAt: -1 }); // URGENT first, then newest
    return res
      .status(200)
      .json({ success: true, data: requests.map(serviceRequestDTO) });
  } catch (error) {
    console.error("Get hotel service requests error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch requests" });
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

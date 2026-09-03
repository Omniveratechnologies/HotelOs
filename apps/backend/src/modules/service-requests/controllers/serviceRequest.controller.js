import ServiceRequest from "../models/ServiceRequest.js";
import { serviceRequestDTO } from "../dto/serviceRequest.dto.js";

export const createServiceRequest = async (req, res) => {
  try {
    const { type, description, items } = req.body;
    if (!type)
      return res
        .status(400)
        .json({ success: false, message: "type is required" });

    const request = await ServiceRequest.create({
      guestId: req.user._id,
      hotelId: req.user.hotelId,
      roomId: req.user.roomId,
      type,
      description,
      items: items || [],
      status: "REQUESTED",
    });

    return res.status(201).json({
      success: true,
      message: "Service request created successfully",
      data: serviceRequestDTO(request),
    });
  } catch (error) {
    console.error("Create service request error:", error);
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
    console.error("Get service requests error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch service requests" });
  }
};

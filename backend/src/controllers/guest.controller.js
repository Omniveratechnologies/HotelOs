import Room from "../models/Room.js";
import { guestProfileDTO } from "../dto/guest.dto.js";

export const getMyProfile = async (req, res) => {
  try {
    const user = req.user;
    let room = null;

    if (user.roomId) {
      room = await Room.findById(user.roomId);
    }

    return res.status(200).json({
      success: true,
      data: guestProfileDTO(user, room),
    });
  } catch (error) {
    console.error("Get guest profile error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch guest profile" });
  }
};

export const updateDND = async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== "boolean") {
      return res.status(400).json({ success: false, message: "enabled (boolean) is required" });
    }

    req.user.dndEnabled = enabled;
    await req.user.save();

    return res.status(200).json({ success: true, data: { dndEnabled: req.user.dndEnabled } });
  } catch (error) {
    console.error("Update DND error:", error);
    return res.status(500).json({ success: false, message: "Failed to update Do Not Disturb" });
  }
};
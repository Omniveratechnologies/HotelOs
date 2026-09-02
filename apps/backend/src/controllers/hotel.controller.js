import Hotel from "../models/Hotel.js";

export const createHotel = async (req, res) => {
  try {
    const { name, email, phone, address, city } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Hotel name and email are required",
      });
    }

    const existingHotel = await Hotel.findOne({
      email: email.toLowerCase(),
    });

    if (existingHotel) {
      return res.status(409).json({
        success: false,
        message: "A hotel with this email already exists",
      });
    }

    const hotel = await Hotel.create({
      name,
      email,
      phone,
      address,
      city,
    });

    return res.status(201).json({
      success: true,
      message: "Hotel created successfully",
      data: hotel,
    });
  } catch (error) {
    console.error("Create hotel error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create hotel",
    });
  }
};
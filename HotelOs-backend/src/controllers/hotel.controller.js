import Hotel from "../models/Hotel.js";

// =====================================================
// GENERATE UNIQUE HOTEL CODE
// =====================================================

const generateHotelCode = async (name) => {
  // Remove spaces and special characters
  const cleanName = name
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();

  // First 8 characters
  const baseCode =
    cleanName.slice(0, 8) || "HOTEL";

  let hotelCode = baseCode;
  let count = 1;

  // Make sure hotel code is unique
  while (
    await Hotel.findOne({
      hotelCode,
    })
  ) {
    hotelCode = `${baseCode}${count}`;
    count++;
  }

  return hotelCode;
};

// =====================================================
// CREATE HOTEL
// =====================================================

export const createHotel = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      city,
      subscriptionStartDate,
      subscriptionEndDate,
    } = req.body;

    // =================================================
    // VALIDATION
    // =================================================

    if (
      !name ||
      !email ||
      !subscriptionStartDate ||
      !subscriptionEndDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Hotel name, email, subscription start date and subscription end date are required",
      });
    }

    // =================================================
    // NORMALIZE EMAIL
    // =================================================

    const normalizedEmail = email
      .toLowerCase()
      .trim();

    // =================================================
    // VALIDATE DATES
    // =================================================

    const startDate = new Date(
      subscriptionStartDate
    );

    const endDate = new Date(
      subscriptionEndDate
    );

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription dates",
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message:
          "Subscription end date must be after the start date",
      });
    }

    // =================================================
    // CHECK EXISTING HOTEL EMAIL
    // =================================================

    const existingHotel = await Hotel.findOne({
      email: normalizedEmail,
    });

    if (existingHotel) {
      return res.status(409).json({
        success: false,
        message:
          "A hotel with this email already exists",
      });
    }

    // =================================================
    // GENERATE UNIQUE HOTEL CODE
    // =================================================

    const hotelCode =
      await generateHotelCode(
        name.trim()
      );

    // =================================================
    // CREATE HOTEL
    // =================================================

    const hotel = await Hotel.create({
      name: name.trim(),

      hotelCode,

      email: normalizedEmail,

      phone:
        phone?.trim() || "",

      address:
        address?.trim() || "",

      city:
        city?.trim() || "",

      subscriptionStartDate:
        startDate,

      subscriptionEndDate:
        endDate,

      status: "ACTIVE",
    });

    return res.status(201).json({
      success: true,
      message:
        "Hotel created successfully",
      data: hotel,
    });
  } catch (error) {
    console.error(
      "Create hotel error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create hotel",
    });
  }
};

// =====================================================
// GET ALL HOTELS
// =====================================================

export const getHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find()
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      message:
        "Hotels fetched successfully",
      data: hotels,
    });
  } catch (error) {
    console.error(
      "Get hotels error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch hotels",
    });
  }
};

// =====================================================
// GET HOTEL BY ID
// =====================================================

export const getHotelById = async (
  req,
  res
) => {
  try {
    const { hotelId } = req.params;

    const hotel =
      await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Hotel fetched successfully",
      data: hotel,
    });
  } catch (error) {
    console.error(
      "Get hotel by ID error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch hotel",
    });
  }
};

// =====================================================
// UPDATE HOTEL STATUS
// =====================================================

export const updateHotelStatus = async (
  req,
  res
) => {
  try {
    const { hotelId } = req.params;
    const { status } = req.body;

    const normalizedStatus = String(
      status || ""
    )
      .trim()
      .toUpperCase();

    if (
      !["ACTIVE", "INACTIVE"].includes(
        normalizedStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be ACTIVE or INACTIVE",
      });
    }

    const hotel =
      await Hotel.findByIdAndUpdate(
        hotelId,
        {
          status: normalizedStatus,
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        normalizedStatus === "ACTIVE"
          ? "Hotel activated successfully"
          : "Hotel deactivated successfully",
      data: hotel,
    });
  } catch (error) {
    console.error(
      "Update hotel status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update hotel status",
    });
  }
};

// =====================================================
// UPDATE HOTEL DETAILS
// =====================================================

export const updateHotel = async (
  req,
  res
) => {
  try {
    const { hotelId } = req.params;

    const {
      name,
      email,
      phone,
      address,
      city,
      subscriptionStartDate,
      subscriptionEndDate,
    } = req.body;

    const hotel =
      await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    // =================================================
    // UPDATE NAME
    // =================================================

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Hotel name cannot be empty",
        });
      }

      hotel.name = name.trim();
    }

    // =================================================
    // UPDATE EMAIL
    // =================================================

    if (email !== undefined) {
      const normalizedEmail = email
        .toLowerCase()
        .trim();

      const existingHotel =
        await Hotel.findOne({
          email: normalizedEmail,
          _id: {
            $ne: hotelId,
          },
        });

      if (existingHotel) {
        return res.status(409).json({
          success: false,
          message:
            "Another hotel already uses this email",
        });
      }

      hotel.email = normalizedEmail;
    }

    // =================================================
    // UPDATE PHONE
    // =================================================

    if (phone !== undefined) {
      hotel.phone =
        phone?.trim() || "";
    }

    // =================================================
    // UPDATE ADDRESS
    // =================================================

    if (address !== undefined) {
      hotel.address =
        address?.trim() || "";
    }

    // =================================================
    // UPDATE CITY
    // =================================================

    if (city !== undefined) {
      hotel.city =
        city?.trim() || "";
    }

    // =================================================
    // UPDATE SUBSCRIPTION START DATE
    // =================================================

    if (
      subscriptionStartDate !== undefined
    ) {
      const startDate = new Date(
        subscriptionStartDate
      );

      if (
        Number.isNaN(
          startDate.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid subscription start date",
        });
      }

      hotel.subscriptionStartDate =
        startDate;
    }

    // =================================================
    // UPDATE SUBSCRIPTION END DATE
    // =================================================

    if (
      subscriptionEndDate !== undefined
    ) {
      const endDate = new Date(
        subscriptionEndDate
      );

      if (
        Number.isNaN(
          endDate.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid subscription end date",
        });
      }

      hotel.subscriptionEndDate =
        endDate;
    }

    // =================================================
    // VALIDATE SUBSCRIPTION DATE RANGE
    // =================================================

    if (
      hotel.subscriptionStartDate &&
      hotel.subscriptionEndDate &&
      hotel.subscriptionEndDate <=
        hotel.subscriptionStartDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Subscription end date must be after the start date",
      });
    }

    // =================================================
    // SAVE HOTEL
    // =================================================

    await hotel.save();

    return res.status(200).json({
      success: true,
      message:
        "Hotel updated successfully",
      data: hotel,
    });
  } catch (error) {
    console.error(
      "Update hotel error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update hotel",
    });
  }
};

// =====================================================
// DELETE HOTEL
// =====================================================

export const deleteHotel = async (
  req,
  res
) => {
  try {
    const { hotelId } = req.params;

    const hotel =
      await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    await Hotel.findByIdAndDelete(
      hotelId
    );

    return res.status(200).json({
      success: true,
      message:
        "Hotel deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete hotel error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete hotel",
    });
  }
};
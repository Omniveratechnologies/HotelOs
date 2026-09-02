import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required"
      });
    }

    const user = await User
      .findOne({ username })
      .select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is disabled"
      });
    }

    const isPasswordCorrect =
      await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          role: user.role,
          hotelId: user.hotelId,
          roomId: user.roomId,
          mustChangePassword: user.mustChangePassword
        }
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
};

export const createSubAdmin = async (req, res) => {
  try {
    const { name, username, email, password, hotelId } = req.body;

    if (!name || !username || !email || !password || !hotelId) {
      return res.status(400).json({
        success: false,
        message: "name, username, email, password and hotelId are required"
      });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists"
      });
    }

    const subAdmin = await User.create({
      name,
      username,
      email,
      password,
      role: "SUB_ADMIN",
      hotelId
    });

    return res.status(201).json({
      success: true,
      message: "Sub Admin created successfully",
      data: {
        id: subAdmin._id,
        name: subAdmin.name,
        username: subAdmin.username,
        email: subAdmin.email,
        role: subAdmin.role,
        hotelId: subAdmin.hotelId
      }
    });

  } catch (error) {
    console.error("Create Sub Admin Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create Sub Admin"
    });
  }
};

// ---------Logout Contoller-----------

export const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logout successful"
  });
};


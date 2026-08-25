import mongoose from "mongoose";

const userInviteSchema = new mongoose.Schema(
  {
    // The user who was invited
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // The hotel this invited user belongs to
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      default: null,
    },

    // Role assigned through the invitation
    role: {
      type: String,
      required: true,
      enum: [
        "SUB_ADMIN",
        "RECEPTIONIST",
        "KITCHEN",
      ],
    },

    // Secure invitation token
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Invitation expiry
    expiresAt: {
      type: Date,
      required: true,
    },

    // Invitation status
    status: {
      type: String,
      enum: [
        "PENDING",
        "ACCEPTED",
        "EXPIRED",
        "CANCELLED",
      ],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
  }
);

const UserInvite = mongoose.model(
  "UserInvite",
  userInviteSchema
);

export default UserInvite;
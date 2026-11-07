import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    hotelCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    city: {
      type: String,
      trim: true,
      default: "",
    },

    state: {
      type: String,
      trim: true,
      default: "",
    },

    pincode: {
      type: String,
      trim: true,
      default: "",
    },

    country: {
      type: String,
      trim: true,
      default: "India",
    },

    currency: {
      type: String,
      trim: true,
      default: "INR",
    },

    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    cancellationPolicy: {
      type: String,
      trim: true,
      default: "",
    },

    termsAndConditions: {
      type: String,
      trim: true,
      default: "",
    },

    checkInTime: {
      type: String,
      trim: true,
      default: "14:00",
    },

    checkOutTime: {
      type: String,
      trim: true,
      default: "12:00",
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },

    subscriptionStartDate: {
      type: Date,
      default: null,
    },

    subscriptionEndDate: {
      type: Date,
      default: null,
    },

    // Maps this hotel to Aiosell's property identifier (hotelCode in API
    // payloads). Set by SUPER_ADMIN during channel manager onboarding.
    aiosellHotelCode: { type: String, trim: true, default: null },

    wifiNetworkName: {
      type: String,
      trim: true,
      default: null,
    },
    wifiPassword: {
      type: String,
      trim: true,
      default: null,
    },

    // Default tax applied to reservations (whole percent, e.g. 12). Can be
    // overridden per reservation at booking time.
    taxPercent: {
      type: Number,
      default: 12,
      min: 0,
    },

    // Physical coordinates for proximity verification
    coordinates: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },

    // Geolocation verification policy settings
    locationSettings: {
      tableRadiusMeters: { type: Number, default: 50 },
      hotelRadiusMeters: { type: Number, default: 100 },
      maxAccuracyMeters: { type: Number, default: 50 },
      isLocationVerificationRequired: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Hotel", hotelSchema);

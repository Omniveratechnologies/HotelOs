import mongoose from "mongoose";

const corporateCompanySchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },

    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    phonePrefix: {
      type: String,
      default: "+91",
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    address: {
      type: String,
      trim: true,
    },

    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },

    billingType: {
      type: String,
      enum: ["Corporate Account", "Guest Pays Extras Only", "Guest Pays All"],
      default: "Corporate Account",
    },

    creditLimit: {
      type: Number,
      default: 0,
      min: 0,
    },

    paymentTerms: {
      type: String,
      enum: ["CASH", "7 DAYS", "15 DAYS", "30 DAYS", "45 DAYS", "60 DAYS"],
      default: "30 DAYS",
    },

    costCenter: {
      type: String,
      trim: true,
    },

    tier: {
      type: String,
      enum: ["Standard", "Preferred Partner", "Strategic Partner"],
      default: "Standard",
    },

    creditFacility: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  },
);

corporateCompanySchema.index({ hotelId: 1, name: 1 }, { unique: true });

const CorporateCompany = mongoose.model(
  "CorporateCompany",
  corporateCompanySchema,
);

export default CorporateCompany;

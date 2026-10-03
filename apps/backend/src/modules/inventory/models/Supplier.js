import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    supplierName: {
      type: String,
      required: true,
      trim: true,
    },

    supplierCode: {
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

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    companyName: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },

    addressLine2: {
      type: String,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
    },

    state: {
      type: String,
      trim: true,
    },

    pincode: {
      type: String,
      trim: true,
    },

    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },

    paymentTerms: {
      type: String,
      enum: ["CASH", "7 DAYS", "15 DAYS", "30 DAYS", "45 DAYS"],
      default: "CASH",
    },

    categories: {
      type: [String],
      required: true,
      validate: {
        validator: (categories) => categories.length > 0,
        message: "At least one category is required",
      },
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

const Supplier = mongoose.model("Supplier", supplierSchema);

export default Supplier;

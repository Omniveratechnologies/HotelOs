import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const staffShiftSchema = new Schema(
  {
    hotelId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

staffShiftSchema.index({ hotelId: 1, name: 1 }, { unique: true });

export const StaffShift =
  models.StaffShift || model("StaffShift", staffShiftSchema);

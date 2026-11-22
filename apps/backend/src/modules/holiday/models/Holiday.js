import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

export const HOLIDAY_TYPES = ["NATIONAL", "CUSTOM"];

const holidaySchema = new Schema(
  {
    hotelId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    nameKey: { type: String, required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    type: { type: String, enum: HOLIDAY_TYPES, default: "CUSTOM" },
    description: { type: String, trim: true, maxlength: 200, default: "" },
    isRecurring: { type: Boolean, default: false },
    seriesId: { type: Schema.Types.ObjectId, default: null },
    appliesToDepartments: { type: [Schema.Types.ObjectId], default: [] },
    holidayDuty: { type: Boolean, default: false },
  },
  { timestamps: true },
);

holidaySchema.index({ hotelId: 1, date: 1, nameKey: 1 }, { unique: true });
holidaySchema.index({ hotelId: 1, seriesId: 1, date: 1 });

export const Holiday =
  models.StaffHoliday || model("StaffHoliday", holidaySchema);

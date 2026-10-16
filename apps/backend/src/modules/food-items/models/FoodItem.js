import mongoose from "mongoose";

const foodItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    shortDescription: { type: String, trim: true, default: "" },
    description: { type: String, trim: true },
    price: { type: Number, required: true },
    category: { type: String, trim: true, default: "General" },
    subCategory: { type: String, trim: true, default: "" },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      set: (v) => (v === "" || v === undefined ? null : v),
    },
    images: { type: [String], default: [] },
    image: { type: String, default: "" },
    foodType: { type: String, enum: ["veg", "non-veg", "egg"], default: "veg" },
    gst: { type: Number, default: 5, min: 0 },
    gstMode: {
      type: String,
      enum: ["percentage", "fixed", "none"],
      default: "percentage",
    },
    charges: { type: Number, default: 0, min: 0 },
    additionalCharges: {
      type: [
        {
          name: String,
          type: {
            type: String,
            enum: ["fixed", "percentage"],
            default: "fixed",
          },
          value: Number,
          status: { type: Boolean, default: true },
        },
      ],
      default: [],
    },
    channelPricing: {
      dineIn: { price: Number, active: { type: Boolean, default: true } },
      takeaway: { price: Number, active: { type: Boolean, default: true } },
      delivery: { price: Number, active: { type: Boolean, default: true } },
      roomService: { price: Number, active: { type: Boolean, default: true } },
    },
    stock: { type: Number, default: 0, min: 0 },
    minStock: { type: Number, default: 0, min: 0 },
    maxStock: { type: Number, default: 0, min: 0 },
    trackInventory: { type: Boolean, default: false },
    availability: { type: String, default: "Always" },
    isVeg: { type: Boolean, default: false },
    isSpicy: { type: Boolean, default: false },
    isChefSpecial: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false },
    isNewItem: { type: Boolean, default: false },
    isRoomServiceAvailable: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    tags: { type: [String], default: [] },
    modifierGroupIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "ModifierGroup",
      default: [],
    },
    kitchenStation: { type: String, default: "" },
    prepTimeMinutes: { type: Number, default: 0 },
    availabilityChannels: {
      dineIn: { type: Boolean, default: true },
      takeaway: { type: Boolean, default: true },
      delivery: { type: Boolean, default: true },
      roomService: { type: Boolean, default: true },
    },
    mealPeriods: { type: [String], default: [] },
    timeAvailability: {
      enabled: { type: Boolean, default: false },
      slots: { type: [{ start: String, end: String }], default: [] },
    },
    dayAvailability: {
      type: [String],
      default: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
    stockRule: {
      enabled: { type: Boolean, default: false },
      ingredientName: { type: String, default: "" },
      currentQty: { type: Number, default: 0 },
      minQty: { type: Number, default: 0 },
    },
    temporaryAvailability: {
      available: { type: Boolean, default: true },
      reason: { type: String, default: "" },
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("FoodItem", foodItemSchema);

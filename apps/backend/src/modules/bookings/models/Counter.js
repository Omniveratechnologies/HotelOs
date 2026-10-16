import mongoose from "mongoose";

// Generic per-scope sequential counter (used for reservation numbers).
const counterSchema = new mongoose.Schema({
  scope: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

export default mongoose.model("Counter", counterSchema);

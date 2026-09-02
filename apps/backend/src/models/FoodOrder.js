// Created by: Jinetta Shree
// Purpose: Handles Kitchen Dashboard data (Schema)

import mongoose from "mongoose";

const foodOrderSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: Number,
      required: true,
    },

    guest: {
      type: String,
      required: true,
    },

    items: [
      {
        name: {
          type: String,
          required: true,
        },

        quantity: {
          type: Number,
          required: true,
        },

        price: {
          type: Number,
          required: true,
        },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },

    paymentMethod: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      default: "NEW",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("FoodOrder", foodOrderSchema);

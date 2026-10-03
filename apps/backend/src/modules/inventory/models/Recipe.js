import mongoose from "mongoose";

const recipeIngredientSchema = new mongoose.Schema(
  {
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },

    quantityPerServing: {
      type: Number,
      required: true,
      min: 0,
    },

    unit: {
      type: String,
      required: true,
      trim: true,
    },

    costPerUnit: {
      type: Number,
      required: true,
      min: 0,
    },

    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true },
);

const recipeSchema = new mongoose.Schema(
  {
    menuItemName: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    servingSize: {
      type: Number,
      required: true,
      min: 0,
    },

    servingUnit: {
      type: String,
      required: true,
      trim: true,
    },

    preparationTime: {
      type: Number,
      required: true,
      min: 0,
    },

    preparationTimeUnit: {
      type: String,
      required: true,
      trim: true,
    },

    cuisineType: {
      type: String,
      required: true,
      trim: true,
    },

    difficultyLevel: {
      type: String,
      required: true,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },

    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    ingredients: {
      type: [recipeIngredientSchema],
      default: [],
    },

    packagingCost: {
      type: Number,
      min: 0,
      default: 0,
    },

    preparationOverhead: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalIngredientCost: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalFoodCost: {
      type: Number,
      min: 0,
      default: 0,
    },

    foodCostPercentage: {
      type: Number,
      min: 0,
      default: 0,
    },

    profitAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    profitMarginPercentage: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const Recipe = mongoose.model("Recipe", recipeSchema);

export default Recipe;

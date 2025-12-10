const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: {
      type: Number, // 1-12
      required: [true, "Month is required"],
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
    },
    totalBudget: {
      type: Number,
      required: [true, "Total budget amount is required"],
      min: 0,
    },
    categories: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        spent: {
          type: Number,
          default: 0,
          min: 0,
        },
        icon: {
          type: String,
          default: "wallet",
        },
        color: {
          type: String,
          default: "#4CAF50",
        },
      },
    ],
    currency: {
      type: String,
      default: "INR",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Compound index to ensure one budget per user per month/year
budgetSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("Budget", budgetSchema);

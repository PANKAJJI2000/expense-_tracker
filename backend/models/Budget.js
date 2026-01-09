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
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
    },
    totalBudget: {
      type: Number,
      required: [true, "Total budget amount is required"],
      min: 0,
    },
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

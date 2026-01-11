const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    totalBudget: {
      type: Number,
      required: true,
      default: 0,
    },
    month: {
      type: Number, // 1-12
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
    },
    currency: {
      type: String,
      default: "INR",
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
budgetSchema.index({ userId: 1, month: 1, year: 1 });

module.exports = mongoose.model("Budget", budgetSchema);

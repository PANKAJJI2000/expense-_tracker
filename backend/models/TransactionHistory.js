const mongoose = require("mongoose");

const TransactionHistorySchema = new mongoose.Schema({
  // Reference to Profile (the user)
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Profile", // Changed from "User" to "Profile"
    required: true 
  },
  
  // Transaction date (Sep 25, Sep 21, etc.)
  date: { 
    type: Date, 
    required: true,
    default: Date.now
  },
  
  // Title/Name of transaction (Flipkart, Youtube, Money Transfer, Books)
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  
  // Amount (350.00, 700.00, 1250.00, 1100.00)
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  
  // Type: income (green color) or expense (red color)
  type: { 
    type: String, 
    enum: ["income", "expense"], 
  },
  
  // Category (Shopping, Entertainment, Transfer, Education, etc.)
  category: { 
    type: String, 
    required: true,
    trim: true
  },
  
  // Icon for display (shopping bag, play button, transfer arrow, book)
  icon: { 
    type: String,
    default: "💰" // Default icon if none provided
  },
  
  // Optional note/description
  note: { 
    type: String,
    trim: true
  },
  
  // Payment method (optional)
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'digital_wallet', 'upi'],
    default: 'cash'
  },
  
  // Status of transaction
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  }
  
}, { 
  timestamps: true // Adds createdAt and updatedAt
});

// Add indexes for better query performance
TransactionHistorySchema.index({ userId: 1, date: -1 });
TransactionHistorySchema.index({ type: 1 });
TransactionHistorySchema.index({ category: 1 });

module.exports = mongoose.model("TransactionHistory", TransactionHistorySchema);

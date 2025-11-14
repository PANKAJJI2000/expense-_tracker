const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // The user who owns this transaction (Important for security)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to your User model
    required: true,
  },
  
  // The category of the transaction
  category: {
    type: String,
    required: false, // Made optional as it's not in the screenshot
  },
  
  // Item name/title - "Enter the item" field from screenshot
  item: {
    type: String,
    required: true,
    trim: true,
  },
  
  // The monetary value of the transaction - "Enter the Amount" field
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  
  // Invoice upload - stores file path or URL
  invoice: {
    type: String,
    default: null
  },
  
  // The date of the transaction
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  
  // The method of payment used for the transaction
  paymentMethod: {
    type: String,
    default: 'cash'
  },
  
  // The current status of the transaction
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed',
  }
}, {
  // Adds createdAt and updatedAt timestamps automatically
  timestamps: true,
});

// Create the model
const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;

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
    default: 'General'
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
    required: true
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
  },
  
  // The type of transaction - income or expense
  type: {
    type: String,
    enum: ['income', 'expense'],
    default: 'expense'
  },
  
  // Additional fields for user information
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  }
}, {
  // Adds createdAt and updatedAt timestamps automatically
  timestamps: true,
});

// Create the model
const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // The user who owns this transaction (Important for security)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to your User model
    required: true,
    index: true
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
  
  // The date of the transaction
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // The category of the transaction
  category: {
    type: String,
    default: 'General'
  },
  
  // The type of transaction - income or expense
  type: {
    type: String,
    enum: ['income', 'expense'],
    default: 'expense',
    index: true
  },
  
  // Icon for the transaction, if any
  icon: {
    type: String,
    default: ''
  },
  
  // Invoice upload - stores file path or URL
  invoice: {
    type: String,
    default: null
  },
  
  // The method of payment used for the transaction
  paymentMethod: {
    type: String,
    default: 'cash'
  },
  
  // The current status of the transaction
  status: {
    type: String,
    enum: ['completed', 'pending', 'cancelled'],
    default: 'completed'
  },
  
  // Additional fields for user information
  fullName: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  }
}, {
  // Adds createdAt and updatedAt timestamps automatically
  timestamps: true,
});

// Create indexes for better query performance
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, createdAt: -1 });

// Create the model
const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;

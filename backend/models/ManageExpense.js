const mongoose = require('mongoose');

const manageExpenseSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  annualExpense: {
    type: Number,
    required: true,
    min: 0
  },
  expenseProof: {
    type: String, // Store file path
    // required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional if you want to allow anonymous submissions
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ManageExpense', manageExpenseSchema);

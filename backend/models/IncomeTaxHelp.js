const mongoose = require('mongoose');

const incomeTaxHelpSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  annualIncome: {
    type: Number,
    required: true,
    min: 0
  },
  incomeStatement: {
    type: String, // Store file path
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional if you want to allow anonymous submissions
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('IncomeTaxHelp', incomeTaxHelpSchema);

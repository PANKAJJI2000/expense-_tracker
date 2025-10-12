const mongoose = require('mongoose');

const autoExpenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  expenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense',
    default: null,
    index: true
  },
  detectedDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  detectedAmount: {
    type: Number,
    required: true,
    min: 0,
    get: function(value) {
      return parseFloat(value.toFixed(2));
    }
  },
  detectedTitle: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  status: {
    type: String,
    enum: ['Detected', 'Saved', 'Dismissed'],
    default: 'Detected',
    required: true,
    index: true
  },
  originalDate: {
    type: Date,
    required: true
  },
  // Additional fields for better tracking
  source: {
    type: String,
    enum: ['SMS', 'Email', 'Bank_Statement', 'Receipt_Scan'],
    default: 'SMS'
  },
  category: {
    type: String,
    default: 'Uncategorized'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 80
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Compound index for efficient filtering
autoExpenseSchema.index({ userId: 1, status: 1, detectedDate: -1 });
autoExpenseSchema.index({ userId: 1, expenseId: 1 });

// Static methods for filtering
autoExpenseSchema.statics.getFilteredExpenses = function(userId, filter = 'All') {
  const query = { userId };
  
  if (filter !== 'All') {
    query.status = filter;
  }
  
  return this.find(query)
    .sort({ detectedDate: -1 })
    .populate('userId', 'name email')
    .populate('expenseId', 'amount title category');
};

// Instance methods
autoExpenseSchema.methods.markAsSaved = function(expenseId = null) {
  this.status = 'Saved';
  if (expenseId) {
    this.expenseId = expenseId;
  }
  return this.save();
};

autoExpenseSchema.methods.markAsDismissed = function() {
  this.status = 'Dismissed';
  return this.save();
};

autoExpenseSchema.methods.getDisplayInfo = function() {
  return {
    id: this._id,
    expenseId: this.expenseId,
    amount: this.detectedAmount,
    title: this.detectedTitle,
    status: this.status,
    date: this.detectedDate,
    source: this.source
  };
};

// Pre-save middleware for validation
autoExpenseSchema.pre('save', function(next) {
  if (this.originalDate > new Date()) {
    return next(new Error('Original date cannot be in the future'));
  }
  if (!this.detectedAmount || this.detectedAmount <= 0) {
    return next(new Error('Detected amount must be greater than 0'));
  }
  next();
});

module.exports = mongoose.model('AutoExpense', autoExpenseSchema);

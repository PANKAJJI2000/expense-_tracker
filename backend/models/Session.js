const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'superadmin'],
    default: 'user'
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  loginTime: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  endedAt: {
    type: Date
  },
  requestPath: {
    type: String
  },
  requestMethod: {
    type: String
  },
  activityLog: [{
    action: String,
    path: String,
    method: String,
    timestamp: { type: Date, default: Date.now },
    ipAddress: String
  }]
}, {
  timestamps: true
});

// Compound indexes for efficient queries
sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ sessionId: 1, isActive: 1 });
sessionSchema.index({ email: 1, isActive: 1 });
sessionSchema.index({ lastActivity: 1, isActive: 1 });

// Auto-expire old inactive sessions (30 days)
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Virtual for session duration
sessionSchema.virtual('duration').get(function() {
  const endTime = this.endedAt || new Date();
  return Math.floor((endTime - this.loginTime) / 1000); // Duration in seconds
});

// Virtual for session age
sessionSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.loginTime) / 1000); // Age in seconds
});

// Instance method to check if session is expired
sessionSchema.methods.isExpired = function(timeoutMs = 24 * 60 * 60 * 1000) {
  const age = Date.now() - new Date(this.lastActivity).getTime();
  return age > timeoutMs;
};

// Static method to get active sessions for a user
sessionSchema.statics.getActiveSessions = function(userId) {
  return this.find({ userId, isActive: true }).sort({ lastActivity: -1 });
};

// Static method to get session statistics
sessionSchema.statics.getStatistics = async function() {
  const [activeCount, totalCount, todayCount, last24h] = await Promise.all([
    this.countDocuments({ isActive: true }),
    this.countDocuments(),
    this.countDocuments({
      loginTime: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    }),
    this.countDocuments({
      loginTime: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
  ]);

  return {
    active: activeCount,
    total: totalCount,
    today: todayCount,
    last24Hours: last24h
  };
};

module.exports = mongoose.model('Session', sessionSchema);

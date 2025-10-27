const Session = require('../models/Session');

// Track active session in database
const trackSession = async (req, res, next) => {
  try {
    if (req.session && req.session.user) {
      const sessionData = {
        sessionId: req.sessionID,
        userId: req.session.user.id || req.session.user._id,
        email: req.session.user.email,
        role: req.session.user.role,
        ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'],
        userAgent: req.get('user-agent'),
        lastActivity: new Date(),
        isActive: true,
        requestPath: req.path,
        requestMethod: req.method
      };

      await Session.findOneAndUpdate(
        { sessionId: req.sessionID },
        sessionData,
        { upsert: true, new: true }
      );
    }
    next();
  } catch (error) {
    console.error('Session tracking error:', error);
    next(); // Continue even if tracking fails
  }
};

// Require authentication - validates session exists
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please login to access this resource'
    });
  }
  next();
};

// Require admin role
const requireAdmin = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please login to access this resource'
    });
  }

  if (req.session.user.role !== 'admin' && req.session.user.role !== 'superadmin') {
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'Admin privileges required'
    });
  }

  next();
};

// Validate session integrity
const validateSession = async (req, res, next) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'No active session' });
    }

    // Check if session exists in database
    const session = await Session.findOne({ 
      sessionId: req.sessionID,
      isActive: true 
    });

    if (!session) {
      if (req.session.destroy) {
        req.session.destroy();
      }
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    // Check for session timeout (24 hours)
    const sessionAge = Date.now() - new Date(session.lastActivity).getTime();
    const timeout = parseInt(process.env.SESSION_TIMEOUT) || 24 * 60 * 60 * 1000;

    if (sessionAge > timeout) {
      await Session.findOneAndUpdate(
        { sessionId: req.sessionID },
        { isActive: false, endedAt: new Date() }
      );
      
      if (req.session.destroy) {
        req.session.destroy();
      }
      
      return res.status(401).json({ 
        error: 'Session timeout',
        message: 'Your session has expired. Please login again.'
      });
    }

    // Attach user info to request
    req.user = req.session.user;
    next();
  } catch (error) {
    console.error('Session validation error:', error);
    res.status(500).json({ error: 'Session validation failed' });
  }
};

// Cleanup expired sessions
const cleanupExpiredSessions = async () => {
  try {
    const timeout = parseInt(process.env.SESSION_TIMEOUT) || 24 * 60 * 60 * 1000;
    const expiryTime = new Date(Date.now() - timeout);
    
    const result = await Session.updateMany(
      { 
        lastActivity: { $lt: expiryTime }, 
        isActive: true 
      },
      { 
        isActive: false, 
        endedAt: new Date() 
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`🧹 Cleaned up ${result.modifiedCount} expired sessions`);
    }
  } catch (error) {
    console.error('Session cleanup error:', error);
  }
};

// Log session activity
const logSessionActivity = async (req, action = 'activity') => {
  try {
    if (req.session && req.session.user) {
      await Session.findOneAndUpdate(
        { sessionId: req.sessionID },
        { 
          $push: { 
            activityLog: {
              action,
              path: req.path,
              method: req.method,
              timestamp: new Date(),
              ipAddress: req.ip
            }
          },
          lastActivity: new Date()
        }
      );
    }
  } catch (error) {
    console.error('Session activity logging error:', error);
  }
};

// Get active sessions count
const getActiveSessionsCount = async (userId = null) => {
  try {
    const query = { isActive: true };
    if (userId) {
      query.userId = userId;
    }
    return await Session.countDocuments(query);
  } catch (error) {
    console.error('Error getting active sessions count:', error);
    return 0;
  }
};

// Terminate all user sessions
const terminateUserSessions = async (userId) => {
  try {
    const result = await Session.updateMany(
      { userId, isActive: true },
      { isActive: false, endedAt: new Date() }
    );
    return result.modifiedCount;
  } catch (error) {
    console.error('Error terminating user sessions:', error);
    return 0;
  }
};

// Run cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

// Run initial cleanup on startup
setTimeout(cleanupExpiredSessions, 5000);

module.exports = {
  trackSession,
  requireAuth,
  requireAdmin,
  validateSession,
  cleanupExpiredSessions,
  logSessionActivity,
  getActiveSessionsCount,
  terminateUserSessions
};

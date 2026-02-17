const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Admin Authentication Middleware
 * Verifies JWT token and checks for admin role
 * Attaches admin info to req.admin including id, email, and role
 */
const adminAuth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided. Authorization header required.' 
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET
    );

    // Get user ID from token (supports both 'userId' and 'id' formats)
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format'
      });
    }

    // Fetch user from database to verify admin status
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has admin role (from token or database)
    const isAdmin = decoded.role === 'admin' || user.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Admin privileges required.' 
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Attach admin info to request
    req.admin = {
      id: user._id,
      email: user.email || decoded.email,
      role: 'admin',
      name: user.name
    };

    next();
  } catch (error) {
    console.error('Admin auth error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired. Please login again.' 
      });
    }

    return res.status(500).json({ 
      success: false,
      message: 'Authentication failed',
      error: error.message 
    });
  }
};

/**
 * Optional Admin Auth - Allows requests without token but attaches admin info if token exists
 * Useful for routes that can work both with and without authentication
 */
const optionalAdminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token, continue without admin info
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(
      token,
      process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET
    );

    const userId = decoded.userId || decoded.id;
    
    if (userId) {
      const user = await User.findById(userId).select('-password');
      
      if (user && (decoded.role === 'admin' || user.role === 'admin') && user.isActive) {
        req.admin = {
          id: user._id,
          email: user.email || decoded.email,
          role: 'admin',
          name: user.name
        };
      }
    }

    next();
  } catch (error) {
    // Token invalid but optional, continue without admin info
    next();
  }
};

module.exports = adminAuth;
module.exports.optionalAdminAuth = optionalAdminAuth;

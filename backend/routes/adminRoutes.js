const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Import middleware
let adminAuth;
try {
  adminAuth = require('../middleware/adminAuth');
  console.log('✓ adminAuth middleware loaded successfully');
} catch (error) {
  console.error('✗ Failed to load adminAuth middleware:', error.message);
  // Create a simple fallback middleware
  adminAuth = (req, res, next) => {
    console.warn('⚠ Using fallback adminAuth - authentication bypassed');
    next();
  };
}

// Import admin controller
let adminController;
try {
  adminController = require('../controllers/adminController');
  console.log('✓ adminController loaded successfully');
  console.log('Available functions:', Object.keys(adminController));
} catch (error) {
  console.error('✗ Failed to load adminController:', error.message);
  process.exit(1); // Exit if controller can't be loaded
}

// Verify all required functions exist
const requiredFunctions = [
  'adminLogin', 'verifyAdmin', 'getDashboardStats', 'getMonthlyExpenses',
  'getCategoryBreakdown', 'getUsers', 'updateUser', 'deleteUser',
  'getExpenses', 'deleteExpense', 'getCategories', 'createCategory',
  'updateCategory', 'deleteCategory', 'getStats', 'getUpdatedExpenses',
  'getTrends', 'getCategoryStats', 'getMonthlyStats', 'getTopUsers'
];

const missingFunctions = requiredFunctions.filter(fn => typeof adminController[fn] !== 'function');
if (missingFunctions.length > 0) {
  console.error('✗ Missing functions in adminController:', missingFunctions);
  console.error('Available functions:', Object.keys(adminController).filter(key => typeof adminController[key] === 'function'));
  process.exit(1);
}

// Destructure controller functions
const {
  adminLogin,
  verifyAdmin,
  getDashboardStats,
  getMonthlyExpenses,
  getCategoryBreakdown,
  getUsers,
  updateUser,
  deleteUser,
  getExpenses,
  deleteExpense,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAutoExpenses,
  updateAutoExpense,
  deleteAutoExpense,
  getProfiles,
  updateProfile,
  deleteProfile,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getTransactionHistory,
  deleteTransactionHistory,
  getStats,
  getUpdatedExpenses,
  getTrends,
  getCategoryStats,
  getMonthlyStats,
  getTopUsers
} = adminController;

// Verify each function before using it
const verifyFunction = (fn, name) => {
  if (typeof fn !== 'function') {
    console.error(`✗ ${name} is not a function, it's a ${typeof fn}`);
    throw new Error(`${name} must be a function`);
  }
  return fn;
};

// Public routes
router.post('/login', verifyFunction(adminLogin, 'adminLogin'));

// Protected admin routes
router.get('/verify', adminAuth, verifyFunction(verifyAdmin, 'verifyAdmin'));

// Dashboard endpoints
router.get('/stats', adminAuth, verifyFunction(getStats, 'getStats'));
router.get('/updated-expenses', adminAuth, verifyFunction(getUpdatedExpenses, 'getUpdatedExpenses'));
router.get('/trends', adminAuth, verifyFunction(getTrends, 'getTrends'));
router.get('/category-stats', adminAuth, verifyFunction(getCategoryStats, 'getCategoryStats'));
router.get('/monthly-stats', adminAuth, verifyFunction(getMonthlyStats, 'getMonthlyStats'));
router.get('/top-users', adminAuth, verifyFunction(getTopUsers, 'getTopUsers'));

// Legacy dashboard endpoints
router.get('/dashboard/stats', adminAuth, verifyFunction(getDashboardStats, 'getDashboardStats'));
router.get('/monthly-expenses', adminAuth, verifyFunction(getMonthlyExpenses, 'getMonthlyExpenses'));
router.get('/category-breakdown', adminAuth, verifyFunction(getCategoryBreakdown, 'getCategoryBreakdown'));

// User management
router.get('/users', adminAuth, verifyFunction(getUsers, 'getUsers'));
router.put('/users/:id', adminAuth, verifyFunction(updateUser, 'updateUser'));
router.delete('/users/:id', adminAuth, verifyFunction(deleteUser, 'deleteUser'));

// Expense management
router.get('/expenses', adminAuth, verifyFunction(getExpenses, 'getExpenses'));
router.delete('/expenses/:id', adminAuth, verifyFunction(deleteExpense, 'deleteExpense'));

// Category management
router.get('/categories', adminAuth, verifyFunction(getCategories, 'getCategories'));
router.post('/categories', adminAuth, verifyFunction(createCategory, 'createCategory'));
router.put('/categories/:id', adminAuth, verifyFunction(updateCategory, 'updateCategory'));
router.delete('/categories/:id', adminAuth, verifyFunction(deleteCategory, 'deleteCategory'));

// Auto Expense management (optional - only if functions exist)
if (getAutoExpenses) {
  router.get('/auto-expenses', adminAuth, verifyFunction(getAutoExpenses, 'getAutoExpenses'));
  router.put('/auto-expenses/:id', adminAuth, verifyFunction(updateAutoExpense, 'updateAutoExpense'));
  router.delete('/auto-expenses/:id', adminAuth, verifyFunction(deleteAutoExpense, 'deleteAutoExpense'));
}

// Profile management (optional - only if functions exist)
if (getProfiles) {
  router.get('/profiles', adminAuth, verifyFunction(getProfiles, 'getProfiles'));
  router.put('/profiles/:id', adminAuth, verifyFunction(updateProfile, 'updateProfile'));
  router.delete('/profiles/:id', adminAuth, verifyFunction(deleteProfile, 'deleteProfile'));
}

// Transaction management (optional - only if functions exist)
if (getTransactions) {
  router.get('/transactions', adminAuth, verifyFunction(getTransactions, 'getTransactions'));
  router.put('/transactions/:id', adminAuth, verifyFunction(updateTransaction, 'updateTransaction'));
  router.delete('/transactions/:id', adminAuth, verifyFunction(deleteTransaction, 'deleteTransaction'));
}

// Transaction History management (optional - only if functions exist)
if (getTransactionHistory) {
  router.get('/transaction-history', adminAuth, verifyFunction(getTransactionHistory, 'getTransactionHistory'));
  router.delete('/transaction-history/:id', adminAuth, verifyFunction(deleteTransactionHistory, 'deleteTransactionHistory'));
}

// Session management routes
router.get('/sessions', adminAuth, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const sessionsCollection = db.collection('sessions');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const sessions = await sessionsCollection
      .find({})
      .sort({ expires: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const totalSessions = await sessionsCollection.countDocuments();
    
    const parsedSessions = sessions.map(session => {
      let sessionData = {};
      try {
        sessionData = JSON.parse(session.session || '{}');
      } catch (e) {
        sessionData = session.session || {};
      }
      
      return {
        _id: session._id,
        sessionId: session._id,
        expires: session.expires,
        user: sessionData.user || null,
        lastActivity: sessionData.lastActivity || null,
        cookie: sessionData.cookie || null,
        isExpired: new Date(session.expires) < new Date()
      };
    });
    
    const activeSessions = parsedSessions.filter(s => !s.isExpired).length;
    const expiredSessions = parsedSessions.filter(s => s.isExpired).length;
    
    res.json({
      success: true,
      data: parsedSessions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalSessions / limit),
        totalSessions,
        limit,
        activeSessions,
        expiredSessions
      }
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch session records',
      details: error.message 
    });
  }
});

router.get('/sessions/stats', adminAuth, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const sessionsCollection = db.collection('sessions');
    
    const totalSessions = await sessionsCollection.countDocuments();
    const now = new Date();
    
    const activeSessions = await sessionsCollection.countDocuments({
      expires: { $gt: now }
    });
    
    const expiredSessions = totalSessions - activeSessions;
    
    const allSessions = await sessionsCollection.find({}).toArray();
    const userSessions = {};
    
    allSessions.forEach(session => {
      try {
        const sessionData = JSON.parse(session.session || '{}');
        if (sessionData.user && sessionData.user.email) {
          const email = sessionData.user.email;
          userSessions[email] = (userSessions[email] || 0) + 1;
        }
      } catch (e) {
        // Skip unparseable sessions
      }
    });
    
    res.json({
      success: true,
      stats: {
        total: totalSessions,
        active: activeSessions,
        expired: expiredSessions,
        userBreakdown: userSessions,
        uniqueUsers: Object.keys(userSessions).length
      }
    });
  } catch (error) {
    console.error('Error fetching session stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch session statistics',
      details: error.message 
    });
  }
});

router.delete('/sessions/cleanup', adminAuth, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const sessionsCollection = db.collection('sessions');
    
    const result = await sessionsCollection.deleteMany({
      expires: { $lt: new Date() }
    });
    
    res.json({
      success: true,
      message: 'Expired sessions cleaned up',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to cleanup sessions',
      details: error.message 
    });
  }
});

console.log('✓ Admin routes configured successfully');

module.exports = router;
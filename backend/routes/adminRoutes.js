const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
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
  // Auto Expense routes
  getAutoExpenses,
  updateAutoExpense,
  deleteAutoExpense,
  // Profile routes
  getProfiles,
  updateProfile,
  deleteProfile,
  // Transaction routes
  getTransactions,
  updateTransaction,
  deleteTransaction,
  // Transaction History routes
  getTransactionHistory,
  deleteTransactionHistory,
  // Recent Expenses
  getRecentExpenses
} = require('../controllers/adminController');

// Public routes
router.post('/login', adminLogin);

// Protected admin routes
router.get('/verify', adminAuth, verifyAdmin);
router.get('/stats', adminAuth, getDashboardStats);
router.get('/monthly-expenses', adminAuth, getMonthlyExpenses);
router.get('/category-breakdown', adminAuth, getCategoryBreakdown);
router.get('/users', adminAuth, getUsers);
router.put('/users/:id', adminAuth, updateUser);
router.delete('/users/:id', adminAuth, deleteUser);

// Expense management
router.get('/expenses', adminAuth, getExpenses);
router.delete('/expenses/:id', adminAuth, deleteExpense);

// Category management
router.get('/categories', adminAuth, getCategories);
router.post('/categories', adminAuth, createCategory);
router.put('/categories/:id', adminAuth, updateCategory);
router.delete('/categories/:id', adminAuth, deleteCategory);

// Auto Expense management
router.get('/auto-expenses', adminAuth, getAutoExpenses);
router.put('/auto-expenses/:id', adminAuth, updateAutoExpense);
router.delete('/auto-expenses/:id', adminAuth, deleteAutoExpense);

// Profile management
router.get('/profiles', adminAuth, getProfiles);
router.put('/profiles/:id', adminAuth, updateProfile);
router.delete('/profiles/:id', adminAuth, deleteProfile);

// Transaction management
router.get('/transactions', adminAuth, getTransactions);
router.put('/transactions/:id', adminAuth, updateTransaction);
router.delete('/transactions/:id', adminAuth, deleteTransaction);

// Transaction History management
router.get('/transaction-history', adminAuth, getTransactionHistory);
router.delete('/transaction-history/:id', adminAuth, deleteTransactionHistory);

// Add this route to get session records
router.get('/sessions', async (req, res) => {
  try {
    // Access the sessions collection directly from MongoDB
    const db = req.app.locals.db || mongoose.connection.db;
    const sessionsCollection = db.collection('sessions');
    
    // Get all sessions with pagination
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
    
    // Parse session data
    const parsedSessions = sessions.map(session => {
      let sessionData = {};
      try {
        // Sessions are stored as JSON strings in the 'session' field
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
    
    // Get active vs expired count
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

// Add route to get session statistics
router.get('/sessions/stats', async (req, res) => {
  try {
    const db = req.app.locals.db || mongoose.connection.db;
    const sessionsCollection = db.collection('sessions');
    
    const totalSessions = await sessionsCollection.countDocuments();
    const now = new Date();
    
    const activeSessions = await sessionsCollection.countDocuments({
      expires: { $gt: now }
    });
    
    const expiredSessions = totalSessions - activeSessions;
    
    // Get sessions by user (requires parsing session data)
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

// Add route to delete expired sessions
router.delete('/sessions/cleanup', async (req, res) => {
  try {
    const db = req.app.locals.db || mongoose.connection.db;
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

module.exports = router;
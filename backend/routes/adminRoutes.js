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
  deleteTransactionHistory
} = require('../controllers/adminController');

// Public routes
router.post('/login', adminLogin);

// Protected admin routes
router.get('/verify', adminAuth, verifyAdmin);
router.get('/stats', adminAuth, getDashboardStats);
router.get('/monthly-expenses', adminAuth, getMonthlyExpenses);
router.get('/category-breakdown', adminAuth, getCategoryBreakdown);

// User management
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

module.exports = router;

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
  deleteCategory
} = require('../controllers/adminController');
const {
  deleteTransactionHistory
} = require('../controllers/transactionHistoryController');

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

// Transaction history management
router.delete('/transaction-history/:id', adminAuth, deleteTransactionHistory);

module.exports = router;

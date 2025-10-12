const express = require('express');
const router = express.Router();
const {
  getAutoExpenses,
  createAutoExpense,
  getAutoExpenseById,
  updateAutoExpenseStatus,
  markAsSaved,
  markAsDismissed,
  deleteAutoExpense,
  getAutoExpenseStats
} = require('../controllers/autoExpenseController');

// Middleware for authentication (adjust based on your auth implementation)
const authenticateUser = require('../middleware/auth'); // Assuming you have auth middleware

// Apply authentication to all routes
router.use(authenticateUser);

// GET /api/auto-expenses - Get all auto expenses with filtering
router.get('/', getAutoExpenses);

// GET /api/auto-expenses/stats - Get statistics
router.get('/stats', getAutoExpenseStats);

// POST /api/auto-expenses - Create new auto expense
router.post('/', createAutoExpense);

// GET /api/auto-expenses/:id - Get single auto expense
router.get('/:id', getAutoExpenseById);

// PUT /api/auto-expenses/:id/status - Update status
router.put('/:id/status', updateAutoExpenseStatus);

// PUT /api/auto-expenses/:id/save - Mark as saved
router.put('/:id/save', markAsSaved);

// PUT /api/auto-expenses/:id/dismiss - Mark as dismissed
router.put('/:id/dismiss', markAsDismissed);

// DELETE /api/auto-expenses/:id - Delete auto expense
router.delete('/:id', deleteAutoExpense);

module.exports = router;

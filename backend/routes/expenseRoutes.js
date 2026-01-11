const express = require('express');
const expenseController = require('../controllers/expenseController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth); // Protect all expense routes

// Static routes first
router.get('/summary', expenseController.getExpenseSummary);
router.get('/bar-graph', expenseController.getExpensesByPeriod);
router.get('/current-month/summary', expenseController.getCurrentMonthSummary);
router.get('/current-month/verify', expenseController.verifyCurrentMonthExpenses);
router.get('/fix-dates', expenseController.fixInvalidDates); // Temporary helper

// Dynamic routes last
router.get('/', expenseController.getAllExpenses);
router.post('/', expenseController.createExpense);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;

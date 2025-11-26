const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const auth = require('../middleware/auth');

// Specific routes MUST come BEFORE dynamic routes like /:id
router.get('/summary', auth, transactionController.getFinancialSummary);
router.get('/transaction-history', auth, transactionController.getTransactionHistory);

// General transaction routes
router.get('/', auth, transactionController.getAllTransactions);
router.post('/', auth, transactionController.uploadInvoice, transactionController.createTransaction);
router.get('/:id', auth, transactionController.getTransactionById);
router.put('/:id', auth, transactionController.uploadInvoice, transactionController.updateTransaction);
router.delete('/:id', auth, transactionController.deleteTransaction);

module.exports = router;
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); // adjust path as needed

// ...existing code...
router.post('/manage-expense', authMiddleware, manageExpenseController.createRequest);
router.post('/income-tax-help', authMiddleware, incomeTaxHelpController.createRequest);
// ...existing code...
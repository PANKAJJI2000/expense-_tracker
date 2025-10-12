const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Public
router.post('/', async (req, res) => {
  try {
    console.log('Request body:', req.body); // Debug log
    
    const { userId, type, item, amount, invoice, date, paymentMethod, status } = req.body;
    
    // Validate required fields based on updated schema
    if (!userId || !type || !item || !amount) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: userId, type, item, and amount are required' 
      });
    }
    
    // Create transaction with provided data
    const transactionData = {
      userId,
      type,
      item,
      amount: parseFloat(amount),
      date: date || new Date(),
      paymentMethod: paymentMethod || 'cash',
      status: status || 'completed'
    };
    
    // Add optional fields if provided
    if (invoice) transactionData.invoice = invoice;
    if (req.body.category) transactionData.category = req.body.category;
    if (req.body.description) transactionData.description = req.body.description;
    
    const transaction = await Transaction.create(transactionData);
    
    res.status(201).json({ 
      success: true, 
      data: transaction 
    });
  } catch (error) {
    console.error('Transaction creation error:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;

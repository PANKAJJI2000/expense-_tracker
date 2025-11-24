const express = require('express');
const router = express.Router();
const TransactionHistory = require('../models/TransactionHistory');
const mongoose = require('mongoose');

// @desc    Get all transactions for a user
// @route   GET /api/transaction-history/:userId
// @access  Public

router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid user ID format' 
      });
    }

    const transactions = await TransactionHistory.find({ userId })
      .sort({ date: -1 }) // Most recent first
      .lean();

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Get transactions by type (income/expense)
// @route   GET /api/transaction-history/:userId/type/:type
// @access  Public
router.get('/:userId/type/:type', async (req, res) => {
  try {
    const { userId, type } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid user ID format' 
      });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Type must be either "income" or "expense"' 
      });
    }

    const transactions = await TransactionHistory.find({ 
      userId,
      type 
    }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Get transactions by date range
// @route   GET /api/transaction-history/:userId/range?startDate=xxx&endDate=xxx
// @access  Public
router.get('/:userId/range', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid user ID format' 
      });
    }

    const query = { userId };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await TransactionHistory.find(query)
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Create new transaction
// @route   POST /api/transaction-history
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { userId, date, title, amount, type, category, icon, note, paymentMethod, status } = req.body;

    // Validate required fields
    if (!userId || !title || !amount || !type || !category) {
      return res.status(400).json({
        success: false,
        error: 'userId, title, amount, type, and category are required'
      });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }

    const transactionData = {
      userId,
      title,
      amount: parseFloat(amount),
      type,
      category,
      date: date || new Date()
    };

    if (icon) transactionData.icon = icon;
    if (note) transactionData.note = note;
    if (paymentMethod) transactionData.paymentMethod = paymentMethod;
    if (status) transactionData.status = status;

    const transaction = await TransactionHistory.create(transactionData);

    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Transaction created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Update transaction
// @route   PUT /api/transaction-history/:id
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction ID format'
      });
    }

    const { title, amount, type, category, icon, note, date, paymentMethod, status } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (type !== undefined) updateData.type = type;
    if (category !== undefined) updateData.category = category;
    if (icon !== undefined) updateData.icon = icon;
    if (note !== undefined) updateData.note = note;
    if (date !== undefined) updateData.date = date;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields provided for update'
      });
    }

    const transaction = await TransactionHistory.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
      message: 'Transaction updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Delete transaction
// @route   DELETE /api/transaction-history/:id
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction ID format'
      });
    }

    const transaction = await TransactionHistory.findByIdAndDelete(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {},
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Get transaction summary (total income, total expense, balance)
// @route   GET /api/transaction-history/:userId/summary
// @access  Public
router.get('/:userId/summary', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }

    const income = await TransactionHistory.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), type: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const expense = await TransactionHistory.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), type: 'expense' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalIncome = income[0]?.total || 0;
    const totalExpense = expense[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

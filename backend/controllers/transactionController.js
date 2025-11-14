const Transaction = require('../models/Transaction');
const fs = require('fs');
const path = require('path');

const transactionController = {
  async getAllTransactions(req, res) {
    try {
      const { page = 1, limit = 10, type, category } = req.query;
      const filter = { userId: req.user._id };
      
      if (type) filter.type = type;
      if (category) filter.category = category;
      
      const transactions = await Transaction.find(filter)
        .sort({ date: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
        
      const total = await Transaction.countDocuments(filter);
      
      res.json({
        transactions,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async createTransaction(req, res) {
    try {
      const { type, category, amount, description, date, paymentMethod } = req.body;
      
      if (!type || !category || !amount || !description || !date) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const transaction = new Transaction({
        userId: req.user._id,
        category,
        amount,
        description,
        date,
        paymentMethod: paymentMethod || 'cash',
        invoice: req.file ? req.file.path : null
      });
      
      await transaction.save();
      res.status(201).json(transaction);
    } catch (error) {
      // Delete uploaded file if transaction creation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async getTransactionById(req, res) {
    try {
      const transaction = await Transaction.findOne({
        _id: req.params.id,
        userId: req.user._id
      });
      
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async updateTransaction(req, res) {
    try {
      const updateData = { ...req.body };
      
      // Add new invoice if uploaded
      if (req.file) {
        updateData.invoice = req.file.path;
      }
      
      const transaction = await Transaction.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        updateData,
        { new: true }
      );
      
      if (!transaction) {
        // Delete uploaded file if transaction not found
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      res.json(transaction);
    } catch (error) {
      // Delete uploaded file if update fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async deleteTransaction(req, res) {
    try {
      const transaction = await Transaction.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id
      });
      
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      // Delete invoice file if exists
      if (transaction.invoice) {
        const filePath = path.join(__dirname, '..', transaction.invoice);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async getTransactionHistory(req, res) {
    try {
      const { startDate, endDate, type } = req.query;
      const filter = { userId: req.user._id };
      
      if (startDate && endDate) {
        filter.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
      
      if (type) filter.type = type;
      
      const transactions = await Transaction.find(filter).sort({ date: -1 });
      
      const summary = {
        totalIncome: 0,
        totalExpense: 0,
        netAmount: 0,
        transactionCount: transactions.length
      };
      
      transactions.forEach(transaction => {
        if (transaction.type === 'income') {
          summary.totalIncome += transaction.amount;
        } else {
          summary.totalExpense += transaction.amount;
        }
      });
      
      summary.netAmount = summary.totalIncome - summary.totalExpense;
      
      res.json({
        transactions,
        summary
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  }
};

module.exports = transactionController;

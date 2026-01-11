const Transaction = require('../models/Transaction');

const transactionController = {
  async createTransaction(req, res) {
    try {
      const { title, amount, date, category, fullName, email, phone, type } = req.body;
      
      // Validate required fields
      if (!title || !amount || !date || !fullName || !email || !phone) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          required: ['title', 'amount', 'date', 'fullName', 'email', 'phone']
        });
      }
      
      // Create Transaction
      const newTransaction = new Transaction({
        item: title,
        amount: parseInt(amount),
        date: new Date(date),
        category: category || 'General',
        type: type || 'expense',
        fullName,
        email,
        phone,
        userId: req.user._id,
        status: 'completed'
      });
      
      await newTransaction.save();
      
      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: {
          ...newTransaction.toObject(),
          title: newTransaction.item
        }
      });
    } catch (error) {
      console.error('Transaction creation error:', error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async getAllTransactions(req, res) {
    try {
      const { type, currentMonth } = req.query;
      let query = { userId: req.user._id };
      
      if (type) {
        query.type = type;
      }
      
      if (currentMonth === 'true') {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        
        query.date = { $gte: startOfMonth, $lte: endOfMonth };
      }
      
      const transactions = await Transaction.find(query).sort({ date: -1 });
      
      res.json({
        success: true,
        count: transactions.length,
        data: transactions.map(t => ({
          ...t.toObject(),
          title: t.item
        }))
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async updateTransaction(req, res) {
    try {
      const { id } = req.params;
      const updates = { ...req.body };
      
      // Map title to item if provided
      if (updates.title) {
        updates.item = updates.title;
        delete updates.title;
      }
      
      const transaction = await Transaction.findOneAndUpdate(
        { _id: id, userId: req.user._id },
        updates,
        { new: true }
      );
      
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      res.json({
        success: true,
        data: {
          ...transaction.toObject(),
          title: transaction.item
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async deleteTransaction(req, res) {
    try {
      const { id } = req.params;
      
      const transaction = await Transaction.findOneAndDelete({ 
        _id: id, 
        userId: req.user._id
      });
      
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      res.json({ 
        success: true,
        message: 'Transaction deleted successfully' 
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async getTransactionSummary(req, res) {
    try {
      const { currentMonth } = req.query;
      let query = { userId: req.user._id };
      
      if (currentMonth === 'true') {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        
        query.date = { $gte: startOfMonth, $lte: endOfMonth };
      }
      
      const summary = await Transaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalIncome: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
            totalExpense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
            balance: { $sum: '$amount' }
          }
        }
      ]);
      
      res.json({
        success: true,
        data: summary.length > 0 ? summary[0] : { totalIncome: 0, totalExpense: 0, balance: 0 }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async getTransactionHistory(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;
      
      const transactions = await Transaction.find({ userId: req.user._id })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .exec();
      
      const totalTransactions = await Transaction.countDocuments({ userId: req.user._id });
      
      res.json({
        success: true,
        count: transactions.length,
        total: totalTransactions,
        data: transactions.map(t => ({
          ...t.toObject(),
          title: t.item
        }))
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  }
};

module.exports = transactionController;
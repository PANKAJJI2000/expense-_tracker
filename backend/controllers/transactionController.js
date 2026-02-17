const Transaction = require('../models/Transaction');
const TransactionHistory = require('../models/TransactionHistory');

// Helper: sync a Transaction document into TransactionHistory
const syncToHistory = async (transaction, action = 'create') => {
  try {
    if (action === 'create') {
      // Check if history entry already exists for this transaction
      const existing = await TransactionHistory.findOne({ sourceTransactionId: transaction._id });
      if (existing) return existing;

      const historyEntry = new TransactionHistory({
        userId: transaction.userId,
        date: transaction.date || new Date(),
        title: transaction.item || transaction.title || 'Untitled',
        amount: Math.abs(transaction.amount),
        type: transaction.type || 'expense',
        category: transaction.category || 'General',
        icon: transaction.icon || '',
        note: transaction.note || '',
        paymentMethod: transaction.paymentMethod || 'cash',
        status: transaction.status || 'completed',
        sourceTransactionId: transaction._id
      });
      const saved = await historyEntry.save();
      console.log('✅ Transaction synced to history:', saved._id);
      return saved;
    } else if (action === 'update') {
      const updated = await TransactionHistory.findOneAndUpdate(
        { sourceTransactionId: transaction._id },
        {
          title: transaction.item || transaction.title || 'Untitled',
          amount: Math.abs(transaction.amount),
          type: transaction.type || 'expense',
          category: transaction.category || 'General',
          icon: transaction.icon || '',
          date: transaction.date,
          paymentMethod: transaction.paymentMethod || 'cash',
          status: transaction.status || 'completed'
        },
        { new: true }
      );
      if (updated) {
        console.log('✅ Transaction history updated:', updated._id);
      }
      return updated;
    } else if (action === 'delete') {
      const deleted = await TransactionHistory.findOneAndDelete({ sourceTransactionId: transaction._id });
      if (deleted) {
        console.log('✅ Transaction history entry deleted:', deleted._id);
      }
      return deleted;
    }
  } catch (error) {
    console.error('⚠️ Error syncing transaction to history:', error.message);
    // Don't throw - syncing failure shouldn't break the main operation
  }
};

const transactionController = {
  async createTransaction(req, res) {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user._id) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'User authentication required'
        });
      }

      const { title, amount, date, category, fullName, email, phone, type } = req.body;
      
      // Validate required fields - only title and amount are required
      if (!title || !amount) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          required: ['title', 'amount']
        });
      }
      
      // Handle icon from file upload or request body
      const icon = req.file ? `/uploads/${req.file.filename}` : (req.body.icon || '');
      
      // Create Transaction with optional fields - ALWAYS use authenticated user's ID
      const newTransaction = new Transaction({
        item: title,
        amount: parseInt(amount),
        date: date ? new Date(date) : new Date(),
        category: category || 'General',
        type: type || 'expense',
        fullName: fullName || '',
        icon: icon,
        email: email || '',
        phone: phone || '',
        userId: req.user._id.toString(), // Force use authenticated user's ID
        status: 'completed'
      });
      
      await newTransaction.save();

      // Auto-sync to TransactionHistory
      await syncToHistory(newTransaction, 'create');
      
      const transactionObject = newTransaction.toObject();
      
      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: {
          ...transactionObject,
          title: transactionObject.item,
          icon: transactionObject.icon || icon
        }
      });
    } catch (error) {
      console.error('Transaction creation error:', error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async getAllTransactions(req, res) {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { type, currentMonth } = req.query;
      // ALWAYS filter by authenticated user's ID
      let query = { userId: req.user._id.toString() };
      
      if (type && type !== 'all') {
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
      
      console.log('getAllTransactions for user:', req.user._id.toString());
      
      const transactions = await Transaction.find(query).sort({ date: -1, createdAt: -1 });
      
      res.json({
        success: true,
        count: transactions.length,
        userId: req.user._id.toString(),
        data: transactions.map(t => {
          const obj = t.toObject();
          return {
            ...obj,
            title: obj.item,
            icon: obj.icon || ''
          };
        })
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async updateTransaction(req, res) {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const updates = { ...req.body };
      
      // Remove userId from updates to prevent tampering
      delete updates.userId;
      
      // Map title to item if provided
      if (updates.title) {
        updates.item = updates.title;
        delete updates.title;
      }
      
      // Handle icon from file upload
      if (req.file) {
        updates.icon = `/uploads/${req.file.filename}`;
      }
      
      // ALWAYS verify transaction belongs to authenticated user
      const transaction = await Transaction.findOneAndUpdate(
        { _id: id, userId: req.user._id.toString() },
        updates,
        { new: true }
      );
      
      if (!transaction) {
        return res.status(404).json({ 
          error: 'Transaction not found or unauthorized access' 
        });
      }

      // Auto-sync update to TransactionHistory
      await syncToHistory(transaction, 'update');
      
      const transactionObject = transaction.toObject();
      
      res.json({
        success: true,
        data: {
          ...transactionObject,
          title: transactionObject.item,
          icon: transactionObject.icon || ''
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async deleteTransaction(req, res) {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      
      // ALWAYS verify transaction belongs to authenticated user before deleting
      const transaction = await Transaction.findOneAndDelete({ 
        _id: id, 
        userId: req.user._id.toString()
      });
      
      if (!transaction) {
        return res.status(404).json({ 
          error: 'Transaction not found or unauthorized access' 
        });
      }

      // Auto-sync delete from TransactionHistory
      await syncToHistory(transaction, 'delete');
      
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
      if (!req.user || !req.user._id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { currentMonth } = req.query;
      // ALWAYS filter by authenticated user's ID
      let query = { userId: req.user._id.toString() };
      
      if (currentMonth === 'true') {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        
        query.date = { $gte: startOfMonth, $lte: endOfMonth };
      }
      
      console.log('getTransactionSummary for user:', req.user._id.toString());
      
      const summary = await Transaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalIncome: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
            totalExpense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
            balance: { 
              $sum: { 
                $cond: [
                  { $eq: ['$type', 'income'] }, 
                  '$amount', 
                  { $multiply: ['$amount', -1] }
                ] 
              } 
            }
          }
        }
      ]);
      
      res.json({
        success: true,
        userId: req.user._id.toString(),
        data: summary.length > 0 ? summary[0] : { totalIncome: 0, totalExpense: 0, balance: 0 }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async getTransactionHistory(req, res) {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { page = 1, limit = 10, type, startDate, endDate } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Build query - ALWAYS filter by authenticated user's ID
      let query = { userId: req.user._id.toString() };
      
      // Filter by type if provided
      if (type && type !== 'all') {
        query.type = type;
      }
      
      // Filter by date range if provided
      if (startDate || endDate) {
        query.date = {};
        if (startDate) {
          query.date.$gte = new Date(startDate);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query.date.$lte = end;
        }
      }
      
      console.log('Transaction History Query for user:', req.user._id.toString(), query);
      
      const transactions = await Transaction.find(query)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .exec();
      
      const totalTransactions = await Transaction.countDocuments(query);
      
      console.log(`Found ${transactions.length} transactions out of ${totalTransactions} total`);
      
      res.json({
        success: true,
        count: transactions.length,
        total: totalTransactions,
        page: parseInt(page),
        totalPages: Math.ceil(totalTransactions / parseInt(limit)),
        userId: req.user._id.toString(),
        data: transactions.map(t => {
          const obj = t.toObject();
          return {
            ...obj,
            title: obj.item,
            icon: obj.icon || ''
          };
        })
      });
    } catch (error) {
      console.error('Transaction history error:', error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async uploadInvoice(req, res) {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ 
          success: false,
          error: 'Unauthorized' 
        });
      }

      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          error: 'No file uploaded' 
        });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      
      res.status(200).json({
        success: true,
        message: 'Invoice uploaded successfully',
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          path: fileUrl,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      });
    } catch (error) {
      console.error('Invoice upload error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Server error', 
        details: error.message 
      });
    }
  }
};

module.exports = transactionController;
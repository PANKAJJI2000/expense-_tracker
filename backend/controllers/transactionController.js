const Transaction = require('../models/Transaction');
const { 
  createHistoryFromTransaction, 
  updateHistoryFromTransaction, 
  deleteHistoryFromTransaction 
} = require('./transactionHistoryController');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Multer configuration for invoice uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'invoices');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'invoice-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images and PDFs only
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (jpeg, jpg, png) and PDF files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Category to icon mapping
const categoryIcons = {
  Guava: '🍈',
  Fruits: '🍎',
  Food: '🍔',
  // Add more categories as needed
};

const transactionController = {
  // Export upload middleware
  uploadInvoice: upload.single('invoice'),

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
      const { 
        type, 
        category, 
        categgory, // Handle typo from frontend
        amount, 
        item, 
        description,
        paymentMethod, 
        note, 
        icon,
        date,
        status 
      } = req.body;

      // Normalize category (handle typo)
      const normalizedCategory = category || categgory || 'Other';

      console.log('Creating transaction with data:', {
        type,
        category: normalizedCategory,
        amount,
        item,
        paymentMethod,
        note
      });

      // Validate required fields
      if (!amount) {
        return res.status(400).json({
          success: false,
          message: 'Amount is required'
        });
      }

      const transactionData = {
        userId: req.user._id,
        type: type || 'expense',
        category: normalizedCategory,
        amount: Math.abs(amount),
        item: item || description || 'Untitled',
        description: description || item || '',
        paymentMethod: paymentMethod || 'cash',
        note: note || '',
        icon: icon || 'receipt',
        date: date || new Date(),
        status: status || 'completed'
      };

      const transaction = await Transaction.create(transactionData);

      // Also create history entry if needed
      // await createHistoryFromTransaction(transactionData);

      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: {
          _id: transaction._id,
          userId: transaction.userId,
          type: transaction.type,
          category: transaction.category,
          amount: transaction.amount,
          item: transaction.item,
          description: transaction.description,
          paymentMethod: transaction.paymentMethod,
          note: transaction.note,
          icon: transaction.icon,
          date: transaction.date,
          status: transaction.status,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt
        }
      });
    } catch (error) {
      console.error('Create Transaction Error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
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
      
      console.log("Updating transaction:", req.params.id);
      
      // Get old transaction data first
      const oldTransaction = await Transaction.findOne({
        _id: req.params.id,
        userId: req.user._id
      });
      
      if (!oldTransaction) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      if (req.file) {
        updateData.invoice = `/uploads/invoices/${req.file.filename}`;
        
        if (oldTransaction.invoice) {
          const oldFilePath = path.join(__dirname, '..', oldTransaction.invoice);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
      }
      
      const transaction = await Transaction.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        updateData,
        { new: true }
      );
      
      console.log("Transaction updated successfully");
      
      // Update TransactionHistory
      try {
        const historyUpdateData = {
          userId: req.user._id,
          oldDescription: oldTransaction.description,
          oldAmount: oldTransaction.amount,
          date: transaction.date,
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category,
          icon: updateData.icon || 'default',
          note: updateData.note || transaction.description
        };
        
        await updateHistoryFromTransaction(historyUpdateData);
        console.log('Transaction history updated successfully');
      } catch (historyError) {
        console.error('Error updating transaction history:', historyError.message);
      }
      
      res.json({
        success: true,
        message: 'Transaction updated successfully',
        transaction: transaction
      });
    } catch (error) {
      console.error("Transaction update error:", error);
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async deleteTransaction(req, res) {
    try {
      console.log("Deleting transaction:", req.params.id);
      
      const transaction = await Transaction.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id
      });
      
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      if (transaction.invoice) {
        const filePath = path.join(__dirname, '..', transaction.invoice);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      // Delete from TransactionHistory
      try {
        await deleteHistoryFromTransaction(
          req.user._id,
          {
            description: transaction.description,
            amount: transaction.amount,
            type: transaction.type
          }
        );
        console.log('Transaction history deleted successfully');
      } catch (historyError) {
        console.error('Error deleting transaction history:', historyError.message);
      }
      
      res.json({ 
        success: true,
        message: 'Transaction and history deleted successfully' 
      });
    } catch (error) {
      console.error("Transaction deletion error:", error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async getTransactionHistory(req, res) {
    try {
      const userId = req.user._id;
      const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 });

      // Format response with defaults for null fields
      const formattedTransactions = transactions.map(t => ({
        _id: t._id,
        userId: t.userId,
        item: t.item || t.description || 'Untitled',
        description: t.description || t.item || '',
        amount: t.amount,
        invoice: t.invoice || null,
        paymentMethod: t.paymentMethod || 'cash',
        status: t.status || 'completed',
        type: t.type || 'expense',
        category: t.category || 'Other',
        icon: t.icon || 'receipt',
        note: t.note || '',
        date: t.date || t.createdAt,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      }));

      res.status(200).json({
        success: true,
        transactions: formattedTransactions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  async getFinancialSummary(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const filter = { userId: req.user._id };
      
      console.log('User ID:', req.user._id);
      console.log('Filter:', filter);
      
      // Add date filter if provided
      if (startDate && endDate) {
        filter.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
        console.log('Date filter applied:', filter.date);
      }
      
      const transactions = await Transaction.find(filter);
      
      console.log('Found transactions:', transactions.length);
      
      const summary = {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        transactionCount: transactions.length,
        incomeCount: 0,
        expenseCount: 0
      };
      
      transactions.forEach(transaction => {
        const type = transaction.type?.toString().toLowerCase().trim();
        const amount = parseFloat(transaction.amount) || 0;
        
        console.log(`Processing transaction:`, {
          id: transaction._id,
          type: transaction.type,
          typeProcessed: type,
          amount: amount,
          rawType: JSON.stringify(transaction.type)
        });
        
        if (type === 'income') {
          summary.totalIncome += amount;
          summary.incomeCount++;
          console.log(`✓ Income added: ${amount}, Total Income: ${summary.totalIncome}`);
        } else if (type === 'expense') {
          summary.totalExpense += amount;
          summary.expenseCount++;
          console.log(`✓ Expense added: ${amount}, Total Expense: ${summary.totalExpense}`);
        } else {
          console.log(`✗ Unknown type: "${type}"`);
        }
      });
      
      summary.balance = summary.totalIncome - summary.totalExpense;
      
      console.log('Final summary:', summary);
      
      res.json({
        success: true,
        summary: {
          balance: parseFloat(summary.balance.toFixed(2)),
          totalIncome: parseFloat(summary.totalIncome.toFixed(2)),
          totalExpense: parseFloat(summary.totalExpense.toFixed(2)),
          transactionCount: summary.transactionCount,
          incomeCount: summary.incomeCount,
          expenseCount: summary.expenseCount
        },
        period: startDate && endDate ? {
          from: new Date(startDate).toISOString(),
          to: new Date(endDate).toISOString()
        } : 'All time'
      });
    } catch (error) {
      console.error('Summary error:', error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  }
};

module.exports = transactionController;
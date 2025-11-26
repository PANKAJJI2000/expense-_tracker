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
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

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
      const { type, category, amount, description, date, paymentMethod, icon, note, item } = req.body;
      
      console.log("Creating transaction with data:", req.body);
      
      // Check for required fields
      const missingFields = [];
      if (!type) missingFields.push('type');
      if (!category) missingFields.push('category');
      if (!amount) missingFields.push('amount');
      if (!description && !item) missingFields.push('description or item');
      if (!date) missingFields.push('date');
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          missingFields: missingFields,
          message: `Please provide: ${missingFields.join(', ')}`
        });
      }
      
      const transactionData = {
        userId: req.user._id,
        type,
        category,
        amount: parseFloat(amount),
        date: new Date(date),
        paymentMethod: paymentMethod || 'cash',
        invoice: req.file ? `/uploads/invoices/${req.file.filename}` : null
      };
      
      // Handle item and description fields
      if (item) transactionData.item = item;
      if (description) transactionData.description = description;
      if (!item && description) transactionData.item = description;
      if (!description && item) transactionData.description = item;
      
      const transaction = new Transaction(transactionData);
      
      const savedTransaction = await transaction.save();
      console.log("Transaction saved successfully:", savedTransaction._id);
      
      // Automatically create entry in TransactionHistory
      let historyCreated = false;
      try {
        const historyData = {
          userId: req.user._id,
          date: savedTransaction.date,
          description: savedTransaction.description || savedTransaction.item,
          item: savedTransaction.item,
          amount: savedTransaction.amount,
          type: savedTransaction.type, // Ensure this is present
          category: savedTransaction.category,
          icon: icon || '💰',
          note: note || savedTransaction.description || savedTransaction.item,
          paymentMethod: savedTransaction.paymentMethod,
          status: 'completed'
        };
        
        console.log("Creating history entry with type:", historyData.type);
        const historyEntry = await createHistoryFromTransaction(historyData);
        
        if (historyEntry) {
          console.log("History entry created successfully:", historyEntry._id);
          historyCreated = true;
        }
      } catch (historyError) {
        console.error('Error creating transaction history:', historyError);
        console.error('History error details:', historyError.message);
      }
      
      res.status(201).json({
        success: true,
        message: historyCreated 
          ? 'Transaction created successfully and added to history'
          : 'Transaction created but history entry failed',
        transaction: savedTransaction,
        historyCreated
      });
    } catch (error) {
      console.error("Transaction creation error:", error);
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
        success: true,
        transactions,
        summary
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
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
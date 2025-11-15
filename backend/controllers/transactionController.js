const Transaction = require('../models/Transaction');
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
      const { type, category, amount, description, date, paymentMethod } = req.body;
      
      if (!type || !category || !amount || !description || !date) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const transaction = new Transaction({
        userId: req.user._id,
        type,
        category,
        amount,
        description,
        date,
        paymentMethod: paymentMethod || 'cash',
        invoice: req.file ? `/uploads/invoices/${req.file.filename}` : null
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
        updateData.invoice = `/uploads/invoices/${req.file.filename}`;
        
        // Delete old invoice if exists
        const oldTransaction = await Transaction.findOne({
          _id: req.params.id,
          userId: req.user._id
        });
        
        if (oldTransaction && oldTransaction.invoice) {
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

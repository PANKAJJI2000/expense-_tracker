const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const multer = require('multer');
const path = require('path');

// Configure multer for invoice uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'invoice-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images (JPEG, PNG) and documents (PDF, DOC, DOCX) are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Public
router.post('/', upload.single('invoice'), async (req, res) => {
  try {
    console.log('Request body:', req.body); // Debug log
    
    const { userId, item, amount, date, paymentMethod, status } = req.body;
    
    // Validate required fields based on updated schema
    if (!userId || !item || !amount) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: userId, item, and amount are required' 
      });
    }
    
    // Create transaction with provided data
    const transactionData = {
      userId,
      item,
      amount: parseFloat(amount),
      date: date || new Date(),
      paymentMethod: paymentMethod || 'cash',
      status: status || 'completed'
    };
    
    // Add optional fields if provided
    if (req.file) transactionData.invoice = req.file.path;
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

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Public
router.put('/:id', upload.single('invoice'), async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, item, amount, date, paymentMethod, status } = req.body;
    
    // Validate required fields based on updated schema
    if (!userId || !item || !amount) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: userId, item, and amount are required' 
      });
    }
    
    // Find transaction by ID
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ 
        success: false, 
        error: 'Transaction not found' 
      });
    }
    
    // Update transaction with provided data
    transaction.userId = userId;
    transaction.item = item;
    transaction.amount = parseFloat(amount);
    transaction.date = date || new Date();
    transaction.paymentMethod = paymentMethod || 'cash';
    transaction.status = status || 'completed';
    
    // Update optional fields if provided
    if (req.file) transaction.invoice = req.file.path;
    if (req.body.category) transaction.category = req.body.category;
    if (req.body.description) transaction.description = req.body.description;
    
    await transaction.save();
    
    res.status(200).json({ 
      success: true, 
      data: transaction 
    });
  } catch (error) {
    console.error('Transaction update error:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;

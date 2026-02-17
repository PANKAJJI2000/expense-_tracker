const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images and PDF files are allowed'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Apply auth middleware to all routes
router.use(authMiddleware);

// Transaction routes
router.post('/', upload.single('invoice'), transactionController.createTransaction);
router.get('/', transactionController.getAllTransactions);
router.get('/summary', transactionController.getTransactionSummary);
router.get('/history', transactionController.getTransactionHistory);
router.put('/:id', upload.single('invoice'), transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

// Upload invoice endpoint
router.post('/upload-invoice', upload.single('invoice'), transactionController.uploadInvoice);

module.exports = router;
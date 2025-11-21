const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = './uploads';
const expenseProofsDir = path.join(uploadsDir, 'expense-proofs');
const incomeStatementsDir = path.join(uploadsDir, 'income-statements');

[expenseProofsDir, incomeStatementsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration for expense proofs
const expenseProofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, expenseProofsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'expense-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Storage configuration for income statements
const incomeStatementStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, incomeStatementsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'income-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for allowed file types
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

// Multer instances
const uploadExpenseProof = multer({
  storage: expenseProofStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

const uploadIncomeStatement = multer({
  storage: incomeStatementStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

module.exports = {
  uploadExpenseProof,
  uploadIncomeStatement
};

require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Import routes
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const profileRoutes = require('./routes/profileRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const transactionHistoryRoutes = require('./routes/transactionHistoryRoutes');
const autoExpenseRoutes = require('./routes/autoExpenseRoutes');
const adminRoutes = require('./routes/adminRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for deployment platforms
app.set('trust proxy', 1);


// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB Connected Successfully'))
.catch((err) => console.error('MongoDB Connection Error:', err));

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
        'https://expense-tracker-rot7.onrender.com',
        // Add your frontend domain here when you have one
        // 'https://your-frontend-domain.com'
      ])
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/transaction-history', transactionHistoryRoutes);
app.use('/api/auto-expenses', autoExpenseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://expense-tracker-rot7.onrender.com'
    : `http://localhost:${PORT}`;
    
  res.json({ 
    status: 'Server running',
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    version: process.env.API_VERSION || 'v1',
    timestamp: new Date().toISOString(),
    baseUrl: baseUrl,
    routes: {
      auth: `${baseUrl}/api/auth`,
      expenses: `${baseUrl}/api/expenses`,
      profiles: `${baseUrl}/api/profiles`,
      transactions: `${baseUrl}/api/transactions`,
      transactionHistory: `${baseUrl}/api/transaction-history`,
      autoExpenses: `${baseUrl}/api/auto-expenses`,
      admin: `${baseUrl}/api/admin`,
      categories: `${baseUrl}/api/categories`
    }
  });
});

// Test endpoint for admin routes
app.get('/api/admin/test', (req, res) => {
  res.json({ message: 'Admin routes are working' });
});

// Debug endpoint to check model schemas
app.get('/api/admin/debug-schemas', async (req, res) => {
  try {
    const schemas = {};
    
    // Check TransactionHistory schema
    try {
      const TransactionHistory = require('./models/TransactionHistory');
      const sampleHistory = await TransactionHistory.findOne().limit(1);
      schemas.transactionHistory = {
        modelExists: true,
        sampleData: sampleHistory,
        schemaFields: Object.keys(TransactionHistory.schema.paths)
      };
    } catch (error) {
      schemas.transactionHistory = { modelExists: false, error: error.message };
    }

    // Check Transaction schema
    try {
      const Transaction = require('./models/Transaction');
      const sampleTransaction = await Transaction.findOne().limit(1);
      schemas.transaction = {
        modelExists: true,
        sampleData: sampleTransaction,
        schemaFields: Object.keys(Transaction.schema.paths)
      };
    } catch (error) {
      schemas.transaction = { modelExists: false, error: error.message };
    }

    // Check Profile schema
    try {
      const Profile = require('./models/Profile');
      const sampleProfile = await Profile.findOne().limit(1);
      schemas.profile = {
        modelExists: true,
        sampleData: sampleProfile,
        schemaFields: Object.keys(Profile.schema.paths)
      };
    } catch (error) {
      schemas.profile = { modelExists: false, error: error.message };
    }

    // Check AutoExpense schema
    try {
      const AutoExpense = require('./models/AutoExpense');
      const sampleAutoExpense = await AutoExpense.findOne().limit(1);
      schemas.autoExpense = {
        modelExists: true,
        sampleData: sampleAutoExpense,
        schemaFields: Object.keys(AutoExpense.schema.paths)
      };
    } catch (error) {
      schemas.autoExpense = { modelExists: false, error: error.message };
    }

    res.json(schemas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint specifically for transaction history
app.get('/api/admin/debug-transaction-history', async (req, res) => {
  try {
    const TransactionHistory = require('./models/TransactionHistory');
    
    // Get a few sample records
    const samples = await TransactionHistory.find({}).limit(3);
    
    const response = {
      modelExists: true,
      totalCount: await TransactionHistory.countDocuments(),
      schemaFields: Object.keys(TransactionHistory.schema.paths),
      sampleRecords: samples,
      fieldAnalysis: {}
    };

    // Analyze what fields actually contain data
    if (samples.length > 0) {
      const firstSample = samples[0].toObject();
      Object.keys(firstSample).forEach(key => {
        response.fieldAnalysis[key] = {
          type: typeof firstSample[key],
          hasValue: firstSample[key] !== null && firstSample[key] !== undefined,
          sampleValue: firstSample[key]
        };
      });
    }

    res.json(response);
  } catch (error) {
    res.json({ 
      modelExists: false, 
      error: error.message,
      suggestion: 'TransactionHistory model may not exist or may be empty'
    });
  }
});

// 404 handler
app.all('/*splat', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://expense-tracker-rot7.onrender.com'
    : `http://localhost:${PORT}`;
  console.log(`Admin panel endpoints available at ${baseUrl}/api/admin/`);
});

require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Import routes
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const profileRoutes = require('./routes/profileRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const transactionHistoryRoutes = require('./routes/transactionHistoryRoutes');
const autoExpenseRoutes = require('./routes/autoExpenseRoutes');
const adminRoutes = require('./routes/adminRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const userRoutes = require('./routes/userRoutes');
const manageExpenseRoutes = require('./routes/manageExpenseRoutes');
const incomeTaxHelpRoutes = require('./routes/incomeTaxHelpRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for deployment platforms (needed for HTTPS redirects)
app.set('trust proxy', 1);

// MongoDB Connection using environment variable
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB Connected Successfully'))
.catch((err) => console.error('MongoDB Connection Error:', err));

// Session configuration - Must be before CORS and routes
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60, // 1 day in seconds
    autoRemove: 'native',
    touchAfter: 24 * 3600 // Lazy session update
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  },
  name: 'sessionId' // Custom session cookie name
}));

// CORS Middleware Configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
        'https://expense-tracker-rot7.onrender.com',
      ])
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://127.0.0.1:5173',"https://expense-tracker-rot7.onrender.com"],
  credentials: true, // Important for sessions
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Request logging middleware with session info
app.use((req, res, next) => {
  const sessionInfo = req.session?.user ? `User: ${req.session.user.email}` : 'No session';
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - SessionID: ${req.sessionID} - ${sessionInfo}`);
  next();
});

// Session activity tracking middleware
app.use((req, res, next) => {
  if (req.session && req.session.user) {
    req.session.lastActivity = new Date();
  }
  next();
});

// API Routes - All admin panel requests will use these endpoints
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/transaction-history', transactionHistoryRoutes);
app.use('/api/auto-expenses', autoExpenseRoutes);
app.use('/api/admin', adminRoutes); // Admin panel specific routes
app.use('/api/categories', categoryRoutes);
app.use('/api/profiles', profileRoutes); // Profile routes
app.use('/api/users', userRoutes); // User routes
app.use('/api/manage-expenses', manageExpenseRoutes); // Manage Expense form routes
app.use('/api/income-tax-help', incomeTaxHelpRoutes); // Income Tax Help form routes

// Health check endpoint - Enhanced with session info
app.get('/api/health', (req, res) => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://expense-tracker-backend-48vm.onrender.com/'
    : `http://localhost:${PORT}`;
    
  res.json({ 
    status: 'Server running',
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    version: process.env.API_VERSION || 'v1',
    timestamp: new Date().toISOString(),
    baseUrl: baseUrl,
    sessionActive: !!req.session?.user,
    sessionId: req.sessionID,
    routes: {
      auth: `${baseUrl}/api/auth`,
      expenses: `${baseUrl}/api/expenses`,
      transactions: `${baseUrl}/api/transactions`,
      transactionHistory: `${baseUrl}/api/transaction-history`,
      autoExpenses: `${baseUrl}/api/auto-expenses`,
      admin: `${baseUrl}/api/admin`,
      categories: `${baseUrl}/api/categories`,
      profiles: `${baseUrl}/api/profiles`,
      manageExpenses: `${baseUrl}/api/manage-expenses`,
      incomeTaxHelp: `${baseUrl}/api/income-tax-help`,
      adminSessions: `${baseUrl}/api/admin/sessions`,
      sessionStats: `${baseUrl}/api/admin/sessions/stats`
      
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

// Root route - Shows API information when visiting backend URL directly
app.get('/', (req, res) => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://expense-tracker-rot7.onrender.com'
    : `http://localhost:${PORT}`;
    
  res.json({
    message: 'Expense Tracker API Server',
    status: 'Running',
    version: process.env.API_VERSION || 'v1',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: `${baseUrl}/api/health`,
      auth: `${baseUrl}/api/auth`,
      expenses: `${baseUrl}/api/expenses`,
      profiles: `${baseUrl}/api/profiles`,
      transactions: `${baseUrl}/api/transactions`,
      transactionHistory: `${baseUrl}/api/transaction-history`,
      autoExpenses: `${baseUrl}/api/auto-expenses`,
      admin: `${baseUrl}/api/admin`,
      categories: `${baseUrl}/api/categories`,
      manageExpenses: `${baseUrl}/api/manage-expenses`,
      incomeTaxHelp: `${baseUrl}/api/income-tax-help`,
      adminSessions: `${baseUrl}/api/admin/sessions`,
      sessionStats: `${baseUrl}/api/admin/sessions/stats`,
      debugSchemas: `${baseUrl}/api/admin/debug-schemas`,
      debugTransactionHistory: `${baseUrl}/api/admin/debug-transaction-history`
    }
  });
});

// Simple API status endpoint
app.get('/api', (req, res) => {
  res.send("Expense Tracker API is running");
  // res.redirect('/');
});

// Session info endpoint
app.get('/api/session/info', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.json({
      authenticated: false,
      sessionId: req.sessionID,
      message: 'No active session'
    });
  }

  res.json({
    authenticated: true,
    sessionId: req.sessionID,
    user: {
      id: req.session.user.id,
      email: req.session.user.email,
      role: req.session.user.role
    },
    lastActivity: req.session.lastActivity,
    cookie: {
      maxAge: req.session.cookie.maxAge,
      expires: req.session.cookie.expires
    }
  });
});

// Destroy session endpoint
app.post('/api/session/destroy', (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to destroy session' });
      }
      res.clearCookie('sessionId');
      res.json({ message: 'Session destroyed successfully' });
    });
  } else {
    res.json({ message: 'No active session' });
  }
});

// 404 handler - must be last
app.all('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // Backend URL that admin panel will connect to
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://expense-tracker-rot7.onrender.com' // Production backend URL
    : `http://localhost:${PORT}`; // Development backend URL
  console.log(`Admin panel endpoints available at ${baseUrl}/api/admin/`);
  console.log(`Admin panel should connect to: ${baseUrl}`);
});
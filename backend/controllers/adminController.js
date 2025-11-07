const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Expense = require('../models/Expense');
const Category = require('../models/Category');

// Import additional models
let AutoExpense, Profile, Transaction, TransactionHistory;
try {
  AutoExpense = require('../models/AutoExpense');
} catch (error) {
  AutoExpense = null;
}
try {
  Profile = require('../models/Profile');
} catch (error) {
  Profile = null;
}
try {
  Transaction = require('../models/Transaction');
} catch (error) {
  Transaction = null;
}
try {
  TransactionHistory = require('../models/TransactionHistory');
} catch (error) {
  TransactionHistory = null;
}

// Admin login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return res.status(500).json({ message: 'Admin credentials not configured' });
    }

    if (email !== adminEmail || password !== adminPassword) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { email: adminEmail, role: 'admin' },
      process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        email: adminEmail,
        role: 'admin'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify admin token
const verifyAdmin = async (req, res) => {
  try {
    res.json({
      user: {
        email: req.admin.email,
        role: req.admin.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalExpenses = await Expense.countDocuments();
    const totalAutoExpenses = AutoExpense ? await AutoExpense.countDocuments() : 0;
    const totalTransactions = Transaction ? await Transaction.countDocuments() : 0;
    
    const totalAmountResult = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalAmount = totalAmountResult[0]?.total || 0;

    // Calculate monthly growth using date field instead of createdAt if needed
    const currentMonth = new Date();
    const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    
    // Try both createdAt and date fields for compatibility
    const currentMonthQuery = {
      $or: [
        { createdAt: { $gte: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1) } },
        { date: { $gte: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1) } }
      ]
    };
    
    const lastMonthQuery = {
      $or: [
        { 
          createdAt: { 
            $gte: lastMonth,
            $lt: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
          }
        },
        { 
          date: { 
            $gte: lastMonth,
            $lt: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
          }
        }
      ]
    };
    
    const currentMonthExpenses = await Expense.countDocuments(currentMonthQuery);
    const lastMonthExpenses = await Expense.countDocuments(lastMonthQuery);

    const monthlyGrowth = lastMonthExpenses > 0 
      ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses * 100).toFixed(1)
      : 0;

    res.json({
      totalUsers,
      totalExpenses,
      totalAmount,
      monthlyGrowth: parseFloat(monthlyGrowth),
      totalAutoExpenses,
      totalTransactions
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get monthly expenses data for chart
const getMonthlyExpenses = async (req, res) => {
  try {
    // Try to use date field first, fall back to createdAt
    const monthlyData = await Expense.aggregate([
      {
        $group: {
          _id: {
            year: { $year: { $ifNull: ['$date', '$createdAt'] } },
            month: { $month: { $ifNull: ['$date', '$createdAt'] } }
          },
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $limit: 12
      }
    ]);

    const formattedData = monthlyData.map(item => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      amount: item.amount,
      count: item.count
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Monthly expenses error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get category breakdown for pie chart
const getCategoryBreakdown = async (req, res) => {
  try {
    const categoryData = await Expense.aggregate([
      {
        $group: {
          _id: '$category',
          value: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { value: -1 }
      }
    ]);

    const formattedData = categoryData.map(item => ({
      name: item._id,
      value: item.value,
      count: item.count
    }));

    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all users with pagination
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const query = search 
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Also delete user's expenses
    await Expense.deleteMany({ userId: id });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all expenses with filtering
const getExpenses = async (req, res) => {
  try {
    const { search, startDate, endDate, category, page = 1, limit = 10 } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } } // Add title field if it exists
      ];
    }

    if (startDate && endDate) {
      // Try both date and createdAt fields
      query.$or = [
        {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        },
        {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      ];
    }

    if (category) {
      query.category = category;
    }

    const expenses = await Expense.find(query)
      .populate('userId', 'name email username') // Add username field if it exists
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Add user email to response with better fallback
    const formattedExpenses = expenses.map(expense => ({
      ...expense.toObject(),
      userEmail: expense.userId?.email || expense.userId?.username || 'Unknown',
      status: expense.status || 'pending' // Add default status
    }));

    res.json(formattedExpenses);
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete expense
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findByIdAndDelete(id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all categories
const getCategories = async (req, res) => {
  try {
    // If Category model exists, use it; otherwise return predefined categories
    let categories;
    
    try {
      categories = await Category.find().sort({ name: 1 });
    } catch (error) {
      // Return default categories if model doesn't exist
      categories = [
        { _id: '1', name: 'Food', description: 'Food and dining expenses', color: '#FF5722' },
        { _id: '2', name: 'Transport', description: 'Transportation costs', color: '#2196F3' },
        { _id: '3', name: 'Entertainment', description: 'Entertainment and leisure', color: '#9C27B0' },
        { _id: '4', name: 'Shopping', description: 'Shopping and retail', color: '#FF9800' },
        { _id: '5', name: 'Bills', description: 'Utility bills and services', color: '#607D8B' },
        { _id: '6', name: 'Health', description: 'Healthcare expenses', color: '#4CAF50' }
      ];
    }

    // Add expense count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const expenseCount = await Expense.countDocuments({ 
          category: category.name 
        });
        return {
          ...category.toObject ? category.toObject() : category,
          expenseCount
        };
      })
    );

    res.json(categoriesWithCount);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create category
const createCategory = async (req, res) => {
  try {
    if (typeof Category.save !== 'function') {
      return res.status(501).json({ message: 'Category management not implemented' });
    }
    
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    if (typeof Category.findByIdAndUpdate !== 'function') {
      return res.status(501).json({ message: 'Category management not implemented' });
    }
    
    const { id } = req.params;
    const category = await Category.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    if (typeof Category.findByIdAndDelete !== 'function') {
      return res.status(501).json({ message: 'Category management not implemented' });
    }
    
    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Auto Expense Management
const getAutoExpenses = async (req, res) => {
  try {
    if (!AutoExpense) {
      // Return empty array if model doesn't exist
      return res.json([]);
    }

    const { search, page = 1, limit = 10 } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    // Try to populate userId, but handle errors gracefully
    let autoExpenses;
    try {
      autoExpenses = await AutoExpense.find(query)
        .populate('userId', 'name email username')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
    } catch (populateError) {
      console.log('AutoExpense populate failed, using basic query:', populateError.message);
      autoExpenses = await AutoExpense.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
    }

    const formattedAutoExpenses = autoExpenses.map(expense => {
      const expenseObj = expense.toObject ? expense.toObject() : expense;
      return {
        ...expenseObj,
        userEmail: expenseObj.userId?.email || expenseObj.userId?.username || expenseObj.email || 'Unknown'
      };
    });

    res.json(formattedAutoExpenses);
  } catch (error) {
    console.error('Get auto expenses error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateAutoExpense = async (req, res) => {
  try {
    if (!AutoExpense) {
      return res.status(501).json({ message: 'Auto expense management not available' });
    }

    const { id } = req.params;
    const autoExpense = await AutoExpense.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!autoExpense) {
      return res.status(404).json({ message: 'Auto expense not found' });
    }

    res.json(autoExpense);
  } catch (error) {
    console.error('Update auto expense error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteAutoExpense = async (req, res) => {
  try {
    if (!AutoExpense) {
      return res.status(501).json({ message: 'Auto expense management not available' });
    }

    const { id } = req.params;
    const autoExpense = await AutoExpense.findByIdAndDelete(id);
    
    if (!autoExpense) {
      return res.status(404).json({ message: 'Auto expense not found' });
    }

    res.json({ message: 'Auto expense deleted successfully' });
  } catch (error) {
    console.error('Delete auto expense error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Profile Management
const getProfiles = async (req, res) => {
  try {
    if (!Profile) {
      return res.json([]);
    }

    const { search, page = 1, limit = 10 } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const profiles = await Profile.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Get users for cross-reference
    let users = [];
    try {
      users = await User.find({}).select('_id name email username');
    } catch (userError) {
      console.log('Could not fetch users for profile cross-reference:', userError.message);
    }

    const formattedProfiles = profiles.map(profile => {
      const profileObj = profile.toObject ? profile.toObject() : profile;
      
      let userEmail = 'Unknown';
      
      // Try to find user info
      if (profileObj.userId) {
        const user = users.find(u => u._id.toString() === profileObj.userId.toString());
        userEmail = user ? (user.email || user.username || user.name) : `User ID: ${profileObj.userId}`;
      } else if (profileObj.user) {
        userEmail = typeof profileObj.user === 'string' ? profileObj.user : 
          (profileObj.user.email || profileObj.user.username || profileObj.user.name);
      } else if (profileObj.email) {
        userEmail = profileObj.email;
      }

      return {
        ...profileObj,
        userEmail,
        // Ensure we have proper display fields
        firstName: profileObj.firstName || profileObj.name || 'N/A',
        lastName: profileObj.lastName || '',
        phone: profileObj.phone || profileObj.phoneNumber || 'N/A'
      };
    });

    res.json(formattedProfiles);
  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    if (!Profile) {
      return res.status(501).json({ message: 'Profile management not available' });
    }

    const { id } = req.params;
    const profile = await Profile.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteProfile = async (req, res) => {
  try {
    if (!Profile) {
      return res.status(501).json({ message: 'Profile management not available' });
    }

    const { id } = req.params;
    const profile = await Profile.findByIdAndDelete(id);
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Transaction Management
const getTransactions = async (req, res) => {
  try {
    if (!Transaction) {
      // Return empty array if model doesn't exist
      return res.json([]);
    }

    const { search, startDate, endDate, type, page = 1, limit = 10 } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { reference: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate && endDate) {
      query.$or = [
        {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        },
        {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      ];
    }

    if (type) {
      query.type = type;
    }

    // Try to populate userId, but handle errors gracefully
    let transactions;
    try {
      transactions = await Transaction.find(query)
        .populate('userId', 'name email username')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
    } catch (populateError) {
      console.log('Transaction populate failed, using basic query:', populateError.message);
      transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
    }

    const formattedTransactions = transactions.map(transaction => {
      const transactionObj = transaction.toObject ? transaction.toObject() : transaction;
      return {
        ...transactionObj,
        userEmail: transactionObj.userId?.email || transactionObj.userId?.username || transactionObj.email || 'Unknown'
      };
    });

    res.json(formattedTransactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateTransaction = async (req, res) => {
  try {
    if (!Transaction) {
      return res.status(501).json({ message: 'Transaction management not available' });
    }

    const { id } = req.params;
    const transaction = await Transaction.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    if (!Transaction) {
      return res.status(501).json({ message: 'Transaction management not available' });
    }

    const { id } = req.params;
    const transaction = await Transaction.findByIdAndDelete(id);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Transaction History Management
const getTransactionHistory = async (req, res) => {
  try {
    if (!TransactionHistory) {
      // Return empty array if model doesn't exist
      return res.json([]);
    }

    const { search, startDate, endDate, page = 1, limit = 10 } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { action: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate && endDate) {
      query.$or = [
        {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        },
        {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      ];
    }

    // Get transaction history with flexible field handling
    const history = await TransactionHistory.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Get User data to cross-reference
    let users = [];
    try {
      users = await User.find({}).select('_id name email username');
    } catch (userError) {
      console.log('Could not fetch users for cross-reference:', userError.message);
    }

    // Get Transaction data to cross-reference
    let transactions = [];
    try {
      if (Transaction) {
        transactions = await Transaction.find({}).select('_id description amount reference');
      }
    } catch (transactionError) {
      console.log('Could not fetch transactions for cross-reference:', transactionError.message);
    }

    // Format the data with better field mapping
    const formattedHistory = history.map(item => {
      const itemObj = item.toObject ? item.toObject() : item;
      
      // Try to find user info from different possible fields
      let userEmail = 'Unknown';
      let userId = null;
      
      // Check various user identification fields
      if (itemObj.userId) {
        userId = itemObj.userId.toString();
        const user = users.find(u => u._id.toString() === userId);
        userEmail = user ? (user.email || user.username || user.name) : `User ID: ${userId}`;
      } else if (itemObj.user) {
        userEmail = typeof itemObj.user === 'string' ? itemObj.user : itemObj.user.email || itemObj.user.name;
      } else if (itemObj.userEmail) {
        userEmail = itemObj.userEmail;
      } else if (itemObj.email) {
        userEmail = itemObj.email;
      }

      // Try to find transaction info
      let transactionId = 'N/A';
      let transactionDetails = '';
      
      if (itemObj.transactionId) {
        transactionId = itemObj.transactionId.toString();
        const transaction = transactions.find(t => t._id.toString() === transactionId);
        transactionDetails = transaction ? `${transaction.description} ($${transaction.amount})` : transactionId;
      } else if (itemObj.transaction) {
        transactionId = typeof itemObj.transaction === 'string' ? itemObj.transaction : itemObj.transaction._id;
        transactionDetails = typeof itemObj.transaction === 'object' ? 
          `${itemObj.transaction.description || 'Transaction'} ($${itemObj.transaction.amount || 0})` : 
          transactionId;
      } else if (itemObj.expenseId) {
        transactionId = itemObj.expenseId.toString();
        transactionDetails = `Expense ID: ${transactionId}`;
      }

      return {
        ...itemObj,
        userEmail,
        transactionId,
        transactionDetails,
        // Ensure we have proper display fields
        action: itemObj.action || itemObj.type || 'Unknown Action',
        description: itemObj.description || itemObj.details || transactionDetails || 'No description',
        amount: itemObj.amount || 0,
        date: itemObj.date || itemObj.createdAt,
        status: itemObj.status || 'completed'
      };
    });

    console.log('Formatted transaction history sample:', formattedHistory[0]);
    res.json(formattedHistory);
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteTransactionHistory = async (req, res) => {
  try {
    if (!TransactionHistory) {
      return res.status(501).json({ message: 'Transaction history management not available' });
    }

    const { id } = req.params;
    const historyItem = await TransactionHistory.findByIdAndDelete(id);
    
    if (!historyItem) {
      return res.status(404).json({ message: 'Transaction history item not found' });
    }

    res.json({ message: 'Transaction history item deleted successfully' });
  } catch (error) {
    console.error('Delete transaction history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin specific controllers
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalExpenses = await Expense.countDocuments();
    
    const amountResult = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalAmount = amountResult.length > 0 ? amountResult[0].total : 0;

    // Calculate monthly growth
    const currentDate = new Date();
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    const lastMonthExpenses = await Expense.countDocuments({
      createdAt: { $gte: lastMonth, $lt: currentMonth }
    });

    const currentMonthExpenses = await Expense.countDocuments({
      createdAt: { $gte: currentMonth }
    });

    const monthlyGrowth = lastMonthExpenses > 0 
      ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses * 100).toFixed(2)
      : 0;

    res.json({
      totalUsers,
      totalExpenses,
      totalAmount,
      monthlyGrowth: parseFloat(monthlyGrowth)
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats', message: error.message });
  }
};

const getUpdatedExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find()
      .sort({ updatedAt: -1 })
      .limit(20)
      .populate('userId', 'name email')
      .lean();

    const formattedExpenses = expenses.map(expense => ({
      _id: expense._id,
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      userEmail: expense.userId?.email || 'Unknown',
      userName: expense.userId?.name || 'Unknown',
      updatedAt: expense.updatedAt,
      createdAt: expense.createdAt
    }));

    res.json(formattedExpenses);
  } catch (error) {
    console.error('Get updated expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses', message: error.message });
  }
};

const getTrends = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trends = await Expense.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          expenses: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const formattedTrends = trends.map(trend => ({
      day: days[new Date(trend._id).getDay()],
      expenses: trend.expenses,
      amount: Math.round(trend.amount)
    }));

    res.json(formattedTrends);
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({ error: 'Failed to fetch trends', message: error.message });
  }
};

const getCategoryStats = async (req, res) => {
  try {
    const categoryStats = await Expense.aggregate([
      {
        $group: {
          _id: '$category',
          value: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { value: -1 } }
    ]);

    const formattedStats = categoryStats.map(stat => ({
      name: stat._id || 'Uncategorized',
      value: Math.round(stat.value),
      count: stat.count
    }));

    res.json(formattedStats);
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({ error: 'Failed to fetch category stats', message: error.message });
  }
};

const getMonthlyStats = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Check if there are any expenses at all
    const totalExpenses = await Expense.countDocuments();
    console.log('Total expenses in database:', totalExpenses);

    if (totalExpenses === 0) {
      console.log('No expenses found, returning empty array');
      return res.json([]);
    }

    // Use flexible date field matching (createdAt or date)
    const monthlyStats = await Expense.aggregate([
      { 
        $addFields: {
          effectiveDate: { 
            $cond: {
              if: { $ifNull: ['$createdAt', false] },
              then: '$createdAt',
              else: { $ifNull: ['$date', new Date()] }
            }
          }
        }
      },
      { 
        $match: { 
          effectiveDate: { $gte: sixMonthsAgo } 
        } 
      },
      {
        $group: {
          _id: { 
            $dateToString: { 
              format: '%Y-%m', 
              date: '$effectiveDate'
            } 
          },
          expenses: { $sum: 1 },
          amount: { $sum: { $ifNull: ['$amount', 0] } },
          users: { $addToSet: '$userId' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('Monthly stats aggregation result:', monthlyStats);

    // If no data in the last 6 months, return empty array
    if (!monthlyStats || monthlyStats.length === 0) {
      console.log('No monthly stats data found for last 6 months');
      return res.json([]);
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedStats = monthlyStats.map(stat => {
      try {
        // Parse the year-month string
        const [year, month] = stat._id.split('-');
        const monthIndex = parseInt(month) - 1; // Convert to 0-based index
        
        return {
          month: months[monthIndex] || stat._id,
          expenses: stat.expenses || 0,
          amount: Math.round(stat.amount || 0),
          users: (stat.users || []).filter(id => id !== null && id !== undefined).length
        };
      } catch (err) {
        console.error('Error formatting month stat:', err, 'stat:', stat);
        return {
          month: stat._id,
          expenses: stat.expenses || 0,
          amount: Math.round(stat.amount || 0),
          users: (stat.users || []).length
        };
      }
    });

    console.log('Formatted monthly stats:', formattedStats);
    res.json(formattedStats);
  } catch (error) {
    console.error('Get monthly stats error:', error);
    console.error('Error stack:', error.stack);
    // Return empty array instead of error to prevent frontend crash
    res.json([]);
  }
};

const getTopUsers = async (req, res) => {
  try {
    const topUsers = await Expense.aggregate([
      {
        $group: {
          _id: '$userId',
          totalSpent: { $sum: '$amount' },
          expenseCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]);

    // Populate user details
    const userIds = topUsers.map(u => u._id).filter(id => id); // Filter out null/undefined
    const users = await User.find({ _id: { $in: userIds } }).select('name email').lean();
    
    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = user;
    });

    const formattedTopUsers = topUsers.map(stat => ({
      _id: stat._id,
      name: userMap[stat._id?.toString()]?.name || 'Unknown',
      email: userMap[stat._id?.toString()]?.email || 'Unknown',
      totalSpent: Math.round(stat.totalSpent),
      expenseCount: stat.expenseCount
    }));

    res.json(formattedTopUsers);
  } catch (error) {
    console.error('Get top users error:', error);
    res.status(500).json({ error: 'Failed to fetch top users', message: error.message });
  }
};

module.exports = {
  adminLogin,
  verifyAdmin,
  getDashboardStats,
  getMonthlyExpenses,
  getCategoryBreakdown,
  getUsers,
  updateUser,
  deleteUser,
  getExpenses,
  deleteExpense,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  // Auto Expense routes
  getAutoExpenses,
  updateAutoExpense,
  deleteAutoExpense,
  // Profile routes
  getProfiles,
  updateProfile,
  deleteProfile,
  // Transaction routes
  getTransactions,
  updateTransaction,
  deleteTransaction,
  // Transaction History routes
  getTransactionHistory,
  deleteTransactionHistory,
  // Admin dashboard specific routes - NOW EXPORTED
  getStats,
  getUpdatedExpenses,
  getTrends,
  getCategoryStats,
  getMonthlyStats,
  getTopUsers
};
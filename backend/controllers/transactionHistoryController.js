const TransactionHistory = require('../models/TransactionHistory');

const createHistoryFromTransaction = async (data) => {
  try {
    // Ensure type defaults to 'expense' if not provided
    const transactionType = data.type || (data.amount < 0 ? 'expense' : 'income');
    
    const historyEntry = new TransactionHistory({
      userId: data.userId,
      date: data.date || new Date(),
      title: data.description || data.item || data.title || 'Untitled',
      amount: Math.abs(data.amount), // Store as positive
      type: transactionType,
      category: data.category || 'Other',
      icon: data.icon || 'receipt',
      note: data.note || '',
      paymentMethod: data.paymentMethod || 'cash',
      status: data.status || 'completed'
    });
    
    const saved = await historyEntry.save();
    console.log('Transaction history created:', saved._id);
    return saved;
  } catch (error) {
    console.error('Error creating transaction history:', error);
    throw error;
  }
};

const getTransactionHistory = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, error: 'User not authenticated or user ID missing.' });
    }
    const userId = req.user._id;
    const history = await TransactionHistory.find({ userId }).sort({ date: -1 });

    // Map and provide defaults for null/missing fields
    const formattedHistory = history.map(entry => ({
      _id: entry._id,
      date: entry.date,
      title: entry.title || entry.description || entry.item || 'Untitled',
      amount: entry.amount,
      type: entry.type || (entry.amount < 0 ? 'expense' : 'income'),
      category: entry.category || 'Other',
      icon: entry.icon || 'receipt',
      note: entry.note || '',
      paymentMethod: entry.paymentMethod || 'cash',
      status: entry.status || 'completed'
    }));

    res.json({
      success: true,
      history: formattedHistory
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// New: Get all transactions (for the /transaction-history route that returns "transactions")
const getAllTransactions = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, error: 'User not authenticated or user ID missing.' });
    }
    const userId = req.user._id;
    
    // Try TransactionHistory first, fallback to Transaction model if needed
    let transactions = await TransactionHistory.find({ userId }).sort({ createdAt: -1 });
    
    // Map and provide defaults for null/missing fields
    const formattedTransactions = transactions.map(entry => ({
      _id: entry._id,
      userId: entry.userId,
      item: entry.title || entry.item || entry.description || 'Untitled',
      description: entry.description || entry.title || entry.item || '',
      amount: entry.amount,
      invoice: entry.invoice || null,
      paymentMethod: entry.paymentMethod || 'cash',
      status: entry.status || 'completed',
      type: entry.type || (entry.amount < 0 ? 'expense' : 'income'),
      category: entry.category || 'Other',
      icon: entry.icon || 'receipt',
      note: entry.note || '',
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      date: entry.date || entry.createdAt
    }));

    res.json({
      success: true,
      transactions: formattedTransactions
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error', details: error.message });
  }
};

const deleteTransactionHistory = async (req, res) => {
  try {
    // Use either req.params.id or req.params._id based on your route definition.
    // Most likely, your route is /admin/transaction-history/:id
    const id = req.params.id || req.params._id;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Transaction history ID is required',
      });
    }
    const deleted = await TransactionHistory.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Transaction history not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction history deleted successfully',
      data: deleted,
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      details: error.message,
    });
  }
};

module.exports = {
  createHistoryFromTransaction,
  getTransactionHistory,
  getAllTransactions,
  deleteTransactionHistory,
};
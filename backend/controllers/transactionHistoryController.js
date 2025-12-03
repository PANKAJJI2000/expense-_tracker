const TransactionHistory = require('../models/TransactionHistory');

const createHistoryFromTransaction = async (data) => {
  try {
    const historyEntry = new TransactionHistory({
      userId: data.userId,
      date: data.date,
      title: data.description || data.item,
      amount: data.amount,
      type: data.type, // Make sure this is included
      category: data.category ?? null,
      icon: data.icon ?? null,
      note: data.note,
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
    const history = await TransactionHistory.find({ userId });

    // Map to include only necessary fields (category and icon as null if missing)
    const formattedHistory = history.map(entry => ({
      _id: entry._id,
      date: entry.date,
      title: entry.title,
      amount: entry.amount,
      type: entry.type,
      category: entry.category ?? null,
      icon: entry.icon ?? null,
      note: entry.note,
      paymentMethod: entry.paymentMethod,
      status: entry.status
    }));

    res.json({
      success: true,
      history: formattedHistory
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
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
  deleteTransactionHistory,
  // ...other exports
};
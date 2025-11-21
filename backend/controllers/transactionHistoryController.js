const TransactionHistory = require("../models/TransactionHistory");

// Helper function to create history from transaction data
const createHistoryFromTransaction = async (transactionData) => {
  try {
    const historyEntry = new TransactionHistory({
      userId: transactionData.userId,
      date: transactionData.date,
      title: transactionData.description,
      amount: transactionData.amount,
      type: transactionData.type,
      category: transactionData.category,
      icon: transactionData.icon || 'default',
      note: transactionData.note || transactionData.description
    });
    
    return await historyEntry.save();
  } catch (error) {
    console.error("Error creating transaction history:", error);
    throw error;
  }
};

// Helper function to update history from transaction data
const updateHistoryFromTransaction = async (transactionData) => {
  try {
    const updated = await TransactionHistory.findOneAndUpdate(
      { 
        userId: transactionData.userId,
        title: transactionData.oldDescription || transactionData.description,
        amount: transactionData.oldAmount || transactionData.amount
      },
      {
        date: transactionData.date,
        title: transactionData.description,
        amount: transactionData.amount,
        type: transactionData.type,
        category: transactionData.category,
        icon: transactionData.icon || 'default',
        note: transactionData.note || transactionData.description
      },
      { new: true }
    );
    
    return updated;
  } catch (error) {
    console.error("Error updating transaction history:", error);
    throw error;
  }
};

// Helper function to delete history from transaction data
const deleteHistoryFromTransaction = async (userId, transactionData) => {
  try {
    const deleted = await TransactionHistory.findOneAndDelete({
      userId: userId,
      title: transactionData.description,
      amount: transactionData.amount,
      type: transactionData.type
    });
    
    return deleted;
  } catch (error) {
    console.error("Error deleting transaction history:", error);
    throw error;
  }
};

// Create
exports.addTransactionHistory = async (req, res) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: "Unauthorized: User not authenticated" });
}
  try {
    const { date, title, amount, type, category, icon, note } = req.body;
    const newHistory = new TransactionHistory({
      userId: req.user.userId,
      date,
      title,
      amount,
      type,
      category,
      icon,
      note
    });
    await newHistory.save();
    res.status(201).json(newHistory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Read (all/filter)
exports.getTransactionHistories = async (req, res) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: "Unauthorized: User not authenticated" });
  }
  try {
    const { startDate, endDate, category, type } = req.query;
    let filter = { userId: req.user.userId };

    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (category) filter.category = category;
    if (type) filter.type = type;

    const histories = await TransactionHistory.find(filter).sort({ date: -1 });
    res.json(histories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update
exports.updateTransactionHistory = async (req, res) => {
  // Improve authentication error logging
  if (!req.user) {
    console.error("Authentication error: req.user is undefined or null");
    return res.status(401).json({ error: "Unauthorized: User not authenticated" });
  }
  
  if (!req.user.userId) {
    console.error("Authentication error: req.user exists but userId is missing");
    return res.status(401).json({ error: "Unauthorized: User ID not found" });
  }
  
  try {
    const id = req.params.id;
    const updateFields = req.body;
    
    console.log(`Attempting to update transaction ${id} for user ${req.user.userId}`);
    
    const updated = await TransactionHistory.findOneAndUpdate(
      { _id: id, userId: req.user.userId },
      updateFields,
      { new: true }
    );
    
    if (!updated) {
      console.log(`Transaction ${id} not found or doesn't belong to user ${req.user.userId}`);
      return res.status(404).json({ error: "Transaction not found or unauthorized access" });
    }
    
    res.json(updated);
  } catch (err) {
    console.error("Transaction update error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Delete
exports.deleteTransactionHistory = async (req, res) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: "Unauthorized: User not authenticated" });
  }
  try {
    const id = req.params.id;
    const deleted = await TransactionHistory.findOneAndDelete({ _id: id, userId: req.user.userId });
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true, message: "Deleted", history: deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Export helper functions
exports.createHistoryFromTransaction = createHistoryFromTransaction;
exports.updateHistoryFromTransaction = updateHistoryFromTransaction;
exports.deleteHistoryFromTransaction = deleteHistoryFromTransaction;

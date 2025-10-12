const TransactionHistory = require("../models/TransactionHistory");

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

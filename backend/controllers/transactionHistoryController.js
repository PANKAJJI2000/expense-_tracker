const TransactionHistory = require('../models/TransactionHistory');

const createHistoryFromTransaction = async (data) => {
  try {
    const historyEntry = new TransactionHistory({
      userId: data.userId,
      date: data.date,
      title: data.description || data.item,
      amount: data.amount,
      type: data.type, // Make sure this is included
      category: data.category,
      icon: data.icon || '💰',
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

module.exports = {
  createHistoryFromTransaction,
  // ...other exports
};
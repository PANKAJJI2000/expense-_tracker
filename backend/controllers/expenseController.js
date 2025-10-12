const Expense = require('../models/Expense');

const expenseController = {
  async getAllExpenses(req, res) {
    try {
      const expenses = await Expense.find({ userId: req.user._id }).sort({ date: -1 });
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async createExpense(req, res) {
    try {
      const { title, amount, date, category } = req.body;
      
      if (!title || !amount || !date) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const newExpense = new Expense({
        title,
        amount: parseInt(amount),
        date,
        category: category || 'General',
        userId: req.user._id
      });
      
      await newExpense.save();
      res.status(201).json(newExpense);
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async getExpenseSummary(req, res) {
    try {
      const expenses = await Expense.find({ userId: req.user._id });
      const totalExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0);

      const summary = expenses.reduce((acc, expense) => {
        const { title, amount } = expense;
        if (!acc[title]) {
          acc[title] = { title, totalAmount: 0 };
        }
        acc[title].totalAmount += amount;
        return acc;
      }, {});

      res.status(200).json({
        message: 'Expense summary retrieved successfully',
        totalExpenses,
        summary: Object.values(summary),
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  },

  async updateExpense(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const expense = await Expense.findOneAndUpdate(
        { _id: id, userId: req.user._id },
        updates,
        { new: true }
      );
      
      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      
      res.json(expense);
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async deleteExpense(req, res) {
    try {
      const { id } = req.params;
      
      const expense = await Expense.findOneAndDelete({ _id: id, userId: req.user._id });
      
      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      
      res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  }
};

module.exports = expenseController;

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
      const { title, amount, date, category, fullName, email, phone } = req.body;
      
      if (!title || !amount || !date) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const newExpense = new Expense({
        title,
        amount: parseInt(amount),
        date,
        category: category || 'General',
        fullName: fullName || req.user?.name,
        email: email || req.user?.email,
        phone: phone || '',
        userId: req.user._id
      });
      
      await newExpense.save();
      res.status(201).json({
        success: true,
        message: 'Expense created successfully',
        data: newExpense
      });
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
  },

  async getExpensesByPeriod(req, res) {
    try {
      const { period } = req.query; // 'yearly', 'monthly', or 'weekly'
      const userId = req.user._id;
      
      let groupBy, dateFormat, sortOrder;
      
      switch (period) {
        case 'yearly':
          groupBy = { year: { $year: '$date' } };
          dateFormat = '%Y';
          sortOrder = { '_id.year': 1 };
          break;
        case 'monthly':
          groupBy = { 
            year: { $year: '$date' },
            month: { $month: '$date' }
          };
          dateFormat = '%Y-%m';
          sortOrder = { '_id.year': 1, '_id.month': 1 };
          break;
        case 'weekly':
          groupBy = {
            year: { $year: '$date' },
            week: { $week: '$date' }
          };
          dateFormat = '%Y-W%V';
          sortOrder = { '_id.year': 1, '_id.week': 1 };
          break;
        default:
          return res.status(400).json({ error: 'Invalid period. Use yearly, monthly, or weekly' });
      }
      
      const expenses = await Expense.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: groupBy,
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: sortOrder }
      ]);
      
      // Format the response for bar graph
      const formattedData = expenses.map(item => {
        let label;
        if (period === 'yearly') {
          label = `${item._id.year}`;
        } else if (period === 'monthly') {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          label = `${monthNames[item._id.month - 1]} ${item._id.year}`;
        } else {
          label = `Week ${item._id.week}, ${item._id.year}`;
        }
        
        return {
          label,
          totalAmount: item.totalAmount,
          count: item.count
        };
      });
      
      res.status(200).json({
        success: true,
        period,
        data: formattedData,
        total: formattedData.reduce((acc, item) => acc + item.totalAmount, 0)
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  }
};

module.exports = expenseController;

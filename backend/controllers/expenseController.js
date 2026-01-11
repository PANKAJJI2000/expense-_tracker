const Expense = require('../models/Expense');
const Transaction = require('../models/Transaction');

const expenseController = {
  async getAllExpenses(req, res) {
    try {
      const { currentMonth } = req.query;
      const now = new Date();
      let query = { userId: req.user._id, type: 'expense' };
      
      // Filter by current month if requested
      if (currentMonth === 'true') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        
        // console.log('=== CURRENT MONTH FILTER DEBUG ===');
        // console.log('Server Date:', now);
        // console.log('Start of Month:', startOfMonth);
        // console.log('End of Month:', endOfMonth);
        // console.log('Month being filtered:', now.toLocaleString('default', { month: 'long', year: 'numeric' }));
        
        query.date = { 
          $gte: startOfMonth, 
          $lte: endOfMonth 
        };
        
        // Debug: Check all transactions first
        const allTxns = await Transaction.find({ userId: req.user._id, type: 'expense' });
        console.log(`\nTotal Transactions: ${allTxns.length}`);
        console.log('\nTransaction Details:');
        allTxns.forEach((t, idx) => {
          try {
            const tDate = new Date(t.date);
            const isValid = !isNaN(tDate.getTime());
            if (isValid) {
              const inRange = tDate >= startOfMonth && tDate <= endOfMonth;
              console.log(`${idx + 1}. "${t.item}"`);
              console.log(`   Date in DB: ${t.date}`);
              console.log(`   Parsed Date: ${tDate}`);
              console.log(`   Month/Year: ${tDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`);
              console.log(`   In Current Month Range: ${inRange ? 'YES ✓' : 'NO ✗'}`);
              console.log('');
            } else {
              console.log(`${idx + 1}. "${t.item}": INVALID DATE (${t.date})`);
            }
          } catch (err) {
            console.log(`${idx + 1}. "${t.item}": ERROR - ${err.message}`);
          }
        });
      }
      
      // Get from Transaction History
      const transactions = await Transaction.find(query).sort({ date: -1 });
      
      console.log(`\nFinal Query Result: ${transactions.length} transactions found`);
      
      const response = {
        success: true,
        count: transactions.length,
        currentMonth: currentMonth === 'true',
        source: 'Transaction History',
        serverDate: now.toISOString(),
        filteringMonth: currentMonth === 'true' ? now.toLocaleString('default', { month: 'long', year: 'numeric' }) : null,
        data: transactions.map(t => {
          const obj = t.toObject();
          return {
            ...obj,
            title: t.item,
            dateValid: !isNaN(new Date(t.date).getTime())
          };
        })
      };
      
      if (currentMonth === 'true') {
        response.dateFilter = {
          start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString()
        };
      }
      
      res.json(response);
    } catch (error) {
      console.error('Error in getAllExpenses:', error);
      res.status(500).json({ error: 'Server error', details: error.message, stack: error.stack });
    }
  },

  async createExpense(req, res) {
    try {
      const { title, amount, date, category, fullName, email, phone } = req.body;
      
      if (!title || !amount || !date || !fullName || !email || !phone) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Create Transaction with correct field mapping
      const newTransaction = new Transaction({
        item: title, // Transaction model uses 'item' not 'title'
        amount: parseInt(amount),
        date: new Date(date),
        category: category || 'General',
        type: 'expense',
        fullName: fullName || req.user?.name,
        email: email || req.user?.email,
        phone: phone || req.user?.phone || '',
        userId: req.user._id,
        status: 'completed'
      });
      
      await newTransaction.save();
      
      // Also save to Expense for backward compatibility
      const newExpense = new Expense({
        title,
        amount: parseInt(amount),
        date: new Date(date),
        category: category || 'General',
        fullName: fullName || req.user?.name,
        email: email || req.user?.email,
        phone: phone || '',
        userId: req.user._id
      });
      
      await newExpense.save();
      
      res.status(201).json({
        success: true,
        message: 'Expense transaction created successfully',
        data: {
          ...newTransaction.toObject(),
          title: newTransaction.item // Return as title for frontend compatibility
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async getExpenseSummary(req, res) {
    try {
      // Get from Transaction History
      const transactions = await Transaction.find({ 
        userId: req.user._id, 
        type: 'expense' 
      });
      
      const totalExpenses = transactions.reduce((acc, txn) => acc + txn.amount, 0);

      const summary = transactions.reduce((acc, txn) => {
        const title = txn.item || txn.title; // Handle both field names
        const { amount } = txn;
        if (!acc[title]) {
          acc[title] = { title, totalAmount: 0 };
        }
        acc[title].totalAmount += amount;
        return acc;
      }, {});

      res.status(200).json({
        message: 'Expense summary retrieved successfully from Transaction History',
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
      
      // Update in Transaction History
      const transaction = await Transaction.findOneAndUpdate(
        { _id: id, userId: req.user._id, type: 'expense' },
        updates,
        { new: true }
      );
      
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      // Also update in Expense
      await Expense.findOneAndUpdate(
        { _id: id, userId: req.user._id },
        updates,
        { new: true }
      );
      
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async deleteExpense(req, res) {
    try {
      const { id } = req.params;
      
      // Delete from Transaction History
      const transaction = await Transaction.findOneAndDelete({ 
        _id: id, 
        userId: req.user._id,
        type: 'expense'
      });
      
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      // Also delete from Expense
      await Expense.findOneAndDelete({ _id: id, userId: req.user._id });
      
      res.json({ message: 'Expense transaction deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async getExpensesByPeriod(req, res) {
    try {
      const userId = req.user._id;
      const now = new Date();
      
      // Get all transactions to see what's in database
      const allTransactions = await Transaction.find({ 
        userId,
        type: 'expense'
      });
      
      // console.log('=== DEBUG INFO ===');
      // console.log('Total transactions found:', allTransactions.length);
      // console.log('Current server date:', now);
      
      // Log each transaction's raw data
      allTransactions.forEach((txn, index) => {
        console.log(`\nTransaction ${index + 1}:`);
        console.log('  Item:', txn.item);
        console.log('  Amount:', txn.amount);
        console.log('  Date (raw):', txn.date);
        console.log('  Date (parsed):', new Date(txn.date));
        console.log('  Date valid?:', !isNaN(new Date(txn.date).getTime()));
      });
      
      // Get Last 28 days data from Transaction History
      const last28DaysStart = new Date(now);
      last28DaysStart.setDate(now.getDate() - 28);
      last28DaysStart.setHours(0, 0, 0, 0);
      
      const last28DaysTransactions = await Transaction.find({
        userId,
        type: 'expense',
        date: { $gte: last28DaysStart, $lte: now }
      });
      
      // console.log('\n=== FILTERING RESULTS ===');
      // console.log('Last 28 days range:', last28DaysStart, 'to', now);
      // console.log('Last 28 days transactions found:', last28DaysTransactions.length);
      
      // Calculate weekly expenses
      const weeklyExpenses = {
        Week1: 0,
        Week2: 0,
        Week3: 0,
        Week4: 0
      };
      
      last28DaysTransactions.forEach(txn => {
        const txnDate = new Date(txn.date);
        if (isNaN(txnDate.getTime())) {
          console.log('Invalid date found:', txn.date);
          return;
        }
        const daysDiff = Math.floor((now - txnDate) / (1000 * 60 * 60 * 24));
        console.log(`Transaction: ${txn.item}, Date: ${txnDate.toISOString()}, Days ago: ${daysDiff}, Amount: ${txn.amount}`);
        
        if (daysDiff >= 0 && daysDiff < 7) weeklyExpenses.Week4 += txn.amount;
        else if (daysDiff >= 7 && daysDiff < 14) weeklyExpenses.Week3 += txn.amount;
        else if (daysDiff >= 14 && daysDiff < 21) weeklyExpenses.Week2 += txn.amount;
        else if (daysDiff >= 21 && daysDiff < 28) weeklyExpenses.Week1 += txn.amount;
      });
      
      // Get Last 12 months data
      const last12MonthsStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      last12MonthsStart.setHours(0, 0, 0, 0);
      
      const last12MonthsTransactions = await Transaction.find({
        userId,
        type: 'expense',
        date: { $gte: last12MonthsStart, $lte: now }
      });
      
      // console.log('Last 12 months range:', last12MonthsStart, 'to', now);
      // console.log('Last 12 months transactions found:', last12MonthsTransactions.length);
      
      const monthlyExpenses = {
        January: 0,
        February: 0,
        March: 0,
        April: 0,
        May: 0,
        June: 0,
        July: 0,
        August: 0,
        September: 0,
        October: 0,
        November: 0,
        December: 0
      };
      
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
      
      last12MonthsTransactions.forEach(txn => {
        const txnDate = new Date(txn.date);
        if (isNaN(txnDate.getTime())) {
          console.log('Invalid date in 12 months:', txn.date);
          return;
        }
        const monthName = monthNames[txnDate.getMonth()];
        console.log(`Month transaction: ${txn.item}, Month: ${monthName}, Amount: ${txn.amount}`);
        monthlyExpenses[monthName] += txn.amount;
      });
      
      // Get Year-wise total
      const yearlyExpenses = {};
      
      allTransactions.forEach(txn => {
        const txnDate = new Date(txn.date);
        if (isNaN(txnDate.getTime())) {
          console.log('Invalid date in yearly - Item:', txn.item, 'Date:', txn.date);
          return;
        }
        const year = txnDate.getFullYear();
        console.log(`Year transaction: ${txn.item}, Year: ${year}, Amount: ${txn.amount}`);
        
        if (!yearlyExpenses[year]) {
          yearlyExpenses[year] = 0;
        }
        yearlyExpenses[year] += txn.amount;
      });
      
      const sortedYearlyExpenses = Object.keys(yearlyExpenses)
        .sort()
        .reduce((acc, year) => {
          acc[year] = yearlyExpenses[year];
          return acc;
        }, {});
      
      res.status(200).json({
        success: true,
        message: 'Bar graph data retrieved from Transaction History',
        source: 'Transaction History',
        debug: {
          totalTransactions: allTransactions.length,
          last28DaysCount: last28DaysTransactions.length,
          last12MonthsCount: last12MonthsTransactions.length,
          serverTime: now.toISOString(),
          dateRange: {
            last28Start: last28DaysStart.toISOString(),
            last12Start: last12MonthsStart.toISOString(),
            now: now.toISOString()
          },
          rawTransactions: allTransactions.map(t => ({
            item: t.item,
            amount: t.amount,
            date: t.date,
            dateValid: !isNaN(new Date(t.date).getTime())
          }))
        },
        data: {
          'Last 28 days': {
            'Monthly Expense': weeklyExpenses
          },
          'Last 12 months': {
            'Year Expenses': monthlyExpenses
          },
          'Total Expenses year wise': sortedYearlyExpenses
        },
        isUpdated: true,
        lastUpdated: now
      });
    } catch (error) {
      console.error('Error in getExpensesByPeriod:', error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async getCurrentMonthSummary(req, res) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      
      // Get from Transaction History
      const transactions = await Transaction.find({
        userId: req.user._id,
        type: 'expense',
        date: { 
          $gte: startOfMonth, 
          $lte: endOfMonth 
        }
      });
      
      const totalAmount = transactions.reduce((sum, txn) => sum + txn.amount, 0);
      const transactionCount = transactions.length;
      
      const categoryBreakdown = transactions.reduce((acc, txn) => {
        const category = txn.category || 'General';
        if (!acc[category]) {
          acc[category] = { category, amount: 0, count: 0 };
        }
        acc[category].amount += txn.amount;
        acc[category].count += 1;
        return acc;
      }, {});
      
      res.status(200).json({
        success: true,
        message: 'Current month summary from Transaction History',
        source: 'Transaction History',
        currentMonth: `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`,
        dateRange: {
          start: startOfMonth.toISOString(),
          end: endOfMonth.toISOString()
        },
        summary: {
          totalAmount,
          transactionCount,
          averagePerTransaction: transactionCount > 0 ? parseFloat((totalAmount / transactionCount).toFixed(2)) : 0,
          categoryBreakdown: Object.values(categoryBreakdown)
        },
        isUpdated: true,
        lastUpdated: transactions.length > 0 ? transactions[0].date : null
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async verifyCurrentMonthExpenses(req, res) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      
      // Get from Transaction History
      const currentMonthTransactions = await Transaction.find({
        userId: req.user._id,
        type: 'expense',
        date: { 
          $gte: startOfMonth, 
          $lte: endOfMonth 
        }
      }).sort({ date: -1 });
      
      const totalSum = currentMonthTransactions.reduce((sum, txn) => sum + txn.amount, 0);
      
      res.status(200).json({
        success: true,
        message: 'Current month expenses verified from Transaction History',
        source: 'Transaction History',
        month: `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`,
        dateRange: {
          start: startOfMonth.toISOString(),
          end: endOfMonth.toISOString()
        },
        totalExpenses: currentMonthTransactions.length,
        totalAmount: totalSum,
        isUpdated: currentMonthTransactions.length > 0,
        transactions: currentMonthTransactions.map(txn => ({
          id: txn._id,
          title: txn.item || txn.title,
          amount: txn.amount,
          date: txn.date,
          category: txn.category,
          type: txn.type
        }))
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  // Temporary helper to check and fix invalid dates
  async fixInvalidDates(req, res) {
    try {
      const allTransactions = await Transaction.find({ userId: req.user._id });
      
      const invalidTransactions = [];
      const validTransactions = [];
      
      allTransactions.forEach(txn => {
        const dateObj = new Date(txn.date);
        if (isNaN(dateObj.getTime())) {
          invalidTransactions.push({
            id: txn._id,
            item: txn.item,
            date: txn.date,
            amount: txn.amount,
            createdAt: txn.createdAt
          });
        } else {
          validTransactions.push({
            id: txn._id,
            item: txn.item,
            date: dateObj.toISOString(),
            amount: txn.amount
          });
        }
      });
      
      res.json({
        success: true,
        total: allTransactions.length,
        valid: validTransactions.length,
        invalid: invalidTransactions.length,
        invalidTransactions,
        validTransactions: validTransactions.slice(0, 5), // Show first 5 valid ones
        message: invalidTransactions.length > 0 
          ? 'Found invalid dates. Delete these transactions or update their dates manually.'
          : 'All transaction dates are valid!'
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  }
};

module.exports = expenseController;

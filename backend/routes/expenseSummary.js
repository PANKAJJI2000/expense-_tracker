const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// Helper to get date ranges
function getDateRange(type, customStart, customEnd) {
  const now = new Date();
  let start, end;
  switch (type) {
    case 'weekly':
      start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      break;
    case 'monthly':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'yearly':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
      break;
    case 'custom':
      start = new Date(customStart);
      end = new Date(customEnd);
      break;
    case 'lifetime':
    default:
      start = null;
      end = null;
  }
  return { start, end };
}

router.get('/summary', async (req, res) => {
  const { type, startDate, endDate } = req.query;
  const { start, end } = getDateRange(type, startDate, endDate);

  let match = {};
  if (start && end) {
    match.date = { $gte: start, $lte: end };
  }

  try {
    const expenses = await Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);
    res.json({
      totalAmount: expenses[0]?.totalAmount || 0,
      count: expenses[0]?.count || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

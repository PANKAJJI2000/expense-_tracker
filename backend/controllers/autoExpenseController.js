const AutoExpense = require('../models/AutoExpense');

// Get all auto expenses with filtering
const getAutoExpenses = async (req, res) => {
  try {
    const { filter = 'All', page = 1, limit = 10 } = req.query;
    const userId = req.user.id; // Assuming user is authenticated

    const expenses = await AutoExpense.getFilteredExpenses(userId, filter)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AutoExpense.countDocuments({
      userId,
      ...(filter !== 'All' && { status: filter })
    });

    res.json({
      success: true,
      data: expenses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching auto expenses',
      error: error.message
    });
  }
};

// Create new auto expense
const createAutoExpense = async (req, res) => {
  try {
    const { detectedAmount, detectedTitle, originalDate, source, category, confidence } = req.body;
    const userId = req.user.id;

    const autoExpense = new AutoExpense({
      userId,
      detectedAmount,
      detectedTitle,
      originalDate,
      source,
      category,
      confidence
    });

    await autoExpense.save();

    res.status(201).json({
      success: true,
      message: 'Auto expense created successfully',
      data: autoExpense
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating auto expense',
      error: error.message
    });
  }
};

// Get single auto expense
const getAutoExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const autoExpense = await AutoExpense.findOne({ _id: id, userId });

    if (!autoExpense) {
      return res.status(404).json({
        success: false,
        message: 'Auto expense not found'
      });
    }

    res.json({
      success: true,
      data: autoExpense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching auto expense',
      error: error.message
    });
  }
};

// Update auto expense status
const updateAutoExpenseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const autoExpense = await AutoExpense.findOne({ _id: id, userId });

    if (!autoExpense) {
      return res.status(404).json({
        success: false,
        message: 'Auto expense not found'
      });
    }

    autoExpense.status = status;
    await autoExpense.save();

    res.json({
      success: true,
      message: `Auto expense marked as ${status}`,
      data: autoExpense
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating auto expense status',
      error: error.message
    });
  }
};

// Mark as saved
const markAsSaved = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const autoExpense = await AutoExpense.findOne({ _id: id, userId });

    if (!autoExpense) {
      return res.status(404).json({
        success: false,
        message: 'Auto expense not found'
      });
    }

    await autoExpense.markAsSaved();

    res.json({
      success: true,
      message: 'Auto expense marked as saved',
      data: autoExpense
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error marking auto expense as saved',
      error: error.message
    });
  }
};

// Mark as dismissed
const markAsDismissed = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const autoExpense = await AutoExpense.findOne({ _id: id, userId });

    if (!autoExpense) {
      return res.status(404).json({
        success: false,
        message: 'Auto expense not found'
      });
    }

    await autoExpense.markAsDismissed();

    res.json({
      success: true,
      message: 'Auto expense dismissed',
      data: autoExpense
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error dismissing auto expense',
      error: error.message
    });
  }
};

// Delete auto expense
const deleteAutoExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const autoExpense = await AutoExpense.findOneAndDelete({ _id: id, userId });

    if (!autoExpense) {
      return res.status(404).json({
        success: false,
        message: 'Auto expense not found'
      });
    }

    res.json({
      success: true,
      message: 'Auto expense deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting auto expense',
      error: error.message
    });
  }
};

// Get statistics
const getAutoExpenseStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await AutoExpense.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$detectedAmount' }
        }
      }
    ]);

    const totalDetected = await AutoExpense.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        totalDetected,
        statusBreakdown: stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAutoExpenses,
  createAutoExpense,
  getAutoExpenseById,
  updateAutoExpenseStatus,
  markAsSaved,
  markAsDismissed,
  deleteAutoExpense,
  getAutoExpenseStats
};

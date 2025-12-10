const Budget = require("../models/Budget");
const mongoose = require("mongoose");

// @desc    Create or update monthly budget
// @route   POST /api/budgets
// @access  Private
exports.createBudget = async (req, res) => {
  try {
    const { month, year, totalBudget, categories, currency, notes } = req.body;
    
    // Get userId from authenticated user or from body (fallback for testing)
    const userId = req.user?._id || req.user?.id || req.body.userId;

    // Validate userId
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated. Please login first.",
      });
    }

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Validate required fields
    if (!month || !year || totalBudget === undefined) {
      return res.status(400).json({
        success: false,
        message: "Month, year, and totalBudget are required",
      });
    }

    // Check if budget already exists for this month/year
    const existingBudget = await Budget.findOne({ userId, month, year });

    if (existingBudget) {
      // Update existing budget
      const updatedBudget = await Budget.findByIdAndUpdate(
        existingBudget._id,
        {
          totalBudget,
          categories: categories || existingBudget.categories,
          currency: currency || existingBudget.currency,
          notes: notes !== undefined ? notes : existingBudget.notes,
        },
        { new: true, runValidators: true }
      );

      return res.status(200).json({
        success: true,
        message: "Budget updated successfully",
        data: updatedBudget,
      });
    }

    // Create new budget
    const budget = await Budget.create({
      userId,
      month,
      year,
      totalBudget,
      categories: categories || [],
      currency: currency || "INR",
      notes: notes || "",
    });

    res.status(201).json({
      success: true,
      message: "Budget created successfully",
      data: budget,
    });
  } catch (error) {
    console.error("Create Budget Error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get monthly budget
// @route   GET /api/budgets
// @access  Private
exports.getBudget = async (req, res) => {
  try {
    // Get userId from authenticated user or from query (fallback for testing/admin)
    const userId = req.user?._id || req.user?.id || req.query.userId;
    const { month, year } = req.query;

    // If no userId provided, return all budgets (admin mode)
    if (!userId) {
      const allBudgets = await Budget.find({})
        .populate("userId", "name email")
        .sort({ year: -1, month: -1 });

      return res.status(200).json({
        success: true,
        count: allBudgets.length,
        data: allBudgets,
      });
    }

    // If month/year provided, get specific budget
    if (month && year) {
      const budget = await Budget.findOne({
        userId,
        month: parseInt(month),
        year: parseInt(year),
      }).populate("userId", "name email");

      if (!budget) {
        return res.status(404).json({
          success: false,
          message: "Budget not found for this month/year",
        });
      }

      return res.status(200).json({
        success: true,
        data: budget,
      });
    }

    // Otherwise, get all budgets for user
    const budgets = await Budget.find({ userId })
      .populate("userId", "name email")
      .sort({ year: -1, month: -1 });

    res.status(200).json({
      success: true,
      count: budgets.length,
      data: budgets,
    });
  } catch (error) {
    console.error("Get Budget Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get current month budget
// @route   GET /api/budgets/current
// @access  Private
exports.getCurrentBudget = async (req, res) => {
  try {
    // Get userId from authenticated user or from query (fallback for testing)
    const userId = req.user?._id || req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated. Please login first.",
      });
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const budget = await Budget.findOne({
      userId,
      month: currentMonth,
      year: currentYear,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "No budget set for current month",
        data: {
          month: currentMonth,
          year: currentYear,
          totalBudget: 0,
          categories: [],
        },
      });
    }

    res.status(200).json({
      success: true,
      data: budget,
    });
  } catch (error) {
    console.error("Get Current Budget Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update category spent amount
// @route   PUT /api/budgets/:id/category/:categoryId
// @access  Private
exports.updateCategorySpent = async (req, res) => {
  try {
    const { id, categoryId } = req.params;
    const { spent } = req.body;
    const userId = req.user?._id || req.user?.id || req.body.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated. Please login first.",
      });
    }

    const budget = await Budget.findOne({ _id: id, userId });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    const category = budget.categories.id(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found in budget",
      });
    }

    category.spent = spent;
    await budget.save();

    res.status(200).json({
      success: true,
      message: "Category spent updated",
      data: budget,
    });
  } catch (error) {
    console.error("Update Category Spent Error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
exports.deleteBudget = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated. Please login first.",
      });
    }

    const budget = await Budget.findOneAndDelete({ _id: req.params.id, userId });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Budget deleted successfully",
      data: budget,
    });
  } catch (error) {
    console.error("Delete Budget Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all budgets (Admin)
// @route   GET /api/budgets/all
// @access  Private/Admin
exports.getAllBudgetsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 50, month, year, userId } = req.query;

    const query = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (userId) query.userId = userId;

    const budgets = await Budget.find(query)
      .populate("userId", "name email")
      .sort({ year: -1, month: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Budget.countDocuments(query);

    res.status(200).json({
      success: true,
      count: budgets.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: budgets,
    });
  } catch (error) {
    console.error("Get All Budgets Admin Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update budget (Admin)
// @route   PUT /api/budgets/:id
// @access  Private/Admin
exports.updateBudgetAdmin = async (req, res) => {
  try {
    const { totalBudget, notes, categories, currency } = req.body;

    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    // Update fields
    if (totalBudget !== undefined) budget.totalBudget = totalBudget;
    if (notes !== undefined) budget.notes = notes;
    if (categories !== undefined) budget.categories = categories;
    if (currency !== undefined) budget.currency = currency;

    await budget.save();

    // Populate user info for response
    await budget.populate("userId", "name email");

    res.status(200).json({
      success: true,
      message: "Budget updated successfully",
      data: budget,
    });
  } catch (error) {
    console.error("Update Budget Admin Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete budget (Admin)
// @route   DELETE /api/budgets/:id/admin
// @access  Private/Admin
exports.deleteBudgetAdmin = async (req, res) => {
  try {
    const budget = await Budget.findByIdAndDelete(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Budget deleted successfully",
      data: budget,
    });
  } catch (error) {
    console.error("Delete Budget Admin Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

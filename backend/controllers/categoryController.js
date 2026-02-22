const Category = require('../models/Category');
const Expense = require('../models/Expense');

// Helper: Build date filter based on period
const buildDateFilter = (period) => {
    const now = new Date();
    if (period === 'weekly') {
        return { date: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
    } else if (period === 'monthly') {
        return { date: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) } };
    } else if (period === 'yearly') {
        return { date: { $gte: new Date(now.getFullYear(), 0, 1) } };
    }
    // 'lifetime' or no period = no date filter
    return {};
};

// Create a new category
const createCategory = async (req, res) => {
    try {
        const { name, description, type, icon, color, budgetLimit } = req.body;

        // Validation
        if (!name || !type) {
            return res.status(400).json({
                success: false,
                message: 'Category name and type are required'
            });
        }

        // Check if category already exists
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name already exists'
            });
        }

        // Create new category
        const newCategory = new Category({
            name,
            description,
            type,
            icon: icon || '📁',
            color: color || '#6366f1',
            budgetLimit: budgetLimit || 0
        });

        const savedCategory = await newCategory.save();

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: savedCategory
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating category',
            error: error.message
        });
    }
};

// Get all categories
const getAllCategories = async (req, res) => {
    try {
        const { type } = req.query; // Optional filter by type (income/expense)
        
        let filter = {};
        if (type) {
            filter.type = type;
        }

        const categories = await Category.find(filter).sort({ name: 1 });

        res.status(200).json({
            success: true,
            message: 'Categories retrieved successfully',
            count: categories.length,
            data: categories
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: error.message
        });
    }
};

// Get single category by ID
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Category retrieved successfully',
            data: category
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching category',
            error: error.message
        });
    }
};

// Update category
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, type, icon, color, budgetLimit, isActive } = req.body;

        // Validation
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        // Check if category exists
        const existingCategory = await Category.findById(id);
        if (!existingCategory) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Build update object
        const updateData = { name, description, type };
        if (icon !== undefined) updateData.icon = icon;
        if (color !== undefined) updateData.color = color;
        if (budgetLimit !== undefined) updateData.budgetLimit = budgetLimit;
        if (isActive !== undefined) updateData.isActive = isActive;

        // Update category
        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: updatedCategory
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating category',
            error: error.message
        });
    }
};

// Delete category
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if category exists
        const existingCategory = await Category.findById(id);
        if (!existingCategory) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Delete category
        await Category.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting category',
            error: error.message
        });
    }
};

// Get top categories by expense amount with percentage
const getTopCategories = async (req, res) => {
    try {
        const { limit = 5, period } = req.query;
        const topLimit = parseInt(limit) || 5;

        const dateFilter = buildDateFilter(period);

        // Aggregate expenses by category
        const pipeline = [
            { $match: dateFilter },
            {
                $group: {
                    _id: '$category',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { totalAmount: -1 } },
            { $limit: topLimit }
        ];

        const categoryExpenses = await Expense.aggregate(pipeline);

        // Calculate total expenses for percentage
        const totalExpenses = categoryExpenses.reduce((sum, cat) => sum + cat.totalAmount, 0);

        // Format response with percentage
        const topCategories = categoryExpenses.map((cat, index) => ({
            rank: index + 1,
            category: cat._id || 'Uncategorized',
            totalAmount: cat.totalAmount,
            count: cat.count,
            percentage: totalExpenses > 0 
                ? Math.round((cat.totalAmount / totalExpenses) * 100) 
                : 0
        }));

        // Find highest expense category
        const highestExpense = topCategories.length > 0 ? topCategories[0] : null;

        res.status(200).json({
            success: true,
            message: 'Top categories retrieved successfully',
            period: period || 'lifetime',
            count: topCategories.length,
            totalExpenses,
            highestExpense: highestExpense ? {
                category: highestExpense.category,
                percentage: highestExpense.percentage,
                amount: highestExpense.totalAmount
            } : null,
            data: topCategories
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching top categories',
            error: error.message
        });
    }
};

// Category-wise expense summary by period (weekly/monthly/yearly/lifetime)
const getCategorySummaryByPeriod = async (req, res) => {
    try {
        const { period = 'monthly' } = req.query;
        const dateFilter = buildDateFilter(period);

        // Get all active categories
        const categories = await Category.find({ isActive: true }).sort({ name: 1 });

        // Aggregate expenses grouped by category
        const pipeline = [
            { $match: dateFilter },
            {
                $group: {
                    _id: '$category',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 },
                    avgAmount: { $avg: '$amount' },
                    maxAmount: { $max: '$amount' },
                    minAmount: { $min: '$amount' },
                    lastExpenseDate: { $max: '$date' }
                }
            },
            { $sort: { totalAmount: -1 } }
        ];

        const expenseData = await Expense.aggregate(pipeline);
        const grandTotal = expenseData.reduce((sum, cat) => sum + cat.totalAmount, 0);

        // Map category names to expense data with budget info
        const summary = categories.map(cat => {
            const expense = expenseData.find(e => e._id === cat.name) || {
                totalAmount: 0, count: 0, avgAmount: 0, maxAmount: 0, minAmount: 0, lastExpenseDate: null
            };
            const budgetUsed = cat.budgetLimit > 0 
                ? Math.round((expense.totalAmount / cat.budgetLimit) * 100) 
                : null;

            return {
                categoryId: cat._id,
                name: cat.name,
                type: cat.type,
                icon: cat.icon,
                color: cat.color,
                totalAmount: expense.totalAmount,
                transactionCount: expense.count,
                avgAmount: Math.round(expense.avgAmount || 0),
                maxAmount: expense.maxAmount || 0,
                minAmount: expense.minAmount || 0,
                lastExpenseDate: expense.lastExpenseDate,
                percentage: grandTotal > 0 
                    ? Math.round((expense.totalAmount / grandTotal) * 100) 
                    : 0,
                budgetLimit: cat.budgetLimit,
                budgetUsedPercent: budgetUsed,
                budgetStatus: budgetUsed === null ? 'no_budget' 
                    : budgetUsed > 100 ? 'exceeded' 
                    : budgetUsed > 80 ? 'warning' 
                    : 'ok'
            };
        });

        res.status(200).json({
            success: true,
            message: `Category summary for ${period} period`,
            period,
            grandTotal,
            count: summary.length,
            data: summary
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching category summary',
            error: error.message
        });
    }
};

// Get stats for a single category by period
const getCategoryStats = async (req, res) => {
    try {
        const { id } = req.params;
        const { period = 'monthly' } = req.query;

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Get stats for all periods
        const periods = ['weekly', 'monthly', 'yearly', 'lifetime'];
        const stats = {};

        for (const p of periods) {
            const dateFilter = buildDateFilter(p);
            const matchFilter = { ...dateFilter, category: category.name };

            const result = await Expense.aggregate([
                { $match: matchFilter },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 },
                        avgAmount: { $avg: '$amount' },
                        maxAmount: { $max: '$amount' },
                        minAmount: { $min: '$amount' },
                        lastDate: { $max: '$date' },
                        firstDate: { $min: '$date' }
                    }
                }
            ]);

            const data = result[0] || {
                totalAmount: 0, count: 0, avgAmount: 0, 
                maxAmount: 0, minAmount: 0, lastDate: null, firstDate: null
            };

            stats[p] = {
                totalAmount: data.totalAmount,
                transactionCount: data.count,
                avgAmount: Math.round(data.avgAmount || 0),
                maxAmount: data.maxAmount || 0,
                minAmount: data.minAmount || 0,
                dateRange: {
                    from: data.firstDate,
                    to: data.lastDate
                }
            };
        }

        // Budget analysis
        const budgetAnalysis = category.budgetLimit > 0 ? {
            budgetLimit: category.budgetLimit,
            monthlySpent: stats.monthly.totalAmount,
            remaining: category.budgetLimit - stats.monthly.totalAmount,
            usedPercent: Math.round((stats.monthly.totalAmount / category.budgetLimit) * 100),
            status: stats.monthly.totalAmount > category.budgetLimit ? 'exceeded' 
                : stats.monthly.totalAmount > category.budgetLimit * 0.8 ? 'warning' 
                : 'ok'
        } : null;

        res.status(200).json({
            success: true,
            message: `Stats for category: ${category.name}`,
            category: {
                _id: category._id,
                name: category.name,
                type: category.type,
                icon: category.icon,
                color: category.color,
                isActive: category.isActive
            },
            budgetAnalysis,
            stats
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching category stats',
            error: error.message
        });
    }
};

// Compare categories across periods
const compareCategoriesByPeriod = async (req, res) => {
    try {
        const periods = ['weekly', 'monthly', 'yearly', 'lifetime'];
        const comparison = {};

        for (const period of periods) {
            const dateFilter = buildDateFilter(period);

            const result = await Expense.aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: '$category',
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { totalAmount: -1 } }
            ]);

            const total = result.reduce((sum, r) => sum + r.totalAmount, 0);

            comparison[period] = {
                totalExpense: total,
                categories: result.map(r => ({
                    category: r._id || 'Uncategorized',
                    totalAmount: r.totalAmount,
                    count: r.count,
                    percentage: total > 0 ? Math.round((r.totalAmount / total) * 100) : 0
                }))
            };
        }

        res.status(200).json({
            success: true,
            message: 'Category comparison across all periods',
            data: comparison
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error comparing categories',
            error: error.message
        });
    }
};

// Search categories by name
const searchCategories = async (req, res) => {
    try {
        const { q, type } = req.query;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Search query (q) is required'
            });
        }

        const filter = {
            name: { $regex: q, $options: 'i' },
            isActive: true
        };
        if (type) filter.type = type;

        const categories = await Category.find(filter).sort({ name: 1 });

        res.status(200).json({
            success: true,
            message: `Search results for "${q}"`,
            count: categories.length,
            data: categories
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching categories',
            error: error.message
        });
    }
};

// Bulk create categories
const bulkCreateCategories = async (req, res) => {
    try {
        const { categories } = req.body;

        if (!categories || !Array.isArray(categories) || categories.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of categories'
            });
        }

        const results = { created: [], skipped: [], errors: [] };

        for (const cat of categories) {
            try {
                if (!cat.name || !cat.type) {
                    results.errors.push({ name: cat.name, reason: 'name and type required' });
                    continue;
                }
                const exists = await Category.findOne({ name: cat.name });
                if (exists) {
                    results.skipped.push({ name: cat.name, reason: 'already exists' });
                    continue;
                }
                const newCat = new Category({
                    name: cat.name,
                    description: cat.description || '',
                    type: cat.type,
                    icon: cat.icon || '📁',
                    color: cat.color || '#6366f1',
                    budgetLimit: cat.budgetLimit || 0
                });
                const saved = await newCat.save();
                results.created.push(saved);
            } catch (err) {
                results.errors.push({ name: cat.name, reason: err.message });
            }
        }

        res.status(201).json({
            success: true,
            message: `Bulk create: ${results.created.length} created, ${results.skipped.length} skipped, ${results.errors.length} errors`,
            data: results
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error in bulk create',
            error: error.message
        });
    }
};

// Toggle category active/inactive
const toggleCategoryStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        category.isActive = !category.isActive;
        await category.save();

        res.status(200).json({
            success: true,
            message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
            data: category
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error toggling category status',
            error: error.message
        });
    }
};

module.exports = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    getTopCategories,
    getCategorySummaryByPeriod,
    getCategoryStats,
    compareCategoriesByPeriod,
    searchCategories,
    bulkCreateCategories,
    toggleCategoryStatus
};
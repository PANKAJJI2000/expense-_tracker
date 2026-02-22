const Category = require('../models/Category');
const Expense = require('../models/Expense');

// Create a new category
const createCategory = async (req, res) => {
    try {
        const { name, description, type } = req.body;

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
            type
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
        const { name, description, type } = req.body;

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

        // Update category
        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { name, description, type },
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

        // Build date filter based on period
        let dateFilter = {};
        const now = new Date();
        
        if (period === 'weekly') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            dateFilter = { date: { $gte: weekAgo } };
        } else if (period === 'monthly') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFilter = { date: { $gte: startOfMonth } };
        } else if (period === 'yearly') {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            dateFilter = { date: { $gte: startOfYear } };
        }
        // 'lifetime' or no period = no date filter

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

module.exports = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    getTopCategories
};
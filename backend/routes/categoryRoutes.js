const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Top categories (must be before /:id to avoid conflict)
router.get('/top', categoryController.getTopCategories);

// Category summary by period (weekly/monthly/yearly/lifetime)
router.get('/summary', categoryController.getCategorySummaryByPeriod);

// Compare categories across all periods
router.get('/compare', categoryController.compareCategoriesByPeriod);

// Search categories by name
router.get('/search', categoryController.searchCategories);

// Bulk create categories
router.post('/bulk', categoryController.bulkCreateCategories);

// Create category
router.post('/', categoryController.createCategory);

// Get all categories
router.get('/', categoryController.getAllCategories);

// Get single category
router.get('/:id', categoryController.getCategoryById);

// Get stats for a single category (all periods)
router.get('/:id/stats', categoryController.getCategoryStats);

// Toggle category active/inactive
router.patch('/:id/toggle', categoryController.toggleCategoryStatus);

// Update category
router.put('/:id', categoryController.updateCategory);

// Delete category
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
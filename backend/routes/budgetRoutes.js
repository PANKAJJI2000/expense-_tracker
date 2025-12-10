const express = require("express");
const router = express.Router();
const {
  createBudget,
  getBudget,
  getCurrentBudget,
  updateCategorySpent,
  deleteBudget,
} = require("../controllers/budgetController");
const authMiddleware = require("../middleware/authMiddleware");

// All routes require authentication
router.use(authMiddleware);

// POST /api/budgets - Create or update budget
router.post("/", createBudget);

// GET /api/budgets - Get all budgets or specific month/year
router.get("/", getBudget);

// GET /api/budgets/current - Get current month budget
router.get("/current", getCurrentBudget);

// PUT /api/budgets/:id/category/:categoryId - Update category spent
router.put("/:id/category/:categoryId", updateCategorySpent);

// DELETE /api/budgets/:id - Delete budget
router.delete("/:id", deleteBudget);

module.exports = router;

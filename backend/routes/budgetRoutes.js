const express = require("express");
const router = express.Router();
const {
  createBudget,
  getBudget,
  getCurrentBudget,
  updateCategorySpent,
  deleteBudget,
  getAllBudgetsAdmin,
  updateBudgetAdmin,
  deleteBudgetAdmin,
} = require("../controllers/budgetController");

// Optional auth middleware - make it optional for some routes
let authMiddleware;
try {
  authMiddleware = require("../middleware/authMiddleware");
} catch (error) {
  console.warn("Auth middleware not found, using passthrough");
  authMiddleware = (req, res, next) => next();
}

// Public/Admin routes (no strict auth required)
router.get("/all", getAllBudgetsAdmin);

// User routes (with optional auth)
router.post("/", authMiddleware, createBudget);
router.get("/", getBudget); // Made public for admin access
router.get("/current", authMiddleware, getCurrentBudget);
router.put("/:id/category/:categoryId", authMiddleware, updateCategorySpent);
router.delete("/:id", authMiddleware, deleteBudget);

// Admin routes
router.put("/:id/admin", updateBudgetAdmin);
router.delete("/:id/admin", deleteBudgetAdmin);

module.exports = router;

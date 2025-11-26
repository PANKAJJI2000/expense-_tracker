const express = require('express');
const router = express.Router();
const manageExpenseController = require('../controllers/manageExpenseController');
const authMiddleware = require('../middleware/authMiddleware');

// Routes - no file upload middleware needed since it's optional
router.post('/', authMiddleware, manageExpenseController.createRequest);
router.get('/', authMiddleware, manageExpenseController.getAllRequests);
router.get('/:id', authMiddleware, manageExpenseController.getRequestById);
router.put('/:id/status', authMiddleware, manageExpenseController.updateStatus);
router.delete('/:id', authMiddleware, manageExpenseController.deleteRequest);

module.exports = router;

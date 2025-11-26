const express = require('express');
const router = express.Router();
const incomeTaxHelpController = require('../controllers/incomeTaxHelpController');
const authMiddleware = require('../middleware/authMiddleware');

// Routes - no file upload middleware needed since it's optional
router.post('/', authMiddleware, incomeTaxHelpController.createRequest);
router.get('/', authMiddleware, incomeTaxHelpController.getAllRequests);
router.get('/:id', authMiddleware, incomeTaxHelpController.getRequestById);
router.put('/:id/status', authMiddleware, incomeTaxHelpController.updateStatus);
router.delete('/:id', authMiddleware, incomeTaxHelpController.deleteRequest);

module.exports = router;
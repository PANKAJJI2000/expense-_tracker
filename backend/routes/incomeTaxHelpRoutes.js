const express = require('express');
const router = express.Router();
const IncomeTaxHelp = require('../models/IncomeTaxHelp');
const { uploadIncomeStatement } = require('../config/multerConfig');

// Submit Income Tax Help form
router.post('/submit', uploadIncomeStatement.single('incomeStatement'), async (req, res) => {
  try {
    const { fullName, annualIncome } = req.body;

    if (!fullName || !annualIncome) {
      return res.status(400).json({ error: 'Full name and annual income are required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Income statement file is required' });
    }

    const incomeTaxHelp = new IncomeTaxHelp({
      fullName,
      annualIncome: parseFloat(annualIncome),
      incomeStatement: req.file.path,
      userId: req.session?.user?.id || null
    });

    await incomeTaxHelp.save();

    res.status(201).json({
      message: 'Income tax help form submitted successfully',
      data: incomeTaxHelp
    });
  } catch (error) {
    console.error('Error submitting income tax help form:', error);
    res.status(500).json({ error: 'Failed to submit form', details: error.message });
  }
});

// Get all submissions (for admin)
router.get('/all', async (req, res) => {
  try {
    const submissions = await IncomeTaxHelp.find()
      .populate('userId', 'email username')
      .sort({ submittedAt: -1 });

    res.json({
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    console.error('Error fetching income tax help submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Update submission status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!['pending', 'in-progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = await IncomeTaxHelp.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json({ message: 'Status updated successfully', data: updated });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Delete submission
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await IncomeTaxHelp.findByIdAndDelete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});

module.exports = router;

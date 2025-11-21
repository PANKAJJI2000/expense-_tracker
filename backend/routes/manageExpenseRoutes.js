const express = require('express');
const router = express.Router();
const ManageExpense = require('../models/ManageExpense');
const { uploadExpenseProof } = require('../config/multerConfig');

// Submit Manage Expense form
router.post('/', uploadExpenseProof.single('expenseProof'), async (req, res) => {
  try {

    // console.log('Received manage expense submission:', req.body, req.file);

    const { fullName, annualExpense } = req.body;

    if (!fullName || !annualExpense) {
      return res.status(400).json({ error: 'Full name and annual expense are required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Expense proof file is required' });
    }

    const manageExpense = new ManageExpense({
      fullName,
      annualExpense: parseFloat(annualExpense),
      expenseProof: req.file.path,
      userId: req.session?.user?.id || null
    });

    await manageExpense.save();

    res.status(201).json({
      message: 'Manage expense form submitted successfully',
      data: manageExpense
    });
  } catch (error) {
    console.error('Error submitting manage expense form:', error);
    res.status(500).json({ error: 'Failed to submit form', details: error.message });
  }
});

// Get all submissions (for admin)
router.get('/', async (req, res) => {
  try {
    const submissions = await ManageExpense.find()
      .populate('userId', 'email username')
      .sort({ submittedAt: -1 });

    res.json({
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    console.error('Error fetching manage expense submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Update submission status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = await ManageExpense.findByIdAndUpdate(
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
    const deleted = await ManageExpense.findByIdAndDelete(req.params.id);
    
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

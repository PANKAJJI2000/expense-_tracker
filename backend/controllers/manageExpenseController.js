const ManageExpense = require('../models/ManageExpense');

const manageExpenseController = {
  async createRequest(req, res) {
    try {
      const { fullName, email, phone, annualExpense, expenseProof } = req.body;
      
      // Validate required fields (removed expenseProof from validation)
      if (!fullName || !email || !phone || !annualExpense) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          message: 'Please provide fullName, email, phone, and annualExpense'
        });
      }
      
      const newRequest = new ManageExpense({
        fullName,
        email,
        phone,
        annualExpense: parseFloat(annualExpense),
        expenseProof: expenseProof || null, // Optional field
        userId: req.user?._id || null
      });
      
      await newRequest.save();
      
      res.status(201).json({
        success: true,
        message: 'Expense management request submitted successfully',
        data: newRequest
      });
    } catch (error) {
      console.error('Manage expense creation error:', error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async getAllRequests(req, res) {
    try {
      const requests = await ManageExpense.find()
        .populate('userId', 'name email')
        .sort({ submittedAt: -1 });
      
      res.json({
        success: true,
        count: requests.length,
        data: requests
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async getRequestById(req, res) {
    try {
      const request = await ManageExpense.findById(req.params.id)
        .populate('userId', 'name email');
      
      if (!request) {
        return res.status(404).json({ error: 'Request not found' });
      }
      
      res.json({
        success: true,
        data: request
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      
      const request = await ManageExpense.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );
      
      if (!request) {
        return res.status(404).json({ error: 'Request not found' });
      }
      
      res.json({
        success: true,
        message: 'Status updated successfully',
        data: request
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async deleteRequest(req, res) {
    try {
      const request = await ManageExpense.findByIdAndDelete(req.params.id);
      
      if (!request) {
        return res.status(404).json({ error: 'Request not found' });
      }
      
      res.json({
        success: true,
        message: 'Request deleted successfully'
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  }
};

module.exports = manageExpenseController;

const IncomeTaxHelp = require('../models/IncomeTaxHelp');

const incomeTaxHelpController = {
  async createRequest(req, res) {
    try {
      console.log('Request body:', req.body);
      console.log('Request file:', req.file);
      
      const { fullName, email, phone, annualIncome } = req.body;
      
      // Validate required fields
      if (!fullName || !email || !phone || !annualIncome) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          message: 'Please provide fullName, email, phone, and annualIncome'
        });
      }
      
      const newRequest = new IncomeTaxHelp({
        fullName,
        email,
        phone,
        annualIncome: parseFloat(annualIncome),
        incomeStatement: req.file ? req.file.path : null, // Handle file upload
        userId: req.user?._id || null
      });
      
      await newRequest.save();
      
      res.status(201).json({
        success: true,
        message: 'Income tax help request submitted successfully',
        data: newRequest
      });
    } catch (error) {
      console.error('Income tax help creation error:', error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  },

  async getAllRequests(req, res) {
    try {
      const requests = await IncomeTaxHelp.find()
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
      const request = await IncomeTaxHelp.findById(req.params.id)
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
      
      if (!['pending', 'in-progress', 'completed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      
      const request = await IncomeTaxHelp.findByIdAndUpdate(
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
      const request = await IncomeTaxHelp.findByIdAndDelete(req.params.id);
      
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

module.exports = incomeTaxHelpController;

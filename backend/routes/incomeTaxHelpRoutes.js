const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const IncomeTaxHelp = require('../models/IncomeTaxHelp');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/income-statements/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images and PDFs only!');
    }
  }
});

// POST - Submit income tax help request
router.post('/', upload.single('incomeStatement'), async (req, res) => {
  try {
    const { fullName, annualIncome, userId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Income statement file is required' });
    }

    const incomeTaxHelp = new IncomeTaxHelp({
      fullName,
      annualIncome,
      incomeStatement: req.file.path,
      userId: userId || null
    });

    await incomeTaxHelp.save();
    res.status(201).json({ message: 'Request submitted successfully', data: incomeTaxHelp });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Retrieve all requests
router.get('/', async (req, res) => {
  try {
    const requests = await IncomeTaxHelp.find().populate('userId', 'name email');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Retrieve single request
router.get('/:id', async (req, res) => {
  try {
    const request = await IncomeTaxHelp.findById(req.params.id).populate('userId', 'name email');
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH - Update request status
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const request = await IncomeTaxHelp.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    res.json({ message: 'Status updated', data: request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
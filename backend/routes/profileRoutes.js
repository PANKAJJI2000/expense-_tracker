const express = require('express');
const profileController = require('../controllers/profileController');
const auth = require('../middleware/auth');
const Profile = require('../models/Profile');
const mongoose = require('mongoose');

const router = express.Router();

// @desc    Create new profile (PUBLIC - no auth required)
// @route   POST /api/profile
// @access  Public
router.post('/', async (req, res) => {
  try {
    
    const { name, email, phone, profilePic, referredBy } = req.body;

    // Validate required fields ONLY for CREATE
    if (!name || !email || !phone) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, email, and phone number are required' 
      });
    }

    // Check if email already exists
    const existingProfile = await Profile.findOne({ email: email.toLowerCase() });
    if (existingProfile) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email already registered' 
      });
    }

    const profileData = {
      name,
      email,
      phone
    };

    if (profilePic) profileData.profilePic = profilePic;
    if (referredBy) profileData.referredBy = referredBy;

    const profile = await Profile.create(profileData);

    res.status(201).json({ 
      success: true, 
      data: profile,
      message: 'Profile created successfully'
    });
  } catch (error) {
    console.error('Profile creation error:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// @desc    Get profile by email (PUBLIC)
// @route   GET /api/profile/email/:email
// @access  Public
router.get('/email/:email', async (req, res) => {
  try {
    const profile = await Profile.findOne({ email: req.params.email.toLowerCase() });
    
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        error: 'Profile not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: profile 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Protect routes below with authentication
router.use(auth);

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
router.get('/', profileController.getProfile);

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
router.put('/', profileController.updateProfile);

// @desc    Change user password
// @route   PUT /api/profile/change-password
// @access  Private
router.put('/change-password', profileController.changePassword);

// @desc    Update profile by ID
// @route   PUT /api/profile/:id
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid profile ID format' 
      });
    }

    const { name, email, phone, profilePic } = req.body;

    // Build update object with only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (profilePic !== undefined) updateData.profilePic = profilePic;

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No fields provided for update' 
      });
    }

    // Check email uniqueness if email is being updated
    if (email) {
      const existingProfile = await Profile.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: req.params.id }
      });
      if (existingProfile) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email already in use by another profile' 
        });
      }
    }

    const profile = await Profile.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true, 
        runValidators: false // Disable validation for partial updates
      }
    );

    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        error: 'Profile not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: profile,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// @desc    Delete profile
// @route   DELETE /api/profile/:id
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid profile ID format' 
      });
    }

    const profile = await Profile.findByIdAndDelete(req.params.id);

    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        error: 'Profile not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: {},
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;

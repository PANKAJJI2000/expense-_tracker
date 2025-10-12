const User = require('../models/User');
const Profile = require('../models/Profile');
const bcrypt = require('bcryptjs');

const profileController = {
  // Get user profile
  async getProfile(req, res) {
    try {
      // Try to get profile from Profile model first
      let profile = await Profile.findOne({ userId: req.user._id });
      
      if (!profile) {
        // If no profile exists, create one from User data
        profile = new Profile({
          userId: req.user._id,
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone || '', // Default empty if not exists
        });
        await profile.save();
      }
      
      res.json({ success: true, data: profile });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Server error', 
        details: error.message 
      });
    }
  },

  // Update user profile
  async updateProfile(req, res) {
    try {
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
          userId: { $ne: req.user._id }
        });
        if (existingProfile) {
          return res.status(400).json({ 
            success: false, 
            error: 'Email already in use by another profile' 
          });
        }
      }

      // Update or create profile
      let profile = await Profile.findOneAndUpdate(
        { userId: req.user._id },
        updateData,
        { 
          new: true, 
          upsert: true,
          runValidators: false // Disable validation for partial updates
        }
      );

      // Also update User model if email or name is changed
      if (email || name) {
        const userUpdate = {};
        if (email) userUpdate.email = email;
        if (name) userUpdate.name = name;
        
        await User.findByIdAndUpdate(req.user._id, userUpdate);
      }
      
      res.json({ 
        success: true, 
        data: profile,
        message: 'Profile updated successfully' 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Server error', 
        details: error.message 
      });
    }
  },

  // Change password
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          success: false, 
          error: 'Current and new passwords are required' 
        });
      }
      
      const user = await User.findById(req.user._id);
      const isValidPassword = await user.comparePassword(currentPassword);
      
      if (!isValidPassword) {
        return res.status(400).json({ 
          success: false, 
          error: 'Current password is incorrect' 
        });
      }
      
      user.password = newPassword;
      await user.save();
      
      res.json({ 
        success: true, 
        message: 'Password updated successfully' 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Server error', 
        details: error.message 
      });
    }
  }
};

module.exports = profileController;

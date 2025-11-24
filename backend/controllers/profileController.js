const Profile = require("../models/Profile");
const User = require("../models/User");
const mongoose = require("mongoose");

// @desc    Create new profile
// @route   POST /api/profiles
// @access  Private
exports.createProfile = async (req, res) => {
  try {
    const { userId, name, email, phone, profilePic, referredBy } = req.body;

    // Check if profile already exists for this user
    const existingProfile = await Profile.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: "Profile already exists for this user",
      });
    }

    // Check if email already exists
    const emailExists = await Profile.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      });
    }

    // Create profile
    const profile = await Profile.create({
      userId,
      name,
      email,
      phone,
      profilePic,
      referredBy,
    });

    res.status(201).json({
      success: true,
      message: "Profile created successfully",
      data: profile,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all profiles
// @route   GET /api/profiles
// @access  Private/Admin
exports.getAllProfiles = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const profiles = await Profile.find(query)
      .populate("userId", "username email")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Profile.countDocuments(query);

    res.status(200).json({
      success: true,
      count: profiles.length,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: profiles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single profile by ID
// @route   GET /api/profiles/:id
// @access  Private
exports.getProfileById = async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id).populate(
      "userId",
      "username email"
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get profile by user ID
// @route   GET /api/profiles/user/:userId
// @access  Private
exports.getProfileByUserId = async (req, res) => {
  try {
    const profile = await Profile.findOne({
      userId: req.params.userId,
    }).populate("userId", "username email");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found for this user",
      });
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update profile by user ID
// @route   PUT /api/profiles/user/:userId
// @access  Private
exports.updateProfileByUserId = async (req, res) => {
  try {
    const { name, email, phone, profilePic } = req.body;

    console.log("Update User Request Body:", req.body);
    console.log("User ID:", req.params.userId);
    
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }
    
    // Check if user exists
    const existingUser = await User.findById(req.params.userId);
    
    if (!existingUser) {
      console.log("User not found with ID:", req.params.userId);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("Existing User:", existingUser);

    // Check if email is being changed and if it's already in use
    if (email && email !== existingUser.email) {
      const emailExists = await User.findOne({
        email: email,
        _id: { $ne: req.params.userId },
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already in use by another user",
        });
      }
    }

    // Update User model only
    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { name, email },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Failed to update user",
      });
    }

    console.log("Updated User:", updatedUser);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update profile
// @route   PUT /api/profiles/:id
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, profilePic } = req.body;

    console.log("Update User Request Body:", req.body);
    console.log("Profile ID:", req.params.id);
    
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid profile ID format",
      });
    }
    
    // Find the profile to get userId
    const existingProfile = await Profile.findById(req.params.id);
    
    if (!existingProfile) {
      console.log("Profile not found with ID:", req.params.id);
      const allProfiles = await Profile.find({}).select('_id name email userId');
      console.log("Available profiles:", allProfiles);
      return res.status(404).json({
        success: false,
        message: `Profile not found with ID: ${req.params.id}. Please verify the profile ID.`,
      });
    }

    console.log("Existing Profile:", existingProfile);

    // Get the user
    const existingUser = await User.findById(existingProfile.userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found for this profile",
      });
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== existingUser.email) {
      const emailExists = await User.findOne({
        email: email,
        _id: { $ne: existingProfile.userId },
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already in use by another user",
        });
      }
    }

    // Update User model only
    const updatedUser = await User.findByIdAndUpdate(
      existingProfile.userId,
      { name, email },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Failed to update user",
      });
    }

    console.log("Updated User:", updatedUser);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete profile
// @route   DELETE /api/profiles/:id
// @access  Private/Admin
exports.deleteProfile = async (req, res) => {
  try {
    const profile = await Profile.findByIdAndDelete(req.params.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile deleted successfully",
      data: profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get profile by referral code
// @route   GET /api/profiles/referral/:code
// @access  Public
exports.getProfileByReferralCode = async (req, res) => {
  try {
    const profile = await Profile.findOne({
      referralCode: req.params.code.toUpperCase(),
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Invalid referral code",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        name: profile.name,
        referralCode: profile.referralCode,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
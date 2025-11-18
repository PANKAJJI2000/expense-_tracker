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

// @desc    Update profile
// @route   PUT /api/profiles/:id
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, oldEmail,email, phone, profilePic } = req.body;

    console.log("    Update Profile Request Body:", req.body);
    // Check if email is being changed and if it's already in use
    if (email) {
      const emailExists = await Profile.findOne({
        email,
        _id: { $ne: req.params.id },
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }
    }

    const profile = await Profile.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, profilePic },
      {
        new: true,
        runValidators: true,
      }
    );

    //
    // const user = await User.findOneAndUpdate(
    //   { email: email },
    //  { $set: { name:name, email: email } },
    //   {
    //     new: true,
    //     runValidators: true
    //   }
    // );
    const user = await User.findByIdAndUpdate(
      req.params.id,
     { name:name, email: email },
      {
        new: true,
        runValidators: true
      }
    );

    // console.log("Updated User:", user);
    if (!profile && !user) {
      return res.status(404).json({
        success: false,
        message: "user Profile not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "user Profile updated successfully",
      data: profile,
    });
  } catch (error) {
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

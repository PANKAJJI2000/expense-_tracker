const Profile = require("../models/Profile");
const User = require("../models/User");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Helper function to convert image to base64 with data URI
const convertToBase64DataURI = (imagePath) => {
  try {
    if (!imagePath) return null;

    // If already a data URI, return as is
    if (typeof imagePath === "string" && imagePath.startsWith("data:image")) {
      return imagePath;
    }

    // If it's a file path, read and convert
    if (typeof imagePath === "string" && fs.existsSync(imagePath)) {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64String = imageBuffer.toString("base64");
      // Detect image type from extension
      const ext = path.extname(imagePath).toLowerCase();
      const mimeType =
        ext === ".png"
          ? "image/png"
          : ext === ".jpg" || ext === ".jpeg"
          ? "image/jpeg"
          : ext === ".webp"
          ? "image/webp"
          : "image/jpeg";
      return `data:${mimeType};base64,${base64String}`;
    }

    // If it's a raw base64 string, add prefix
    if (
      typeof imagePath === "string" &&
      !imagePath.includes("/") &&
      !imagePath.includes("\\")
    ) {
      return `data:image/jpeg;base64,${imagePath}`;
    }

    return imagePath;
  } catch (error) {
    console.error("Error converting image to base64:", error);
    return null;
  }
};

// Helper function to format profile response
const formatProfilePicture = (profilePicture) => {
  console.log("=== formatProfilePicture called ===");
  console.log("Input type:", typeof profilePicture);
  console.log(
    "Input value (first 50 chars):",
    profilePicture ? profilePicture.substring(0, 50) : null
  );

  if (!profilePicture) return null;

  // If already has data URI prefix, return as is
  if (typeof profilePicture === "string" && profilePicture.startsWith("data:image")) {
    console.log("Already has data URI prefix");
    return profilePicture;
  }

  // If it's a file path (contains slashes or backslashes)
  if (
    typeof profilePicture === "string" &&
    (profilePicture.includes("/") || profilePicture.includes("\\"))
  ) {
    console.log("Detected as file path");
    const imageBuffer = fs.readFileSync(profilePicture);
    const base64String = imageBuffer.toString("base64");
    // Detect image type from extension
    const ext = path.extname(profilePicture).toLowerCase();
    let mimeType =
      ext === ".png"
        ? "image/png"
        : ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : ext === ".webp"
        ? "image/webp"
        : "image/jpeg";
    return `data:${mimeType};base64,${base64String}`;
  }

  // If it's a raw base64 string (no path, no prefix) - THIS IS YOUR CASE
  if (typeof profilePicture === "string") {
    console.log("Detected as raw base64 string");
    let mimeType = "image/jpeg"; // default
    if (profilePicture.startsWith("iVBOR")) {
      mimeType = "image/png";
      console.log("Detected PNG format");
    } else if (profilePicture.startsWith("UklGR")) {
      mimeType = "image/webp"; // WEBP format detected!
      console.log("Detected WEBP format");
    } else if (profilePicture.startsWith("/9j/")) {
      mimeType = "image/jpeg";
      console.log("Detected JPEG format");
    }

    const result = `data:${mimeType};base64,${profilePicture}`;
    console.log("Result (first 100 chars):", result.substring(0, 100));
    return result;
  }

  console.log("No format detected, returning as is");
  return profilePicture;
};

const formatProfileResponse = (profile) => {
  console.log("=== formatProfileResponse called ===");
  if (!profile) return null;

  // Convert to plain object
  const formattedProfile = profile.toObject ? profile.toObject() : { ...profile };
  console.log("Profile has profilePicture:", !!formattedProfile.profilePicture);

  // Format the profile picture
  if (formattedProfile.profilePicture) {
    const originalLength = formattedProfile.profilePicture.length;
    formattedProfile.profilePicture = formatProfilePicture(formattedProfile.profilePicture);
    const newLength = formattedProfile.profilePicture ? formattedProfile.profilePicture.length : 0;
    console.log(`ProfilePicture length: ${originalLength} -> ${newLength}`);
  }

  return formattedProfile;
};

// Multer config for profile images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // adjust folder as needed
    cb(null, path.join(__dirname, "..", "uploads", "profiles"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `profile-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  if (/^image\//.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

// Use this in your routes: upload.single("profilePicture")
exports.uploadProfilePic = upload;

// @desc    Create new profile
// @route   POST /api/profiles
// @access  Private
exports.createProfile = async (req, res) => {
  try {
    const { userId, name, email, phone, gender, currency, referredBy } = req.body;
    const profilePicture = req.file
      ? req.file.path.replace(/\\/g, "/")
      : req.body.profilePicture;

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
      profilePicture,
      gender,
      currency,
      referredBy,
    });

    res.status(201).json({
      success: true,
      message: "Profile created successfully",
      data: formatProfileResponse(profile),
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

    // Format all profiles with base64 data URI
    const formattedProfiles = profiles.map(formatProfileResponse);

    res.status(200).json({
      success: true,
      count: profiles.length,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: formattedProfiles,
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
      data: formatProfileResponse(profile),
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
    console.log("=== getProfileByUserId called ===");
    console.log("User ID:", req.params.userId);

    let profile = await Profile.findOne({
      userId: req.params.userId,
    }).populate("userId", "username email");

    if (!profile) {
      // Auto-create a default profile from User data if none exists
      console.log("Profile not found, attempting to auto-create from User data...");
      const user = await User.findById(req.params.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found with this ID",
        });
      }

      profile = await Profile.create({
        userId: user._id,
        name: user.name || "User",
        email: user.email,
        phone: user.phone || "0000000000",
        gender: user.gender || "other",
        currency: user.currency || "INR",
        profilePicture: user.profilePicture || "",
      });

      // Update user with profile reference
      user.profile = profile._id;
      await user.save();

      // Re-fetch with populate
      profile = await Profile.findById(profile._id).populate("userId", "username email");
      console.log("Auto-created profile for user:", user.email);
    }

    console.log("Profile found, formatting response...");
    const formattedData = formatProfileResponse(profile);
    console.log(
      "Formatted data profilePicture (first 100 chars):",
      formattedData.profilePicture ? formattedData.profilePicture.substring(0, 100) : null
    );

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error in getProfileByUserId:", error);
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
    const { name, email, phone, gender, currency } = req.body;
    const profilePicture = req.file
      ? req.file.path.replace(/\\/g, "/")
      : req.body.profilePicture;

    console.log("Update User Request Body:", req.body);
    console.log("User ID:", req.params.userId);
    console.log("Uploaded file (userId):", req.file);
    console.log("Computed profilePicture (userId):", profilePicture);

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

    // Update User model
    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(gender && { gender }),
        ...(currency && { currency }),
        ...(profilePicture && { profilePicture }),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Failed to update user",
      });
    }

    // Upsert Profile
    const updatedProfile = await Profile.findOneAndUpdate(
      { userId: req.params.userId },
      {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(gender && { gender }),
        ...(currency && { currency }),
        ...(profilePicture && { profilePicture }),
      },
      {
        new: true,
        runValidators: true,
        upsert: true,
      }
    );

    console.log("Updated User:", updatedUser);
    console.log("Updated Profile:", updatedProfile);

    res.status(200).json({
      success: true,
      message: "User and profile updated successfully",
      data: {
        user: updatedUser,
        profile: updatedProfile,
      },
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
    const { name, email, phone, gender, currency } = req.body;
    const profilePicture = req.file
      ? req.file.path.replace(/\\/g, "/")
      : req.body.profilePicture;

    console.log("Update User Request Body:", req.body);
    console.log("Profile ID:", req.params.id);
    console.log("Uploaded file (profileId):", req.file);
    console.log("Computed profilePicture (profileId):", profilePicture);

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
      const allProfiles = await Profile.find({}).select("_id name email userId");
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

    // Update User model
    const updatedUser = await User.findByIdAndUpdate(
      existingProfile.userId,
      {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(gender && { gender }),
        ...(currency && { currency }),
        ...(profilePicture && { profilePicture }),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Failed to update user",
      });
    }

    // Update Profile
    const updatedProfile = await Profile.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(gender && { gender }),
        ...(currency && { currency }),
        ...(profilePicture && { profilePicture }),
      },
      { new: true, runValidators: true }
    );

    console.log("Updated User:", updatedUser);
    console.log("Updated Profile:", updatedProfile);

    res.status(200).json({
      success: true,
      message: "User and profile updated successfully",
      data: {
        user: updatedUser,
        profile: updatedProfile,
      },
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
      data: formatProfileResponse(profile),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete profile by user ID
// @route   DELETE /api/profiles/user/:userId
// @access  Private
exports.deleteProfileByUserId = async (req, res) => {
  try {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const profile = await Profile.findOneAndDelete({ userId: req.params.userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found for this user",
      });
    }

    // Also clear profile reference from User model
    await User.findByIdAndUpdate(req.params.userId, { profile: null });

    res.status(200).json({
      success: true,
      message: "Profile deleted successfully",
      data: formatProfileResponse(profile),
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

// @desc    Get profile by user email
// @route   POST /api/profiles/by-email
// @access  Public or Private (depending on your route protection)
exports.getProfileByEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email }).select("_id email username");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email",
      });
    }

    // Find profile by userId
    const profile = await Profile.findOne({ userId: user._id }).populate(
      "userId",
      "username email"
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found for this email",
      });
    }

    return res.status(200).json({
      success: true,
      data: formatProfileResponse(profile),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
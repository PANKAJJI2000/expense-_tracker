const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Profile",
    // required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    trim: true,
    minlength: [3, "Username must be at least 3 characters"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false
  },
  phone: {
    type: String,
    default: null
  },
  gender: {
    type: String,
    enum: ["male", "female", "other", null],
    default: null
  },
  currency: {
    type: String,
    default: null
  },
  profilePicture: {
    type: String,
    default: null
  },
  authProvider: {
    type: String,
    enum: ["local", "google", "linkedin"],
    default: "local"
  },
  // googleId: {
  //   type: String,
  //   default: null
  // },
  // linkedinId: {
  //   type: String,
  //   default: null
  // },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpire: {
    type: Date,
    default: null
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ profile: 1 });

// Hash password before saving
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Auto-sync email changes to Profile after user update
userSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    try {
      const Profile = mongoose.model('Profile');
      
      // Find associated profile
      const profile = await Profile.findById(doc.profile);
      
      if (profile && profile.email !== doc.email) {
        profile.email = doc.email;
        await profile.save();
        console.log(`✅ Profile email synced with User: ${doc.email}`);
      }
    } catch (error) {
      console.error('Error syncing Profile with User:', error.message);
    }
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters"]
  },
  email: { 
    type: String, 
    required: [true, "Email is required"], 
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
  },
  phone: { 
    type: String,
    required: [true, "Phone number is required"],
    validate: {
      validator: function(v) {
        return /^[+]?[\d\s\-()]{10,15}$/.test(v);
      },
      message: "Please enter a valid phone number"
    }
  },
  profilePic: { 
    type: String, 
    default: "" 
  },
  referralCode: { 
    type: String, 
    unique: true,
    uppercase: true,
    sparse: true
  },
  referredBy: { 
    type: String,
    default: null
  }
  // ✅ NO userId field - Profile is the main user entity
}, { timestamps: true });

// Add indexes for better performance
profileSchema.index({ email: 1 });
profileSchema.index({ referralCode: 1 });

// Generate unique referral code before saving
profileSchema.pre('save', async function(next) {
  try {
    if (!this.referralCode) {
      let code;
      let isUnique = false;
      
      while (!isUnique) {
        code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const existingUser = await this.constructor.findOne({ referralCode: code });
        if (!existingUser) {
          isUnique = true;
        }
      }
      
      this.referralCode = code;
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Profile", profileSchema);

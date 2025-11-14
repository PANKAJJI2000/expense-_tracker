const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
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
}, { timestamps: true });

// Add indexes for better performance
profileSchema.index({ email: 1 });
profileSchema.index({ referralCode: 1 });
profileSchema.index({ userId: 1 }); // Add index for userId

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

// Auto-sync email changes to User after profile update
profileSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    try {
      const User = mongoose.model('User');
      
      // Find associated user
      const user = await User.findOne({ profile: doc._id });
      
      if (user && user.email !== doc.email) {
        user.email = doc.email;
        await user.save();
        console.log(`✅ User email synced with Profile: ${doc.email}`);
      }
    } catch (error) {
      console.error('Error syncing User with Profile:', error.message);
    }
  }
});

module.exports = mongoose.model("Profile", profileSchema);
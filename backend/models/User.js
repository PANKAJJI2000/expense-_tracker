const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.linkedinId && !this.googleId; // Password not required for social auth users
    },
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  // Social authentication fields
  linkedinId: {
    type: String,
    unique: true,
    sparse: true
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  profilePicture: {
    type: String
  },
  authProvider: {
    type: String,
    enum: ['local', 'linkedin', 'google'],
    default: 'local'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// LinkedIn signin static method
userSchema.statics.findOrCreateLinkedInUser = async function(linkedinProfile) {
  try {
    // Check if user already exists with LinkedIn ID
    let user = await this.findOne({ linkedinId: linkedinProfile.id });
    
    if (user) {
      return user;
    }
    
    // Check if user exists with same email
    user = await this.findOne({ email: linkedinProfile.email });
    
    if (user) {
      // Link LinkedIn account to existing user
      user.linkedinId = linkedinProfile.id;
      user.authProvider = 'linkedin';
      if (linkedinProfile.picture) {
        user.profilePicture = linkedinProfile.picture;
      }
      await user.save();
      return user;
    }
    
    // Create new user
    user = new this({
      email: linkedinProfile.email,
      name: linkedinProfile.name,
      linkedinId: linkedinProfile.id,
      profilePicture: linkedinProfile.picture,
      authProvider: 'linkedin'
    });
    
    await user.save();
    return user;
  } catch (error) {
    throw new Error('LinkedIn signin error: ' + error.message);
  }
};

// Google signin static method
userSchema.statics.findOrCreateGoogleUser = async function(googleProfile) {
  try {
    // Check if user already exists with Google ID
    let user = await this.findOne({ googleId: googleProfile.id });
    
    if (user) {
      return user;
    }
    
    // Check if user exists with same email
    user = await this.findOne({ email: googleProfile.email });
    
    if (user) {
      // Link Google account to existing user
      user.googleId = googleProfile.id;
      user.authProvider = 'google';
      if (googleProfile.picture) {
        user.profilePicture = googleProfile.picture;
      }
      await user.save();
      return user;
    }
    
    // Create new user
    user = new this({
      email: googleProfile.email,
      name: googleProfile.name,
      googleId: googleProfile.id,
      profilePicture: googleProfile.picture,
      authProvider: 'google'
    });
    
    await user.save();
    return user;
  } catch (error) {
    throw new Error('Google signin error: ' + error.message);
  }
};

module.exports = mongoose.model('User', userSchema);

// If you need to export linkedinSignin from this file, define it here or import it from another file
// Example placeholder function:
// const linkedinSignin = (req, res) => { /* implementation */ };
// module.exports.linkedinSignin = linkedinSignin;
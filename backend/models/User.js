const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return this.authProvider === 'local';
    },
    select: false
  },
  phone: {
    type: String,
    trim: true,
    default: null
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', null],
    default: null
  },
  currency: {
    type: String,
    trim: true,
    default: null
  },
  profilePicture: {
    type: String,
    default: null
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'linkedin'],
    default: 'local'
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  linkedinId: {
    type: String,
    unique: true,
    sparse: true
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Find or create Google user
userSchema.statics.findOrCreateGoogleUser = async function(profile) {
  let user = await this.findOne({ googleId: profile.id });
  
  if (!user) {
    user = await this.findOne({ email: profile.email });
    
    if (user) {
      user.googleId = profile.id;
      user.profilePicture = profile.picture || user.profilePicture;
      user.authProvider = 'google';
      await user.save();
    } else {
      user = await this.create({
        name: profile.name,
        email: profile.email,
        googleId: profile.id,
        profilePicture: profile.picture,
        authProvider: 'google'
      });
    }
  }
  
  return user;
};

// Find or create LinkedIn user
userSchema.statics.findOrCreateLinkedInUser = async function(profile) {
  let user = await this.findOne({ linkedinId: profile.id });
  
  if (!user) {
    user = await this.findOne({ email: profile.email });
    
    if (user) {
      user.linkedinId = profile.id;
      user.profilePicture = profile.picture || user.profilePicture;
      user.authProvider = 'linkedin';
      await user.save();
    } else {
      user = await this.create({
        name: profile.name,
        email: profile.email,
        linkedinId: profile.id,
        profilePicture: profile.picture,
        authProvider: 'linkedin'
      });
    }
  }
  
  return user;
};

module.exports = mongoose.model('User', userSchema);
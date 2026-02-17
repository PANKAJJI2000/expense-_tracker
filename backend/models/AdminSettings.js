const mongoose = require("mongoose");

const adminSettingsSchema = new mongoose.Schema(
  {
    // Reference to admin user
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    
    // Appearance Settings
    darkMode: {
      type: Boolean,
      default: false,
    },
    
    // Notification Settings
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    pushNotifications: {
      type: Boolean,
      default: false,
    },
    
    // Localization Settings
    language: {
      type: String,
      enum: ["en", "hi", "es", "fr", "de", "zh", "ja", "ar"],
      default: "en",
    },
    currency: {
      type: String,
      default: "INR",
    },
    dateFormat: {
      type: String,
      enum: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"],
      default: "DD/MM/YYYY",
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
    
    // Backup Settings
    autoBackup: {
      type: Boolean,
      default: true,
    },
    backupFrequency: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: "weekly",
    },
    lastBackupDate: {
      type: Date,
      default: null,
    },
    
    // Security Settings
    sessionTimeout: {
      type: Number,
      default: 30, // in minutes
      min: 5,
      max: 480,
    },
    twoFAEnabled: {
      type: Boolean,
      default: false,
    },
    twoFASecret: {
      type: String,
      select: false, // Don't return in queries by default
      default: null,
    },
    
    // Admin Profile (embedded for convenience)
    profile: {
      name: {
        type: String,
        default: "Admin User",
      },
      email: {
        type: String,
        default: "",
      },
      phone: {
        type: String,
        default: "",
      },
      avatar: {
        type: String,
        default: "",
      },
    },
    
    // Backup data storage
    backup: {
      data: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      createdAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
adminSettingsSchema.index({ adminId: 1 });

// Static method to get or create settings for an admin
adminSettingsSchema.statics.getOrCreate = async function (adminId, adminEmail = "") {
  let settings = await this.findOne({ adminId });
  
  if (!settings) {
    settings = await this.create({
      adminId,
      profile: {
        name: "Admin User",
        email: adminEmail,
        phone: "",
        avatar: "",
      },
    });
  }
  
  return settings;
};

// Method to create backup
adminSettingsSchema.methods.createBackup = function () {
  this.backup = {
    data: {
      darkMode: this.darkMode,
      emailNotifications: this.emailNotifications,
      pushNotifications: this.pushNotifications,
      language: this.language,
      currency: this.currency,
      dateFormat: this.dateFormat,
      autoBackup: this.autoBackup,
      sessionTimeout: this.sessionTimeout,
      twoFAEnabled: this.twoFAEnabled,
      profile: { ...this.profile.toObject() },
    },
    createdAt: new Date(),
  };
  this.lastBackupDate = new Date();
  return this.save();
};

// Method to restore backup
adminSettingsSchema.methods.restoreBackup = function () {
  if (!this.backup || !this.backup.data) {
    throw new Error("No backup found");
  }
  
  const backupData = this.backup.data;
  this.darkMode = backupData.darkMode;
  this.emailNotifications = backupData.emailNotifications;
  this.pushNotifications = backupData.pushNotifications;
  this.language = backupData.language;
  this.currency = backupData.currency;
  this.dateFormat = backupData.dateFormat;
  this.autoBackup = backupData.autoBackup;
  this.sessionTimeout = backupData.sessionTimeout;
  this.twoFAEnabled = backupData.twoFAEnabled;
  this.profile = backupData.profile;
  
  return this.save();
};

module.exports = mongoose.model("AdminSettings", adminSettingsSchema);

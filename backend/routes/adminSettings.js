const express = require('express')
const router = express.Router()
const AdminSettings = require('../models/AdminSettings')
const adminAuth = require('../middleware/adminAuth')

// @route   GET /api/admin/settings
// @desc    Get admin settings
// @access  Private (Admin only)
router.get('/settings', adminAuth, async (req, res) => {
  try {
    const settings = await AdminSettings.getOrCreate(req.admin.id, req.admin.email)
    
    res.json({ 
      data: {
        darkMode: settings.darkMode,
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        language: settings.language,
        currency: settings.currency,
        dateFormat: settings.dateFormat,
        autoBackup: settings.autoBackup,
        sessionTimeout: settings.sessionTimeout,
        twoFAEnabled: settings.twoFAEnabled,
      },
      lastBackupDate: settings.lastBackupDate 
    })
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// @route   PUT /api/admin/settings
// @desc    Update admin settings
// @access  Private (Admin only)
router.put('/settings', adminAuth, async (req, res) => {
  try {
    const settings = await AdminSettings.getOrCreate(req.admin.id, req.admin.email)
    
    // Update only provided fields
    const allowedFields = [
      'darkMode', 'emailNotifications', 'pushNotifications',
      'language', 'currency', 'dateFormat', 'autoBackup', 'sessionTimeout'
    ]
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field]
      }
    })
    
    await settings.save()
    
    res.json({ 
      message: 'Settings updated', 
      data: {
        darkMode: settings.darkMode,
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        language: settings.language,
        currency: settings.currency,
        dateFormat: settings.dateFormat,
        autoBackup: settings.autoBackup,
        sessionTimeout: settings.sessionTimeout,
        twoFAEnabled: settings.twoFAEnabled,
      }
    })
  } catch (error) {
    console.error('Update settings error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// @route   GET /api/admin/profile
// @desc    Get admin profile
// @access  Private (Admin only)
router.get('/profile', adminAuth, async (req, res) => {
  try {
    const settings = await AdminSettings.getOrCreate(req.admin.id, req.admin.email)
    res.json(settings.profile)
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// @route   PUT /api/admin/profile
// @desc    Update admin profile
// @access  Private (Admin only)
router.put('/profile', adminAuth, async (req, res) => {
  try {
    const settings = await AdminSettings.getOrCreate(req.admin.id, req.admin.email)
    
    const { name, email, phone, avatar } = req.body
    
    if (name) settings.profile.name = name
    if (email) settings.profile.email = email
    if (phone !== undefined) settings.profile.phone = phone
    if (avatar) settings.profile.avatar = avatar
    
    await settings.save()
    
    res.json({ message: 'Profile updated', data: settings.profile })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// @route   POST /api/admin/profile/avatar
// @desc    Upload avatar (base64)
// @access  Private (Admin only)
router.post('/profile/avatar', adminAuth, async (req, res) => {
  try {
    const { avatar } = req.body
    
    if (!avatar) {
      return res.status(400).json({ message: 'Avatar data is required' })
    }
    
    const settings = await AdminSettings.getOrCreate(req.admin.id, req.admin.email)
    settings.profile.avatar = avatar
    await settings.save()
    
    res.json({ avatarUrl: avatar })
  } catch (error) {
    console.error('Upload avatar error:', error)
    res.status(500).json({ message: 'Upload failed', error: error.message })
  }
})

// @route   POST /api/admin/change-password
// @desc    Change password
// @access  Private (Admin only)
router.post('/change-password', adminAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' })
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' })
    }
    
    // Import User model and bcrypt for password verification
    const User = require('../models/User')
    const bcrypt = require('bcryptjs')
    
    const user = await User.findById(req.admin.id).select('+password')
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' })
    }
    
    // Hash and save new password
    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(newPassword, salt)
    await user.save()
    
    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// @route   POST /api/admin/2fa
// @desc    Toggle 2FA
// @access  Private (Admin only)
router.post('/2fa', adminAuth, async (req, res) => {
  try {
    const { enable } = req.body
    
    const settings = await AdminSettings.getOrCreate(req.admin.id, req.admin.email)
    settings.twoFAEnabled = enable
    
    // TODO: Generate and store 2FA secret when enabling
    // if (enable) {
    //   const speakeasy = require('speakeasy')
    //   const secret = speakeasy.generateSecret({ name: 'ExpenseTracker Admin' })
    //   settings.twoFASecret = secret.base32
    // } else {
    //   settings.twoFASecret = null
    // }
    
    await settings.save()
    
    res.json({ message: enable ? '2FA enabled' : '2FA disabled' })
  } catch (error) {
    console.error('2FA toggle error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// @route   POST /api/admin/backup
// @desc    Create backup
// @access  Private (Admin only)
router.post('/backup', adminAuth, async (req, res) => {
  try {
    const settings = await AdminSettings.getOrCreate(req.admin.id, req.admin.email)
    await settings.createBackup()
    
    res.json({ 
      message: 'Backup created', 
      lastBackupDate: settings.lastBackupDate.toLocaleString() 
    })
  } catch (error) {
    console.error('Backup error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// @route   GET /api/admin/backup
// @desc    Get backup
// @access  Private (Admin only)
router.get('/backup', adminAuth, async (req, res) => {
  try {
    const settings = await AdminSettings.getOrCreate(req.admin.id, req.admin.email)
    
    if (!settings.backup || !settings.backup.data) {
      return res.status(404).json({ message: 'No backup found' })
    }
    
    res.json({
      ...settings.backup.data,
      backupDate: settings.backup.createdAt
    })
  } catch (error) {
    console.error('Get backup error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// @route   POST /api/admin/backup/restore
// @desc    Restore backup
// @access  Private (Admin only)
router.post('/backup/restore', adminAuth, async (req, res) => {
  try {
    const settings = await AdminSettings.getOrCreate(req.admin.id, req.admin.email)
    
    if (!settings.backup || !settings.backup.data) {
      return res.status(404).json({ message: 'No backup found' })
    }
    
    await settings.restoreBackup()
    
    res.json({ 
      message: 'Backup restored', 
      settings: {
        darkMode: settings.darkMode,
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        language: settings.language,
        currency: settings.currency,
        dateFormat: settings.dateFormat,
        autoBackup: settings.autoBackup,
        sessionTimeout: settings.sessionTimeout,
        twoFAEnabled: settings.twoFAEnabled,
      },
      profile: settings.profile
    })
  } catch (error) {
    console.error('Restore error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// @route   POST /api/admin/reset
// @desc    Reset settings to defaults
// @access  Private (Admin only)
router.post('/reset', adminAuth, async (req, res) => {
  try {
    const settings = await AdminSettings.getOrCreate(req.admin.id, req.admin.email)
    
    // Reset to defaults
    settings.darkMode = false
    settings.emailNotifications = true
    settings.pushNotifications = false
    settings.language = 'en'
    settings.currency = 'INR'
    settings.dateFormat = 'DD/MM/YYYY'
    settings.autoBackup = true
    settings.sessionTimeout = 30
    settings.twoFAEnabled = false
    
    await settings.save()
    
    res.json({ 
      message: 'Settings reset to defaults',
      data: {
        darkMode: settings.darkMode,
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        language: settings.language,
        currency: settings.currency,
        dateFormat: settings.dateFormat,
        autoBackup: settings.autoBackup,
        sessionTimeout: settings.sessionTimeout,
        twoFAEnabled: settings.twoFAEnabled,
      }
    })
  } catch (error) {
    console.error('Reset error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// @route   GET /api/admin/export
// @desc    Export data
// @access  Private (Admin only)
router.get('/export', adminAuth, async (req, res) => {
  try {
    const { format } = req.query
    const settings = await AdminSettings.getOrCreate(req.admin.id, req.admin.email)
    
    const data = {
      settings: {
        darkMode: settings.darkMode,
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        language: settings.language,
        currency: settings.currency,
        dateFormat: settings.dateFormat,
        autoBackup: settings.autoBackup,
        sessionTimeout: settings.sessionTimeout,
        twoFAEnabled: settings.twoFAEnabled,
      },
      profile: settings.profile,
      exportDate: new Date().toISOString()
    }

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename=admin-export.csv')
      const csv = [
        'Category,Key,Value',
        ...Object.entries(data.settings).map(([k, v]) => `Settings,${k},${v}`),
        ...Object.entries(data.profile).map(([k, v]) => `Profile,${k},${k === 'avatar' ? '[Image]' : v}`)
      ].join('\n')
      res.send(csv)
    } else {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', 'attachment; filename=admin-export.json')
      res.json(data)
    }
  } catch (error) {
    console.error('Export error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

module.exports = router

const express = require('express')
const router = express.Router()

// In-memory storage (replace with database later)
let adminSettings = {
  darkMode: false,
  emailNotifications: true,
  pushNotifications: false,
  language: 'en',
  currency: 'INR',
  dateFormat: 'DD/MM/YYYY',
  autoBackup: true,
  sessionTimeout: 30,
  twoFAEnabled: false
}

let adminProfile = {
  name: 'Admin User',
  email: 'admin@example.com',
  phone: '',
  avatar: ''
}

let adminBackup = null
let lastBackupDate = null

// Simple auth middleware (replace with your actual auth)
const auth = (req, res, next) => {
  // For now, skip auth check - add your JWT verification here
  next()
}

// @route   GET /api/admin/settings
// @desc    Get admin settings
router.get('/settings', auth, (req, res) => {
  try {
    res.json({ data: adminSettings, lastBackupDate })
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/settings
// @desc    Update admin settings
router.put('/settings', auth, (req, res) => {
  try {
    adminSettings = { ...adminSettings, ...req.body }
    res.json({ message: 'Settings updated', data: adminSettings })
  } catch (error) {
    console.error('Update settings error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/profile
// @desc    Get admin profile
router.get('/profile', auth, (req, res) => {
  try {
    res.json(adminProfile)
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/profile
// @desc    Update admin profile
router.put('/profile', auth, (req, res) => {
  try {
    const { name, email, phone, avatar } = req.body
    adminProfile = { ...adminProfile, name, email, phone, avatar: avatar || adminProfile.avatar }
    res.json({ message: 'Profile updated', data: adminProfile })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/admin/profile/avatar
// @desc    Upload avatar (base64 for now)
router.post('/profile/avatar', auth, (req, res) => {
  try {
    const { avatar } = req.body
    adminProfile.avatar = avatar
    res.json({ avatarUrl: avatar })
  } catch (error) {
    console.error('Upload avatar error:', error)
    res.status(500).json({ message: 'Upload failed' })
  }
})

// @route   POST /api/admin/change-password
// @desc    Change password
router.post('/change-password', auth, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    // Add your password verification logic here
    // For now, just return success
    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/admin/2fa
// @desc    Toggle 2FA
router.post('/2fa', auth, (req, res) => {
  try {
    const { enable } = req.body
    adminSettings.twoFAEnabled = enable
    res.json({ message: enable ? '2FA enabled' : '2FA disabled' })
  } catch (error) {
    console.error('2FA toggle error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/admin/backup
// @desc    Create backup
router.post('/backup', auth, (req, res) => {
  try {
    adminBackup = {
      settings: { ...adminSettings },
      profile: { ...adminProfile },
      backupDate: new Date().toISOString()
    }
    lastBackupDate = new Date().toLocaleString()
    res.json({ message: 'Backup created', lastBackupDate })
  } catch (error) {
    console.error('Backup error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/backup
// @desc    Get backup
router.get('/backup', auth, (req, res) => {
  try {
    if (!adminBackup) {
      return res.status(404).json({ message: 'No backup found' })
    }
    res.json(adminBackup)
  } catch (error) {
    console.error('Get backup error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/admin/backup/restore
// @desc    Restore backup
router.post('/backup/restore', auth, (req, res) => {
  try {
    if (!adminBackup) {
      return res.status(404).json({ message: 'No backup found' })
    }
    adminSettings = { ...adminBackup.settings }
    adminProfile = { ...adminBackup.profile }
    res.json({ message: 'Backup restored', settings: adminSettings, profile: adminProfile })
  } catch (error) {
    console.error('Restore error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/export
// @desc    Export data
router.get('/export', auth, (req, res) => {
  try {
    const { format } = req.query
    const data = {
      settings: adminSettings,
      profile: adminProfile,
      exportDate: new Date().toISOString()
    }

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename=admin-export.csv')
      const csv = [
        'Category,Key,Value',
        ...Object.entries(adminSettings).map(([k, v]) => `Settings,${k},${v}`),
        ...Object.entries(adminProfile).map(([k, v]) => `Profile,${k},${k === 'avatar' ? '[Image]' : v}`)
      ].join('\n')
      res.send(csv)
    } else {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', 'attachment; filename=admin-export.json')
      res.json(data)
    }
  } catch (error) {
    console.error('Export error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router

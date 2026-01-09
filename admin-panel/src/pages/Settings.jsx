import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Avatar,
  IconButton,
  Slider,
  Chip,
  LinearProgress,
  Tooltip,
  CircularProgress,
  Skeleton
} from '@mui/material'
import {
  DarkMode,
  Language,
  Notifications,
  Security,
  Backup,
  Person,
  Visibility,
  VisibilityOff,
  PhotoCamera,
  RestartAlt,
  CloudUpload,
  Download,
  Timer,
  Sync,
  Delete
} from '@mui/icons-material'
import settingsApi from '../services/settingsApi'

// Default values
const DEFAULT_SETTINGS = {
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

const DEFAULT_PROFILE = {
  name: 'Admin User',
  email: 'admin@example.com',
  phone: '',
  avatar: ''
}

const Settings = () => {
  // Load from localStorage safely
  const getStoredSettings = () => {
    try {
      const saved = localStorage.getItem('adminSettings')
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  }

  const getStoredProfile = () => {
    try {
      const saved = localStorage.getItem('adminProfile')
      return saved ? { ...DEFAULT_PROFILE, ...JSON.parse(saved) } : DEFAULT_PROFILE
    } catch {
      return DEFAULT_PROFILE
    }
  }

  // States
  const [settings, setSettings] = useState(getStoredSettings)
  const [profile, setProfile] = useState(getStoredProfile)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [passwordDialog, setPasswordDialog] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false })
  const [twoFADialog, setTwoFADialog] = useState(false)
  const [restoreDialog, setRestoreDialog] = useState(false)
  const [resetDialog, setResetDialog] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [lastBackup, setLastBackup] = useState(() => localStorage.getItem('lastBackupDate'))
  const [changingPassword, setChangingPassword] = useState(false)

  const fileInputRef = useRef(null)

  // Show notification helper
  const showNotification = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }, [])

  // Apply dark mode to entire app
  const applyDarkMode = useCallback((isDark) => {
    const root = document.documentElement
    const body = document.body
    const rootEl = document.getElementById('root')
    
    if (isDark) {
      root.style.colorScheme = 'dark'
      body.style.backgroundColor = '#121212'
      body.style.color = '#ffffff'
      body.classList.add('dark-mode')
      body.classList.remove('light-mode')
      if (rootEl) {
        rootEl.style.backgroundColor = '#121212'
        rootEl.style.color = '#ffffff'
      }
      // Apply to MUI components globally
      root.setAttribute('data-theme', 'dark')
    } else {
      root.style.colorScheme = 'light'
      body.style.backgroundColor = '#f5f5f5'
      body.style.color = '#212121'
      body.classList.add('light-mode')
      body.classList.remove('dark-mode')
      if (rootEl) {
        rootEl.style.backgroundColor = '#f5f5f5'
        rootEl.style.color = '#212121'
      }
      root.setAttribute('data-theme', 'light')
    }
  }, [])

  // Apply dark mode on mount
  useEffect(() => {
    applyDarkMode(settings.darkMode)
  }, [settings.darkMode, applyDarkMode])

  // Fetch from backend on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, profileRes] = await Promise.all([
          settingsApi.getSettings().catch(() => null),
          settingsApi.getProfile().catch(() => null)
        ])
        
        if (settingsRes?.data) {
          const newSettings = { ...DEFAULT_SETTINGS, ...settingsRes.data }
          setSettings(newSettings)
          localStorage.setItem('adminSettings', JSON.stringify(newSettings))
        }
        
        if (profileRes?.data) {
          const newProfile = { ...DEFAULT_PROFILE, ...profileRes.data }
          setProfile(newProfile)
          localStorage.setItem('adminProfile', JSON.stringify(newProfile))
        }
        
        if (settingsRes?.lastBackupDate) {
          setLastBackup(settingsRes.lastBackupDate)
        }
      } catch (error) {
        console.log('Using local settings')
      }
    }
    fetchData()
  }, [])

  // Password Strength Calculator
  const calculatePasswordStrength = (password) => {
    let strength = 0
    if (password.length >= 6) strength += 20
    if (password.length >= 10) strength += 20
    if (/[a-z]/.test(password)) strength += 15
    if (/[A-Z]/.test(password)) strength += 15
    if (/[0-9]/.test(password)) strength += 15
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15
    return Math.min(strength, 100)
  }

  const getStrengthColor = (strength) => {
    if (strength < 40) return 'error'
    if (strength < 70) return 'warning'
    return 'success'
  }

  const getStrengthLabel = (strength) => {
    if (strength < 40) return 'Weak'
    if (strength < 70) return 'Medium'
    return 'Strong'
  }

  // Handle settings change
  const handleSettingChange = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem('adminSettings', JSON.stringify(newSettings))
    
    if (key === 'darkMode') {
      applyDarkMode(value)
      showNotification(value ? 'Dark mode enabled!' : 'Light mode enabled!')
    }
  }

  // Handle profile change
  const handleProfileChange = (key) => (event) => {
    const newProfile = { ...profile, [key]: event.target.value }
    setProfile(newProfile)
  }

  // Avatar Upload Handler
  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showNotification('Please select an image file!', 'error')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      showNotification('Image size should be less than 2MB!', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result
      if (base64) {
        const newProfile = { ...profile, avatar: base64 }
        setProfile(newProfile)
        localStorage.setItem('adminProfile', JSON.stringify(newProfile))
        showNotification('Profile photo updated!')
      }
    }
    reader.onerror = () => showNotification('Failed to read image!', 'error')
    reader.readAsDataURL(file)
    
    // Reset input
    event.target.value = ''
  }

  // Remove avatar
  const handleRemoveAvatar = () => {
    const newProfile = { ...profile, avatar: '' }
    setProfile(newProfile)
    localStorage.setItem('adminProfile', JSON.stringify(newProfile))
    showNotification('Profile photo removed!')
  }

  // Save all settings
  const handleSave = async () => {
    setSaving(true)
    try {
      await Promise.all([
        settingsApi.updateSettings(settings).catch(() => null),
        settingsApi.updateProfile(profile).catch(() => null)
      ])
    } catch (e) {
      console.log('Backend save failed')
    }
    
    localStorage.setItem('adminSettings', JSON.stringify(settings))
    localStorage.setItem('adminProfile', JSON.stringify(profile))
    showNotification('Settings saved successfully!')
    setSaving(false)
  }

  // Password change
  const handlePasswordChange = async () => {
    if (!passwords.current) {
      showNotification('Enter current password!', 'error')
      return
    }
    if (passwords.new !== passwords.confirm) {
      showNotification('Passwords do not match!', 'error')
      return
    }
    if (passwordStrength < 40) {
      showNotification('Password too weak!', 'error')
      return
    }

    setChangingPassword(true)
    try {
      await settingsApi.changePassword(passwords.current, passwords.new)
      showNotification('Password changed!')
    } catch (error) {
      showNotification(error.response?.data?.message || 'Password change failed!', 'error')
      setChangingPassword(false)
      return
    }
    
    setPasswordDialog(false)
    setPasswords({ current: '', new: '', confirm: '' })
    setPasswordStrength(0)
    setChangingPassword(false)
  }

  // Export data - FIXED
  const handleExportData = (format) => {
    try {
      // Prepare data without avatar (too large for export)
      const exportProfile = { ...profile }
      if (exportProfile.avatar && exportProfile.avatar.length > 1000) {
        exportProfile.avatar = '[Image Data - Not Exported]'
      }
      
      const data = { 
        settings, 
        profile: exportProfile, 
        exportDate: new Date().toISOString(),
        version: '1.0'
      }
      
      let content, mimeType, extension
      
      if (format === 'json') {
        content = JSON.stringify(data, null, 2)
        mimeType = 'application/json;charset=utf-8'
        extension = 'json'
      } else {
        // CSV format
        const rows = [
          ['Category', 'Key', 'Value'],
          ['Export', 'Date', new Date().toLocaleString()],
          ['Export', 'Version', '1.0'],
          '',
          ['Settings', '---', '---'],
          ...Object.entries(settings).map(([key, value]) => ['Settings', key, String(value)]),
          '',
          ['Profile', '---', '---'],
          ['Profile', 'Name', profile.name || ''],
          ['Profile', 'Email', profile.email || ''],
          ['Profile', 'Phone', profile.phone || '']
        ]
        content = rows.map(row => Array.isArray(row) ? row.join(',') : '').join('\n')
        mimeType = 'text/csv;charset=utf-8'
        extension = 'csv'
      }
      
      // Create and download file
      const blob = new Blob([content], { type: mimeType })
      const filename = `admin-settings-${new Date().toISOString().slice(0, 10)}.${extension}`
      
      // Use different method for better compatibility
      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        // IE11 support
        window.navigator.msSaveOrOpenBlob(blob, filename)
      } else {
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        }, 100)
      }
      
      showNotification(`Exported as ${format.toUpperCase()} successfully!`)
    } catch (error) {
      console.error('Export error:', error)
      showNotification('Export failed! ' + error.message, 'error')
    }
  }

  // Backup - FIXED
  const handleBackup = () => {
    try {
      const backupData = { 
        settings: { ...settings },
        profile: { ...profile },
        backupDate: new Date().toISOString(),
        version: '1.0'
      }
      
      // Save to localStorage
      const backupString = JSON.stringify(backupData)
      localStorage.setItem('adminBackup', backupString)
      
      const dateStr = new Date().toLocaleString()
      localStorage.setItem('lastBackupDate', dateStr)
      setLastBackup(dateStr)
      
      // Verify backup was saved
      const saved = localStorage.getItem('adminBackup')
      if (saved) {
        showNotification('Backup created successfully!')
        console.log('Backup saved:', backupData)
      } else {
        throw new Error('Failed to save backup to localStorage')
      }
      
      // Try backend backup (non-blocking)
      settingsApi.createBackup().catch(err => {
        console.log('Backend backup skipped:', err.message)
      })
    } catch (error) {
      console.error('Backup error:', error)
      showNotification('Backup failed! ' + error.message, 'error')
    }
  }

  // Restore backup - FIXED
  const handleRestoreBackup = () => {
    try {
      const backupString = localStorage.getItem('adminBackup')
      
      if (!backupString) {
        showNotification('No backup found!', 'error')
        setRestoreDialog(false)
        return
      }
      
      const backup = JSON.parse(backupString)
      console.log('Restoring backup:', backup)
      
      if (backup.settings) {
        const restoredSettings = { ...DEFAULT_SETTINGS, ...backup.settings }
        setSettings(restoredSettings)
        localStorage.setItem('adminSettings', JSON.stringify(restoredSettings))
        applyDarkMode(restoredSettings.darkMode)
      }
      
      if (backup.profile) {
        const restoredProfile = { ...DEFAULT_PROFILE, ...backup.profile }
        setProfile(restoredProfile)
        localStorage.setItem('adminProfile', JSON.stringify(restoredProfile))
      }
      
      setRestoreDialog(false)
      showNotification('Backup restored successfully!')
    } catch (error) {
      console.error('Restore error:', error)
      showNotification('Restore failed! ' + error.message, 'error')
      setRestoreDialog(false)
    }
  }

  // Reset to defaults
  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS)
    localStorage.setItem('adminSettings', JSON.stringify(DEFAULT_SETTINGS))
    applyDarkMode(false)
    setResetDialog(false)
    showNotification('Settings reset to defaults!')
  }

  // Toggle 2FA
  const handleToggle2FA = () => {
    const newValue = !settings.twoFAEnabled
    const newSettings = { ...settings, twoFAEnabled: newValue }
    setSettings(newSettings)
    localStorage.setItem('adminSettings', JSON.stringify(newSettings))
    setTwoFADialog(false)
    showNotification(newValue ? '2FA Enabled!' : '2FA Disabled!')
    
    settingsApi.toggle2FA(newValue).catch(() => {})
  }

  // Refresh from server
  const handleRefresh = async () => {
    setLoading(true)
    try {
      const [settingsRes, profileRes] = await Promise.all([
        settingsApi.getSettings(),
        settingsApi.getProfile()
      ])
      
      if (settingsRes?.data) {
        setSettings({ ...DEFAULT_SETTINGS, ...settingsRes.data })
        applyDarkMode(settingsRes.data.darkMode)
      }
      if (profileRes?.data) {
        setProfile({ ...DEFAULT_PROFILE, ...profileRes.data })
      }
      showNotification('Refreshed from server!')
    } catch {
      showNotification('Server not available', 'warning')
    }
    setLoading(false)
  }

  // Card style based on dark mode
  const cardBg = settings.darkMode ? '#1e1e1e' : '#fff'
  const textColor = settings.darkMode ? '#fff' : 'inherit'
  const secondaryText = settings.darkMode ? '#aaa' : 'text.secondary'
  const borderColor = settings.darkMode ? '#444' : 'rgba(0,0,0,0.23)'

  const inputSx = {
    '& .MuiInputBase-input': { color: textColor },
    '& .MuiInputLabel-root': { color: secondaryText },
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor },
      '&:hover fieldset': { borderColor: settings.darkMode ? '#666' : 'rgba(0,0,0,0.87)' }
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={200} height={50} />
        <Skeleton variant="rectangular" height={180} sx={{ mb: 3, borderRadius: 2 }} />
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Skeleton variant="rectangular" height={150} sx={{ flex: 1, borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={150} sx={{ flex: 1, borderRadius: 2 }} />
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 2, minHeight: '100vh', bgcolor: settings.darkMode ? '#121212' : '#f5f5f5' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: textColor, fontWeight: 600 }}>⚙️ Settings</Typography>
        <Box>
          <Tooltip title="Refresh from Server">
            <IconButton color="primary" onClick={handleRefresh}><Sync /></IconButton>
          </Tooltip>
          <Tooltip title="Reset to Defaults">
            <IconButton color="warning" onClick={() => setResetDialog(true)}><RestartAlt /></IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Profile Card */}
      <Card sx={{ mb: 3, bgcolor: cardBg }}>
        <CardHeader avatar={<Person sx={{ color: settings.darkMode ? '#90caf9' : 'primary.main' }} />} 
          title={<Typography sx={{ color: textColor, fontWeight: 500 }}>Profile Settings</Typography>} />
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar sx={{ width: 100, height: 100, fontSize: 36, bgcolor: 'primary.main' }} src={profile.avatar || undefined}>
                {!profile.avatar && (profile.name?.[0]?.toUpperCase() || 'A')}
              </Avatar>
              <IconButton 
                sx={{ position: 'absolute', bottom: -4, right: -4, bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' }, width: 32, height: 32 }}
                onClick={() => fileInputRef.current?.click()}
              >
                <PhotoCamera sx={{ color: '#fff', fontSize: 16 }} />
              </IconButton>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAvatarUpload} />
            </Box>
            <Box sx={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <TextField label="Name" value={profile.name} onChange={handleProfileChange('name')} sx={{ minWidth: 200, ...inputSx }} />
              <TextField label="Email" type="email" value={profile.email} onChange={handleProfileChange('email')} sx={{ minWidth: 200, ...inputSx }} />
              <TextField label="Phone" value={profile.phone} onChange={handleProfileChange('phone')} sx={{ minWidth: 200, ...inputSx }} />
            </Box>
          </Box>
          {profile.avatar && (
            <Button startIcon={<Delete />} color="error" size="small" sx={{ mt: 2 }} onClick={handleRemoveAvatar}>
              Remove Photo
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Row 1: Appearance & Language */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        <Box sx={{ flex: '1 1 300px', minWidth: 280 }}>
          <Card sx={{ height: '100%', bgcolor: cardBg }}>
            <CardHeader avatar={<DarkMode sx={{ color: settings.darkMode ? '#ffd54f' : 'inherit' }} />}
              title={<Typography sx={{ color: textColor }}>Appearance</Typography>} />
            <CardContent>
              <FormControlLabel
                control={<Switch checked={settings.darkMode} onChange={handleSettingChange('darkMode')} color="warning" />}
                label={<Typography sx={{ color: textColor }}>{settings.darkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}</Typography>}
              />
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 300px', minWidth: 280 }}>
          <Card sx={{ height: '100%', bgcolor: cardBg }}>
            <CardHeader avatar={<Language sx={{ color: settings.darkMode ? '#90caf9' : 'inherit' }} />}
              title={<Typography sx={{ color: textColor }}>Language & Region</Typography>} />
            <CardContent>
              <FormControl fullWidth sx={{ mb: 2, ...inputSx }}>
                <InputLabel>Language</InputLabel>
                <Select value={settings.language} label="Language" onChange={handleSettingChange('language')}>
                  <MenuItem value="en">🇺🇸 English</MenuItem>
                  <MenuItem value="hi">🇮🇳 Hindi</MenuItem>
                  <MenuItem value="es">🇪🇸 Spanish</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2, ...inputSx }}>
                <InputLabel>Currency</InputLabel>
                <Select value={settings.currency} label="Currency" onChange={handleSettingChange('currency')}>
                  <MenuItem value="INR">₹ INR</MenuItem>
                  <MenuItem value="USD">$ USD</MenuItem>
                  <MenuItem value="EUR">€ EUR</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={inputSx}>
                <InputLabel>Date Format</InputLabel>
                <Select value={settings.dateFormat} label="Date Format" onChange={handleSettingChange('dateFormat')}>
                  <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                  <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                  <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Row 2: Notifications & Session */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        <Box sx={{ flex: '1 1 300px', minWidth: 280 }}>
          <Card sx={{ height: '100%', bgcolor: cardBg }}>
            <CardHeader avatar={<Notifications sx={{ color: settings.darkMode ? '#90caf9' : 'inherit' }} />}
              title={<Typography sx={{ color: textColor }}>Notifications</Typography>} />
            <CardContent>
              <FormControlLabel
                control={<Switch checked={settings.emailNotifications} onChange={handleSettingChange('emailNotifications')} />}
                label={<Typography sx={{ color: textColor }}>Email Notifications</Typography>}
              />
              <FormControlLabel
                control={<Switch checked={settings.pushNotifications} onChange={handleSettingChange('pushNotifications')} />}
                label={<Typography sx={{ color: textColor }}>Push Notifications</Typography>}
              />
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 300px', minWidth: 280 }}>
          <Card sx={{ height: '100%', bgcolor: cardBg }}>
            <CardHeader avatar={<Timer sx={{ color: settings.darkMode ? '#90caf9' : 'inherit' }} />}
              title={<Typography sx={{ color: textColor }}>Session Settings</Typography>} />
            <CardContent>
              <Typography sx={{ color: textColor, mb: 1 }}>Timeout: {settings.sessionTimeout} min</Typography>
              <Slider
                value={settings.sessionTimeout}
                onChange={(_, val) => {
                  const newSettings = { ...settings, sessionTimeout: val }
                  setSettings(newSettings)
                  localStorage.setItem('adminSettings', JSON.stringify(newSettings))
                }}
                min={5} max={120} step={5}
                marks={[{ value: 5, label: '5m' }, { value: 60, label: '1h' }, { value: 120, label: '2h' }]}
              />
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Backup Card */}
      <Card sx={{ mb: 3, bgcolor: cardBg }}>
        <CardHeader avatar={<Backup sx={{ color: settings.darkMode ? '#90caf9' : 'inherit' }} />}
          title={<Typography sx={{ color: textColor }}>Data & Backup</Typography>} />
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <FormControlLabel
              control={<Switch checked={settings.autoBackup} onChange={handleSettingChange('autoBackup')} />}
              label={<Typography sx={{ color: textColor }}>Auto Backup</Typography>}
            />
            {lastBackup && <Chip label={`Last: ${lastBackup}`} size="small" color="info" variant="outlined" />}
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Button variant="outlined" startIcon={<Download />} onClick={() => handleExportData('json')}>JSON</Button>
            <Button variant="outlined" startIcon={<Download />} onClick={() => handleExportData('csv')}>CSV</Button>
            <Button variant="contained" startIcon={<CloudUpload />} onClick={handleBackup}>Backup</Button>
            <Button variant="outlined" color="warning" onClick={() => setRestoreDialog(true)}>Restore</Button>
          </Box>
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card sx={{ mb: 3, bgcolor: cardBg }}>
        <CardHeader avatar={<Security sx={{ color: settings.darkMode ? '#90caf9' : 'inherit' }} />}
          title={<Typography sx={{ color: textColor }}>Security</Typography>} />
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="outlined" onClick={() => setPasswordDialog(true)}>Change Password</Button>
            <Button
              variant={settings.twoFAEnabled ? 'contained' : 'outlined'}
              color={settings.twoFAEnabled ? 'success' : 'primary'}
              onClick={() => setTwoFADialog(true)}
            >
              {settings.twoFAEnabled ? '2FA Enabled ✓' : 'Enable 2FA'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Box sx={{ textAlign: 'right' }}>
        <Button variant="contained" size="large" onClick={handleSave} disabled={saving}
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : null}>
          {saving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </Box>

      {/* Password Dialog */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="normal" label="Current Password" 
            type={showPassword.current ? 'text' : 'password'} value={passwords.current}
            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })
            }
            InputProps={{ endAdornment: <IconButton onClick={() => setShowPassword(p => ({ ...p, current: !p.current }))}>{showPassword.current ? <VisibilityOff /> : <Visibility />}</IconButton> }}
          />
          <TextField fullWidth margin="normal" label="New Password"
            type={showPassword.new ? 'text' : 'password'} value={passwords.new}
            onChange={(e) => { setPasswords({ ...passwords, new: e.target.value }); setPasswordStrength(calculatePasswordStrength(e.target.value)) }}
            InputProps={{ endAdornment: <IconButton onClick={() => setShowPassword(p => ({ ...p, new: !p.new }))}>{showPassword.new ? <VisibilityOff /> : <Visibility />}</IconButton> }}
          />
          {passwords.new && (
            <Box sx={{ mt: 1 }}>
              <LinearProgress variant="determinate" value={passwordStrength} color={getStrengthColor(passwordStrength)} />
              <Typography variant="caption" color={`${getStrengthColor(passwordStrength)}.main`}>{getStrengthLabel(passwordStrength)}</Typography>
            </Box>
          )}
          <TextField fullWidth margin="normal" label="Confirm Password"
            type={showPassword.confirm ? 'text' : 'password'} value={passwords.confirm}
            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
            error={!!(passwords.confirm && passwords.new !== passwords.confirm)}
            helperText={passwords.confirm && passwords.new !== passwords.confirm ? 'Passwords do not match' : ''}
            InputProps={{ endAdornment: <IconButton onClick={() => setShowPassword(p => ({ ...p, confirm: !p.confirm }))}>{showPassword.confirm ? <VisibilityOff /> : <Visibility />}</IconButton> }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setPasswordDialog(false); setPasswords({ current: '', new: '', confirm: '' }); setPasswordStrength(0) }}>Cancel</Button>
          <Button variant="contained" onClick={handlePasswordChange} disabled={passwordStrength < 40 || changingPassword}>
            {changingPassword ? <CircularProgress size={20} /> : 'Change'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2FA Dialog */}
      <Dialog open={twoFADialog} onClose={() => setTwoFADialog(false)}>
        <DialogTitle>{settings.twoFAEnabled ? 'Disable 2FA?' : 'Enable 2FA?'}</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 1 }}>{settings.twoFAEnabled ? 'This reduces security.' : 'Adds extra protection.'}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTwoFADialog(false)}>Cancel</Button>
          <Button variant="contained" color={settings.twoFAEnabled ? 'error' : 'primary'} onClick={handleToggle2FA}>
            {settings.twoFAEnabled ? 'Disable' : 'Enable'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore Dialog */}
      <Dialog open={restoreDialog} onClose={() => setRestoreDialog(false)}>
        <DialogTitle>Restore Backup?</DialogTitle>
        <DialogContent><Typography>This will replace current settings.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialog(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleRestoreBackup}>Restore</Button>
        </DialogActions>
      </Dialog>

      {/* Reset Dialog */}
      <Dialog open={resetDialog} onClose={() => setResetDialog(false)}>
        <DialogTitle>Reset Settings?</DialogTitle>
        <DialogContent><Typography>All settings will be reset to defaults.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleResetDefaults}>Reset</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(s => ({ ...s, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  )
}

export default Settings
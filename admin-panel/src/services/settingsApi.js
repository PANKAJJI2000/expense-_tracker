import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Get auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('adminToken')
  return { headers: { Authorization: `Bearer ${token}` } }
}

// Settings API
export const settingsApi = {
  // Get admin settings
  getSettings: async () => {
    const response = await axios.get(`${API_URL}/admin/settings`, getAuthHeader())
    return response.data
  },

  // Update settings
  updateSettings: async (settings) => {
    const response = await axios.put(`${API_URL}/admin/settings`, settings, getAuthHeader())
    return response.data
  },

  // Get profile
  getProfile: async () => {
    const response = await axios.get(`${API_URL}/admin/profile`, getAuthHeader())
    return response.data
  },

  // Update profile
  updateProfile: async (profile) => {
    const response = await axios.put(`${API_URL}/admin/profile`, profile, getAuthHeader())
    return response.data
  },

  // Upload avatar
  uploadAvatar: async (file) => {
    const formData = new FormData()
    formData.append('avatar', file)
    const response = await axios.post(`${API_URL}/admin/profile/avatar`, formData, {
      ...getAuthHeader(),
      headers: { ...getAuthHeader().headers, 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    const response = await axios.post(`${API_URL}/admin/change-password`, {
      currentPassword,
      newPassword
    }, getAuthHeader())
    return response.data
  },

  // Toggle 2FA
  toggle2FA: async (enable) => {
    const response = await axios.post(`${API_URL}/admin/2fa`, { enable }, getAuthHeader())
    return response.data
  },

  // Create backup
  createBackup: async () => {
    const response = await axios.post(`${API_URL}/admin/backup`, {}, getAuthHeader())
    return response.data
  },

  // Get backup
  getBackup: async () => {
    const response = await axios.get(`${API_URL}/admin/backup`, getAuthHeader())
    return response.data
  },

  // Restore backup
  restoreBackup: async (backupId) => {
    const response = await axios.post(`${API_URL}/admin/backup/restore`, { backupId }, getAuthHeader())
    return response.data
  },

  // Export data
  exportData: async (format) => {
    const response = await axios.get(`${API_URL}/admin/export?format=${format}`, {
      ...getAuthHeader(),
      responseType: 'blob'
    })
    return response.data
  }
}

export default settingsApi

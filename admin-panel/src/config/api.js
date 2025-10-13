import axios from 'axios'

// Use the correct backend URL based on your server.js configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://expense-tracker-rot7.onrender.com/api'  // This matches your server.js
  : 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log('Making request to:', config.baseURL + config.url)
    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Response Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      }
    })

    // Handle 401 errors by clearing token
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken')
      // Optionally redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api

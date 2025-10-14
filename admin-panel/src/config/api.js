import axios from 'axios'

// API Configuration
// Backend server runs on port 3000 in development
// Production URL should match your deployed backend server
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://expense-tracker-backend-48vm.onrender.com/api'  // Production backend URL
  : 'http://localhost:3000/api'  // Local development backend URL

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout for slow network connections
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Enable cookies for authentication
})

// Request interceptor to add auth token to all requests
api.interceptors.request.use(
  (config) => {
    // Get admin token from localStorage and add to Authorization header
    const token = localStorage.getItem('adminToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Log request URL for debugging
    console.log('Making request to:', config.baseURL + config.url)
    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for centralized error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log detailed error information for debugging
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

    // Handle authentication errors (401 Unauthorized)
    if (error.response?.status === 401) {
      // Clear invalid token from localStorage
      localStorage.removeItem('adminToken')
      // Redirect to login page if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api

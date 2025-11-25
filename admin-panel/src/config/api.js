import axios from 'axios'

// Get base URL from environment or use default
const BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://expense-tracker-backend-48vm.onrender.com/api'
    : 'http://localhost:3000/api')

console.log('Current Mode:', import.meta.env.MODE)
console.log('API Base URL:', BASE_URL)

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - Add auth token and log requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken')
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('✓ Token added to request:', token.substring(0, 20) + '...')
    } else {
      console.warn('⚠ No auth token found in localStorage')
    }
    
    console.log('→ API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullURL: config.baseURL + config.url,
      headers: config.headers,
      data: config.data
    })
    
    return config
  },
  (error) => {
    console.error('✗ Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor - Log responses and handle errors
api.interceptors.response.use(
  (response) => {
    console.log('← API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
      headers: response.headers
    })
    return response
  },
  (error) => {
    console.error('✗ API Error:', {
      message: error.message,
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    })
    
    // Handle specific errors
    if (error.response?.status === 401) {
      console.warn('⚠ Authentication failed - Token may be invalid or expired')
      // Optionally redirect to login
      // window.location.href = '/login'
    }
    
    if (!error.response) {
      console.error('✗ Network Error - Cannot reach server at:', BASE_URL)
      console.error('Possible causes:')
      console.error('  1. Backend server is not running')
      console.error('  2. CORS is not configured properly')
      console.error('  3. Wrong BASE_URL configuration')
      console.error('  4. Firewall/network blocking the request')
    }
    
    return Promise.reject(error)
  }
)

export default api
export { BASE_URL }
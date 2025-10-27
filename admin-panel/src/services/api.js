import axios from 'axios'

// Determine the base URL based on environment
const baseURL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://expense-tracker-rot7.onrender.com/api'
    : 'http://localhost:3000/api')

const api = axios.create({
  baseURL,
  withCredentials: true, // Important for sessions
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data)
      
      // Handle authentication errors
      if (error.response.status === 401) {
        // Redirect to login if unauthorized
        window.location.href = '/login'
      }
    } else if (error.request) {
      console.error('Network Error:', error.request)
    } else {
      console.error('Error:', error.message)
    }
    
    return Promise.reject(error)
  }
)

export default api

import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../config/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      // Verify token with backend
      verifyToken()
    } else {
      setLoading(false)
    }
  }, [])

  const verifyToken = async () => {
    try {
      const response = await api.get('/admin/verify')
      setUser(response.data.user)
    } catch (error) {
      localStorage.removeItem('adminToken')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      console.log(api.defaults.baseURL)
      console.log('Attempting login to:', `${api.defaults.baseURL}/admin/login`)
      console.log('API base URL:', api.defaults.baseURL)
      
      const response = await api.post('/admin/login', { 
        email, 
        password 
      }, {
        timeout: 60000 // Increase timeout to 60 seconds
      })
      const { token, user } = response.data
      
      localStorage.setItem('adminToken', token)
      setUser(user)
      return { success: true }
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      })
      
      // Handle timeout errors
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.error('Request timed out - Backend server may be starting up or database connection is slow')
        return { 
          success: false, 
          error: 'Request timed out. The backend server may be starting up or having database connection issues. Please wait a moment and try again.' 
        }
      }
      
      // Handle network errors
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        console.error('Network error - API server may be unreachable')
        return { 
          success: false, 
          error: `Unable to connect to server. Please ensure the backend server is running on ${api.defaults.baseURL}` 
        }
      }
      
      // Handle CORS errors
      if (error.message.includes('CORS') || error.code === 'ERR_BLOCKED_BY_CLIENT') {
        console.error('CORS error detected')
        return { 
          success: false, 
          error: 'CORS policy error. The server needs to allow requests from this domain.' 
        }
      }
      
      // Handle other errors
      const errorMessage = error.response?.data?.message || error.message || 'Login failed'
      console.error('Login failed with message:', errorMessage)
      
      return { 
        success: false, 
        error: errorMessage
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    setUser(null)
  }

  const value = {
    user,
    login,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
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
    } finally {p
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      console.log(api.defaults.baseURL)
      console.log('Attempting login to:', `${api.defaults.baseURL}/admin/login`)
      console.log('API base URL:', api.defaults.baseURL)
      
      // Test basic connectivity first
      console.log('Testing server connectivity...')
      
      const response = await api.post('/admin/login', { email, password })
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
      
      // Handle network errors
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        console.error('Network error - API server may be unreachable')
        console.error('Trying to reach:', `${api.defaults.baseURL}/admin/login`)
        
        // Test if it's a DNS/connection issue
        try {
          const healthCheck = await fetch(`${api.defaults.baseURL}/api/health`, { 
            method: 'GET',
            mode: 'cors'
          })
          console.log('Health check response:', healthCheck.status)
        } catch (healthError) {
          console.error('Health check also failed:', healthError.message)
        }
        
        return { 
          success: false, 
          error: `Unable to connect to server at ${api.defaults.baseURL}. Please check if the API server is running and accessible.` 
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

import React, { useState, useEffect } from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText
} from '@mui/material'
import {
  TrendingUp,
  People,
  Receipt,
  AttachMoney
} from '@mui/icons-material'
import api from '../config/api'

const StatCard = ({ title, value, icon, color }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="h2">
            {value}
          </Typography>
        </Box>
        <Box sx={{ color }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
)

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalExpenses: 0,
    totalAmount: 0,
    monthlyGrowth: 0
  })
  const [recentExpenses, setRecentExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Try to fetch stats
      let statsData = {
        totalUsers: 0,
        totalExpenses: 0,
        totalAmount: 0,
        monthlyGrowth: 0
      }
      
      let expensesData = []
      
      try {
        const statsRes = await api.get('/admin/stats')
        statsData = statsRes.data
      } catch (statsError) {
        console.warn('Stats endpoint not available:', statsError.response?.status)
        // Use mock data or try alternative endpoints
        if (statsError.response?.status === 404) {
          console.log('Using fallback data for stats')
          statsData = {
            totalUsers: 25,
            totalExpenses: 156,
            totalAmount: 12450,
            monthlyGrowth: 8.5
          }
        }
      }
      
      try {
        const expensesRes = await api.get('/admin/recent-expenses')
        expensesData = expensesRes.data
      } catch (expensesError) {
        console.warn('Recent expenses endpoint not available:', expensesError.response?.status)
        // Use mock data
        if (expensesError.response?.status === 404) {
          console.log('Using fallback data for recent expenses')
          expensesData = [
            {
              _id: '1',
              description: 'Office Supplies',
              amount: 125.50,
              category: 'Business',
              userEmail: 'user1@example.com'
            },
            {
              _id: '2',
              description: 'Team Lunch',
              amount: 89.25,
              category: 'Food',
              userEmail: 'user2@example.com'
            },
            {
              _id: '3',
              description: 'Software License',
              amount: 299.99,
              category: 'Technology',
              userEmail: 'user3@example.com'
            }
          ]
        }
      }
      
      setStats(statsData)
      setRecentExpenses(expensesData)
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setError('Failed to load dashboard data. Please check if the server is running.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading dashboard...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Showing demo data for development purposes.
          </Typography>
        </Paper>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Show a notice if using fallback data */}
      <Box sx={{ mb: 2 }}>
        <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
          <Typography variant="body2">
            📊 Dashboard is showing demo data. Admin endpoints will be implemented soon.
          </Typography>
        </Paper>
      </Box>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<People fontSize="large" />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Expenses"
            value={stats.totalExpenses}
            icon={<Receipt fontSize="large" />}
            color="#dc004e"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Amount"
            value={`$${stats.totalAmount.toLocaleString()}`}
            icon={<AttachMoney fontSize="large" />}
            color="#00c853"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Growth"
            value={`${stats.monthlyGrowth}%`}
            icon={<TrendingUp fontSize="large" />}
            color="#ff6f00"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Expenses
            </Typography>
            <List>
              {recentExpenses.map((expense, index) => (
                <ListItem key={expense._id || index}>
                  <ListItemText
                    primary={expense.description || 'No description'}
                    secondary={`$${expense.amount?.toFixed(2)} - ${expense.category} - ${expense.userEmail}`}
                  />
                </ListItem>
              ))}
              {recentExpenses.length === 0 && (
                <ListItem>
                  <ListItemText primary="No recent expenses found" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard

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

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, expensesRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/recent-expenses')
      ])
      
      setStats(statsRes.data)
      setRecentExpenses(expensesRes.data)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
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

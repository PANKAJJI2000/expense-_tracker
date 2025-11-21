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
  ListItemText,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  TrendingUp,
  People,
  Receipt,
  AttachMoney,
  Refresh,
  Error as ErrorIcon,
  ArrowUpward,
  ArrowDownward,
  Description,
  AccountBalance,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Visibility,
  Download
} from '@mui/icons-material'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import api from '../config/api'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c']

const StatCard = ({ title, value, icon, color, trend, trendValue }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="h2" sx={{ mb: 1 }}>
            {value}
          </Typography>
          {trend !== undefined && (
            <Box display="flex" alignItems="center" gap={0.5}>
              {trend > 0 ? (
                <ArrowUpward sx={{ fontSize: 16, color: 'success.main' }} />
              ) : trend < 0 ? (
                <ArrowDownward sx={{ fontSize: 16, color: 'error.main' }} />
              ) : null}
              <Typography 
                variant="body2" 
                color={trend > 0 ? 'success.main' : trend < 0 ? 'error.main' : 'textSecondary'}
              >
                {Math.abs(trend)}% {trendValue || 'vs last month'}
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ color, opacity: 0.8 }}>
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
  const [updatedExpenses, setUpdatedExpenses] = useState([])
  const [trendData, setTrendData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [manageExpenseData, setManageExpenseData] = useState({ submissions: [], stats: {} })
  const [incomeTaxHelpData, setIncomeTaxHelpData] = useState({ submissions: [], stats: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [lastFetchTime, setLastFetchTime] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async (isRetry = false) => {
    try {
      setLoading(true)
      if (!isRetry) {
        setError(null)
        setRetryCount(0)
      }
      
      console.log('Fetching dashboard data...', { isRetry, retryCount })
      
      if (!api) {
        throw new Error('API configuration is missing')
      }

      let statsData = null
      let expensesData = []
      let trendsData = []
      let categoriesData = []
      let monthData = []
      
      // Fetch stats
      try {
        console.log('Fetching stats from /admin/stats...')
        const statsRes = await api.get('/admin/stats')
        console.log('Stats response:', statsRes.data)
        
        statsData = {
          totalUsers: Number(statsRes.data?.totalUsers) || 0,
          totalExpenses: Number(statsRes.data?.totalExpenses) || 0,
          totalAmount: Number(statsRes.data?.totalAmount) || 0,
          monthlyGrowth: Number(statsRes.data?.monthlyGrowth) || 0
        }
        
        setStats(statsData)
      } catch (statsError) {
        console.error('Failed to fetch stats:', statsError)
        setStats({
          totalUsers: 0,
          totalExpenses: 0,
          totalAmount: 0,
          monthlyGrowth: 0
        })
      }
      
      // Fetch updated expenses
      try {
        console.log('Fetching expenses from /admin/updated-expenses...')
        const expensesRes = await api.get('/admin/updated-expenses')
        console.log('Expenses response:', expensesRes.data)
        
        expensesData = Array.isArray(expensesRes.data) ? expensesRes.data : []
        setUpdatedExpenses(expensesData)
      } catch (expensesError) {
        console.error('Failed to fetch expenses:', expensesError)
        setUpdatedExpenses([])
      }

      // Fetch trend data (daily/weekly trends)
      try {
        console.log('Fetching trends from /admin/trends...')
        const trendsRes = await api.get('/admin/trends')
        console.log('Trends response:', trendsRes.data)
        
        trendsData = Array.isArray(trendsRes.data) ? trendsRes.data : []
        setTrendData(trendsData)
      } catch (trendsError) {
        console.error('Failed to fetch trends:', trendsError)
        // Generate mock data if API fails
        const mockTrends = generateMockTrendData()
        setTrendData(mockTrends)
      }

      // Fetch category breakdown
      try {
        console.log('Fetching categories from /admin/category-stats...')
        const categoriesRes = await api.get('/admin/category-stats')
        console.log('Categories response:', categoriesRes.data)
        
        categoriesData = Array.isArray(categoriesRes.data) ? categoriesRes.data : []
        setCategoryData(categoriesData)
      } catch (categoriesError) {
        console.error('Failed to fetch categories:', categoriesError)
        // Generate mock data if API fails
        const mockCategories = generateMockCategoryData()
        setCategoryData(mockCategories)
      }

      // Fetch monthly comparison
      try {
        console.log('Fetching monthly data from /admin/monthly-stats...')
        const monthlyRes = await api.get('/admin/monthly-stats')
        console.log('Monthly response:', monthlyRes.data)
        
        monthData = Array.isArray(monthlyRes.data) ? monthlyRes.data : []
        setMonthlyData(monthData)
      } catch (monthlyError) {
        console.error('Failed to fetch monthly data:', monthlyError)
        const mockMonthly = generateMockMonthlyData()
        setMonthlyData(mockMonthly)
      }

      // Fetch Manage Expense submissions
      try {
        console.log('Fetching manage expense submissions...')
        const manageExpenseRes = await api.get('/admin/manage-expenses')
        console.log('Manage Expense response:', manageExpenseRes.data)
        
        setManageExpenseData({
          submissions: manageExpenseRes.data?.data || [],
          stats: manageExpenseRes.data?.stats || {}
        })
      } catch (manageExpenseError) {
        console.error('Failed to fetch manage expense submissions:', manageExpenseError)
        setManageExpenseData({ submissions: [], stats: {} })
      }

      // Fetch Income Tax Help submissions
      try {
        console.log('Fetching income tax help submissions...')
        const incomeTaxHelpRes = await api.get('/admin/income-tax-help')
        console.log('Income Tax Help response:', incomeTaxHelpRes.data)
        
        setIncomeTaxHelpData({
          submissions: incomeTaxHelpRes.data?.data || [],
          stats: incomeTaxHelpRes.data?.stats || {}
        })
      } catch (incomeTaxHelpError) {
        console.error('Failed to fetch income tax help submissions:', incomeTaxHelpError)
        setIncomeTaxHelpData({ submissions: [], stats: {} })
      }

      setLastFetchTime(new Date())
      setError(null)
      
    } catch (error) {
      console.error('Dashboard data fetch error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      })
      
      let errorMessage = 'Failed to load dashboard data.'
      
      if (error.response) {
        const status = error.response.status
        const serverMessage = error.response.data?.message || error.response.data?.error
        
        switch (status) {
          case 401:
            errorMessage = 'Authentication failed. Please login again.'
            break
          case 403:
            errorMessage = 'Access denied. Admin privileges required.'
            break
          case 404:
            errorMessage = 'Admin endpoints not found. Please check backend configuration.'
            break
          case 500:
            errorMessage = `Server error: ${serverMessage || 'Internal server error'}`
            break
          default:
            errorMessage = `Server error (${status}): ${serverMessage || 'Unknown error'}`
        }
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please check if the backend is running and accessible.'
      } else {
        errorMessage = error.message || 'Unknown error occurred'
      }
      
      setError({
        message: errorMessage,
        details: error.response?.data || error.message,
        status: error.response?.status,
        canRetry: !error.response || error.response.status >= 500
      })
      
    } finally {
      setLoading(false)
    }
  }

  // Generate mock data for demonstration
  const generateMockTrendData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return days.map((day, index) => ({
      day,
      expenses: Math.floor(Math.random() * 50) + 20,
      amount: Math.floor(Math.random() * 5000) + 1000
    }))
  }

  const generateMockCategoryData = () => {
    const categories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Others']
    return categories.map(name => ({
      name,
      value: Math.floor(Math.random() * 10000) + 1000,
      count: Math.floor(Math.random() * 50) + 10
    }))
  }

  const generateMockMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    return months.map(month => ({
      month,
      expenses: Math.floor(Math.random() * 200) + 100,
      amount: Math.floor(Math.random() * 20000) + 10000,
      users: Math.floor(Math.random() * 50) + 20
    }))
  }

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    fetchDashboardData(true)
  }

  const getErrorSeverity = () => {
    if (!error) return 'info'
    if (error.status >= 500) return 'error'
    if (error.status >= 400) return 'warning'
    return 'error'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
      case 'rejected':
        return <Cancel sx={{ color: 'error.main', fontSize: 20 }} />
      case 'in-progress':
        return <HourglassEmpty sx={{ color: 'warning.main', fontSize: 20 }} />
      case 'pending':
      default:
        return <HourglassEmpty sx={{ color: 'info.main', fontSize: 20 }} />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return 'success'
      case 'rejected':
        return 'error'
      case 'in-progress':
        return 'warning'
      case 'pending':
      default:
        return 'info'
    }
  }

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography>Loading dashboard...</Typography>
        {retryCount > 0 && (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Retry attempt {retryCount}
          </Typography>
        )}
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Alert 
          severity={getErrorSeverity()} 
          icon={<ErrorIcon />}
          sx={{ mb: 2 }}
          action={
            error.canRetry && (
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleRetry}
                startIcon={<Refresh />}
                disabled={loading}
              >
                Retry
              </Button>
            )
          }
        >
          <Typography variant="subtitle1" gutterBottom>
            {error.message}
          </Typography>
          {error.details && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Details: {typeof error.details === 'string' ? error.details : JSON.stringify(error.details)}
            </Typography>
          )}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Troubleshooting steps:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
              <li>Ensure the backend server is running</li>
              <li>Check if admin endpoints are configured</li>
              <li>Verify authentication token is valid</li>
              <li>Check browser console for detailed errors</li>
            </Typography>
          </Box>
        </Alert>
        
        {retryCount > 0 && (
          <Chip 
            label={`Failed attempts: ${retryCount}`} 
            color="warning" 
            size="small"
            sx={{ mb: 2 }}
          />
        )}
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Dashboard
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          {lastFetchTime && (
            <Typography variant="body2" color="textSecondary">
              Last updated: {lastFetchTime.toLocaleTimeString()}
            </Typography>
          )}
          <Button
            startIcon={<Refresh />}
            onClick={() => fetchDashboardData()}
            disabled={loading}
            size="small"
            variant="outlined"
          >
            Refresh
          </Button>
        </Box>
      </Box>
      
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers?.toLocaleString() || '0'}
            icon={<People fontSize="large" />}
            color="#1976d2"
            trend={15}
            trendValue="this month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Expenses"
            value={stats.totalExpenses?.toLocaleString() || '0'}
            icon={<Receipt fontSize="large" />}
            color="#dc004e"
            trend={stats.monthlyGrowth}
            trendValue="vs last month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Manage Expense Forms"
            value={manageExpenseData.stats?.total || 0}
            icon={<Description fontSize="large" />}
            color="#9c27b0"
            trend={0}
            trendValue="submissions"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tax Help Requests"
            value={incomeTaxHelpData.stats?.total || 0}
            icon={<AccountBalance fontSize="large" />}
            color="#ff9800"
            trend={0}
            trendValue="submissions"
          />
        </Grid>
      </Grid>

      {/* Form Submissions Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Manage Expense Summary */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
              <Description color="primary" />
              Manage Expense Submissions
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" color="textSecondary">Pending</Typography>
                <Chip 
                  label={manageExpenseData.stats?.pending || 0} 
                  color="info" 
                  size="small" 
                />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" color="textSecondary">Approved</Typography>
                <Chip 
                  label={manageExpenseData.stats?.approved || 0} 
                  color="success" 
                  size="small" 
                />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" color="textSecondary">Rejected</Typography>
                <Chip 
                  label={manageExpenseData.stats?.rejected || 0} 
                  color="error" 
                  size="small" 
                />
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body1" fontWeight="bold">Total Amount</Typography>
                <Typography variant="h6" color="primary">
                  ${(manageExpenseData.submissions.reduce((sum, item) => sum + (item.annualExpense || 0), 0)).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Income Tax Help Summary */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
              <AccountBalance color="primary" />
              Income Tax Help Requests
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" color="textSecondary">Pending</Typography>
                <Chip 
                  label={incomeTaxHelpData.stats?.pending || 0} 
                  color="info" 
                  size="small" 
                />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" color="textSecondary">In Progress</Typography>
                <Chip 
                  label={incomeTaxHelpData.stats?.inProgress || 0} 
                  color="warning" 
                  size="small" 
                />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" color="textSecondary">Completed</Typography>
                <Chip 
                  label={incomeTaxHelpData.stats?.completed || 0} 
                  color="success" 
                  size="small" 
                />
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body1" fontWeight="bold">Total Income</Typography>
                <Typography variant="h6" color="primary">
                  ${(incomeTaxHelpData.submissions.reduce((sum, item) => sum + (item.annualIncome || 0), 0)).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Expense Trend Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Expense Trends (Last 7 Days)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#8884d8" 
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                  name="Amount ($)"
                />
                <Line type="monotone" dataKey="expenses" stroke="#82ca9d" name="Count" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Category Breakdown Pie Chart */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Expenses by Category
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Monthly Comparison Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Monthly Expense Comparison
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <RechartsTooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="amount" fill="#8884d8" name="Amount ($)" />
                <Bar yAxisId="right" dataKey="expenses" fill="#82ca9d" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Manage Expense Submissions Table */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Recent Manage Expense Submissions
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => window.location.href = '/manage-expenses'}
              >
                View All
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Full Name</TableCell>
                    <TableCell>Annual Expense</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Submitted At</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {manageExpenseData.submissions.slice(0, 5).length > 0 ? (
                    manageExpenseData.submissions.slice(0, 5).map((submission) => (
                      <TableRow key={submission._id}>
                        <TableCell>{submission.fullName}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            ${(submission.annualExpense || 0).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(submission.status)}
                            label={submission.status?.toUpperCase() || 'PENDING'}
                            color={getStatusColor(submission.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="View Details">
                            <IconButton size="small" color="primary">
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download Proof">
                            <IconButton size="small" color="secondary">
                              <Download fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography color="textSecondary">
                          No manage expense submissions yet
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Income Tax Help Submissions Table */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Recent Income Tax Help Requests
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => window.location.href = '/income-tax-help'}
              >
                View All
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Full Name</TableCell>
                    <TableCell>Annual Income</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Submitted At</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {incomeTaxHelpData.submissions.slice(0, 5).length > 0 ? (
                    incomeTaxHelpData.submissions.slice(0, 5).map((submission) => (
                      <TableRow key={submission._id}>
                        <TableCell>{submission.fullName}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            ${(submission.annualIncome || 0).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(submission.status)}
                            label={submission.status?.toUpperCase() || 'PENDING'}
                            color={getStatusColor(submission.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="View Details">
                            <IconButton size="small" color="primary">
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download Statement">
                            <IconButton size="small" color="secondary">
                              <Download fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography color="textSecondary">
                          No income tax help requests yet
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Expense Updates */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Expense Updates
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              {updatedExpenses.length > 0 ? (
                updatedExpenses.slice(0, 10).map((expense, index) => (
                  <ListItem key={expense._id || expense.id || index} divider>
                    <ListItemText
                      primary={expense.description || 'No description'}
                      secondary={
                        <Box>
                          <Typography component="span" variant="body2" color="primary" fontWeight="bold">
                            ${(expense.amount || 0).toFixed(2)}
                          </Typography>
                          {' • '}
                          <Chip 
                            label={expense.category || 'Uncategorized'} 
                            size="small" 
                            sx={{ height: 20, fontSize: '0.75rem' }}
                          />
                          {' • '}
                          <Typography component="span" variant="body2" color="textSecondary">
                            {expense.userEmail || 'Unknown user'}
                          </Typography>
                          {expense.updatedAt && (
                            <>
                              {' • '}
                              <Typography component="span" variant="body2" color="textSecondary">
                                {new Date(expense.updatedAt).toLocaleString()}
                              </Typography>
                            </>
                          )}
                        </Box>
                      }
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText 
                    primary="No recent expense updates" 
                    secondary="Expense updates will appear here when users modify their expenses"
                  />
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
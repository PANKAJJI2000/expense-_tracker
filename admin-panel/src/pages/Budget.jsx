import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Tooltip,
  LinearProgress,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar
} from '@mui/material'
import {
  Search,
  Refresh,
  Visibility,
  Delete,
  AccountBalanceWallet,
  TrendingUp,
  People,
  CalendarMonth,
  FilterList,
  Add,
  Edit,
  Save
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import api from '../config/api'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="h2">
            {value}
          </Typography>
        </Box>
        <Box sx={{ color, opacity: 0.8 }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
)

const Budget = () => {
  const navigate = useNavigate()
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBudget, setSelectedBudget] = useState(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [filterMonth, setFilterMonth] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [stats, setStats] = useState({
    totalBudgets: 0,
    totalAmount: 0,
    avgBudget: 0,
    usersWithBudget: 0
  })
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editBudget, setEditBudget] = useState(null)
  const [editLoading, setEditLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  useEffect(() => {
    fetchBudgets()
  }, [])

  const fetchBudgets = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching budgets from /admin/budgets...')
      const response = await api.get('/admin/budgets')
      console.log('Budgets response:', response.data)
      
      // Handle different response formats
      let budgetData = []
      if (response.data?.data) {
        budgetData = response.data.data
      } else if (Array.isArray(response.data)) {
        budgetData = response.data
      } else if (response.data?.budgets) {
        budgetData = response.data.budgets
      }
      
      setBudgets(Array.isArray(budgetData) ? budgetData : [])
      
      // Calculate stats
      if (Array.isArray(budgetData) && budgetData.length > 0) {
        const totalAmount = budgetData.reduce((sum, b) => sum + (b.totalBudget || 0), 0)
        const uniqueUsers = new Set(budgetData.map(b => b.userId?._id || b.userId)).size
        
        setStats({
          totalBudgets: budgetData.length,
          totalAmount,
          avgBudget: Math.round(totalAmount / budgetData.length),
          usersWithBudget: uniqueUsers
        })
      } else {
        setStats({
          totalBudgets: 0,
          totalAmount: 0,
          avgBudget: 0,
          usersWithBudget: 0
        })
      }
    } catch (err) {
      console.error('Failed to fetch budgets:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load budgets'
      setError(errorMessage)
      setBudgets([])
      
      // Show more details in console
      if (err.response) {
        console.error('Error response:', err.response.status, err.response.data)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleViewBudget = (budget) => {
    setSelectedBudget(budget)
    setViewDialogOpen(true)
  }

  const handleDeleteClick = (budget) => {
    setSelectedBudget(budget)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedBudget) return
    
    try {
      await api.delete(`/admin/budgets/${selectedBudget._id}`)
      setBudgets(budgets.filter(b => b._id !== selectedBudget._id))
      setDeleteDialogOpen(false)
      setSelectedBudget(null)
      fetchBudgets() // Refresh stats
    } catch (err) {
      console.error('Failed to delete budget:', err)
      setError(err.response?.data?.message || 'Failed to delete budget')
    }
  }

  const handleEditClick = (budget) => {
    setEditBudget({
      ...budget,
      totalBudget: budget.totalBudget || 0,
      notes: budget.notes || '',
      categories: budget.categories || []
    })
    setEditDialogOpen(true)
  }

  const handleEditSave = async () => {
    if (!editBudget) return
    
    try {
      setEditLoading(true)
      
      const updateData = {
        totalBudget: editBudget.totalBudget,
        notes: editBudget.notes,
        categories: editBudget.categories
      }
      
      await api.put(`/admin/budgets/${editBudget._id}`, updateData)
      
      setSnackbar({ 
        open: true, 
        message: 'Budget updated successfully!', 
        severity: 'success' 
      })
      setEditDialogOpen(false)
      setEditBudget(null)
      fetchBudgets() // Refresh data
    } catch (err) {
      console.error('Failed to update budget:', err)
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.message || 'Failed to update budget', 
        severity: 'error' 
      })
    } finally {
      setEditLoading(false)
    }
  }

  const handleCategoryChange = (index, field, value) => {
    const updatedCategories = [...editBudget.categories]
    updatedCategories[index] = {
      ...updatedCategories[index],
      [field]: field === 'amount' || field === 'spent' ? Number(value) || 0 : value
    }
    setEditBudget({ ...editBudget, categories: updatedCategories })
  }

  const handleAddCategory = () => {
    setEditBudget({
      ...editBudget,
      categories: [
        ...editBudget.categories,
        { name: '', amount: 0, spent: 0, color: '#1976d2' }
      ]
    })
  }

  const handleRemoveCategory = (index) => {
    const updatedCategories = editBudget.categories.filter((_, i) => i !== index)
    setEditBudget({ ...editBudget, categories: updatedCategories })
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const filteredBudgets = budgets.filter(budget => {
    const userName = budget.userId?.name || ''
    const userEmail = budget.userId?.email || ''
    const matchesSearch = 
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesMonth = !filterMonth || budget.month === parseInt(filterMonth)
    const matchesYear = !filterYear || budget.year === parseInt(filterYear)
    
    return matchesSearch && matchesMonth && matchesYear
  })

  const paginatedBudgets = filteredBudgets.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  const calculateSpentPercentage = (budget) => {
    if (!budget.categories || budget.categories.length === 0) return 0
    const totalSpent = budget.categories.reduce((sum, cat) => sum + (cat.spent || 0), 0)
    return budget.totalBudget > 0 ? Math.min((totalSpent / budget.totalBudget) * 100, 100) : 0
  }

  const getSpentColor = (percentage) => {
    if (percentage >= 90) return 'error'
    if (percentage >= 70) return 'warning'
    return 'success'
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography>Loading budgets...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Budget Management
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            startIcon={<Refresh />}
            onClick={fetchBudgets}
            variant="outlined"
            size="small"
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          <Typography variant="subtitle2">{error}</Typography>
          <Typography variant="caption" color="textSecondary">
            Make sure the backend server is running and budget endpoints are configured.
          </Typography>
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Budgets"
            value={stats.totalBudgets}
            icon={<AccountBalanceWallet fontSize="large" />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Budget Amount"
            value={`₹${stats.totalAmount.toLocaleString()}`}
            icon={<TrendingUp fontSize="large" />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Average Budget"
            value={`₹${stats.avgBudget.toLocaleString()}`}
            icon={<CalendarMonth fontSize="large" />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Users with Budget"
            value={stats.usersWithBudget}
            icon={<People fontSize="large" />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by user name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Month</InputLabel>
              <Select
                value={filterMonth}
                label="Month"
                onChange={(e) => setFilterMonth(e.target.value)}
              >
                <MenuItem value="">All Months</MenuItem>
                {MONTHS.map((month, index) => (
                  <MenuItem key={index} value={index + 1}>{month}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Year</InputLabel>
              <Select
                value={filterYear}
                label="Year"
                onChange={(e) => setFilterYear(e.target.value)}
              >
                <MenuItem value="">All Years</MenuItem>
                {years.map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box display="flex" gap={1}>
              <Button
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchTerm('')
                  setFilterMonth('')
                  setFilterYear('')
                }}
                size="small"
                variant="text"
              >
                Clear Filters
              </Button>
              <Button
                variant="contained"
                size="small"
                color="primary"
                startIcon={<AccountBalanceWallet />}
                onClick={() => navigate('/budgets')}
              >
                Manage All
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Budgets Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Month/Year</TableCell>
                <TableCell align="right">Total Budget</TableCell>
                <TableCell>Categories</TableCell>
                <TableCell>Spent Progress</TableCell>
                <TableCell>Currency</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedBudgets.length > 0 ? (
                paginatedBudgets.map((budget) => {
                  const spentPercentage = calculateSpentPercentage(budget)
                  return (
                    <TableRow key={budget._id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {budget.userId?.name || 'Unknown User'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {budget.userId?.email || 'No email'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${MONTHS[(budget.month || 1) - 1]} ${budget.year || ''}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" fontWeight="bold" color="primary">
                          ₹{(budget.totalBudget || 0).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${budget.categories?.length || 0} categories`}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 100 }}>
                            <LinearProgress
                              variant="determinate"
                              value={spentPercentage}
                              color={getSpentColor(spentPercentage)}
                            />
                          </Box>
                          <Typography variant="caption">
                            {spentPercentage.toFixed(0)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={budget.currency || 'INR'} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewBudget(budget)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Budget">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleEditClick(budget)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(budget)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box sx={{ py: 4 }}>
                      <AccountBalanceWallet sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography color="textSecondary">
                        No budgets found
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Budgets will appear here when users create them
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredBudgets.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* View Budget Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Budget Details - {selectedBudget && `${MONTHS[(selectedBudget.month || 1) - 1]} ${selectedBudget.year}`}
        </DialogTitle>
        <DialogContent dividers>
          {selectedBudget && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">User</Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedBudget.userId?.name || 'Unknown'}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {selectedBudget.userId?.email}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Total Budget</Typography>
                <Typography variant="h5" color="primary" gutterBottom>
                  ₹{(selectedBudget.totalBudget || 0).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>Category Breakdown</Typography>
                {selectedBudget.categories?.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Budget</TableCell>
                          <TableCell align="right">Spent</TableCell>
                          <TableCell>Progress</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedBudget.categories.map((cat, index) => {
                          const catPercentage = cat.amount > 0 ? ((cat.spent || 0) / cat.amount) * 100 : 0
                          return (
                            <TableRow key={index}>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Box
                                    sx={{
                                      width: 12,
                                      height: 12,
                                      borderRadius: '50%',
                                      backgroundColor: cat.color || '#1976d2'
                                    }}
                                  />
                                  {cat.name}
                                </Box>
                              </TableCell>
                              <TableCell align="right">₹{(cat.amount || 0).toLocaleString()}</TableCell>
                              <TableCell align="right">₹{(cat.spent || 0).toLocaleString()}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={Math.min(catPercentage, 100)}
                                    color={getSpentColor(catPercentage)}
                                    sx={{ width: 80 }}
                                  />
                                  <Typography variant="caption">
                                    {catPercentage.toFixed(0)}%
                                  </Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="textSecondary">No categories defined</Typography>
                )}
              </Grid>
              {selectedBudget.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Notes</Typography>
                  <Typography variant="body2">{selectedBudget.notes}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Budget Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => !editLoading && setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Edit color="primary" />
            Manage Budget - {editBudget && `${MONTHS[(editBudget.month || 1) - 1]} ${editBudget.year}`}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {editBudget && (
            <Grid container spacing={3}>
              {/* User Info (Read-only) */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">User</Typography>
                <Typography variant="body1">
                  {editBudget.userId?.name || 'Unknown'}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {editBudget.userId?.email}
                </Typography>
              </Grid>

              {/* Total Budget */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Total Budget (₹)"
                  type="number"
                  value={editBudget.totalBudget}
                  onChange={(e) => setEditBudget({ 
                    ...editBudget, 
                    totalBudget: Number(e.target.value) || 0 
                  })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>
                  }}
                />
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={2}
                  value={editBudget.notes}
                  onChange={(e) => setEditBudget({ ...editBudget, notes: e.target.value })}
                  placeholder="Add notes about this budget..."
                />
              </Grid>

              {/* Categories */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Categories</Typography>
                  <Button
                    size="small"
                    startIcon={<Add />}
                    onClick={handleAddCategory}
                    variant="outlined"
                  >
                    Add Category
                  </Button>
                </Box>
                
                {editBudget.categories?.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Category Name</TableCell>
                          <TableCell align="right">Budget (₹)</TableCell>
                          <TableCell align="right">Spent (₹)</TableCell>
                          <TableCell>Color</TableCell>
                          <TableCell align="center">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {editBudget.categories.map((cat, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <TextField
                                size="small"
                                value={cat.name}
                                onChange={(e) => handleCategoryChange(index, 'name', e.target.value)}
                                placeholder="Category name"
                                fullWidth
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={cat.amount}
                                onChange={(e) => handleCategoryChange(index, 'amount', e.target.value)}
                                InputProps={{
                                  startAdornment: <InputAdornment position="start">₹</InputAdornment>
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={cat.spent || 0}
                                onChange={(e) => handleCategoryChange(index, 'spent', e.target.value)}
                                InputProps={{
                                  startAdornment: <InputAdornment position="start">₹</InputAdornment>
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <input
                                type="color"
                                value={cat.color || '#1976d2'}
                                onChange={(e) => handleCategoryChange(index, 'color', e.target.value)}
                                style={{ width: 40, height: 30, border: 'none', cursor: 'pointer' }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveCategory(index)}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="textSecondary">
                      No categories defined. Click "Add Category" to create one.
                    </Typography>
                  </Paper>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setEditDialogOpen(false)} 
            disabled={editLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleEditSave} 
            variant="contained" 
            color="primary"
            disabled={editLoading}
            startIcon={editLoading ? <CircularProgress size={16} /> : <Save />}
          >
            {editLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this budget for{' '}
            <strong>
              {selectedBudget && `${MONTHS[(selectedBudget.month || 1) - 1]} ${selectedBudget.year}`}
            </strong>
            ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default Budget

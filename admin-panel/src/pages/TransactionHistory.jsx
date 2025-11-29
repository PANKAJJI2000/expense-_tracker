import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  IconButton,
  TextField,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar
} from '@mui/material'
import { Delete, Visibility, Refresh } from '@mui/icons-material'
import api from '../config/api'

const TransactionHistory = () => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  })
  const [page, setPage] = useState(1)
  const [rowsPerPage] = useState(10)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  })

  useEffect(() => {
    fetchHistory()
  }, [searchTerm, dateRange, typeFilter, categoryFilter])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (typeFilter) params.append('type', typeFilter)
      if (categoryFilter) params.append('category', categoryFilter)
      if (dateRange.start) params.append('startDate', dateRange.start)
      if (dateRange.end) params.append('endDate', dateRange.end)
      
      
      console.log('Fetching transaction history with params:', params.toString())
      
      // Try multiple endpoints to ensure compatibility
      let response
      try {
        // response = await api.get(`/transaction-history?${params}`)
        response = await api.get(`/admin/transactions?${params}`)
      } catch (err) {
        console.log('Trying admin endpoint...')
        response = await api.get(`/admin/transaction-history?${params}`)
      }
      
      console.log('Transaction history response:', response.data)
      
      // Handle different response formats
      let historyData = []
      if (Array.isArray(response.data)) {
        historyData = response.data
      } else if (response.data.histories) {
        historyData = response.data.histories
      } else if (response.data.data) {
        historyData = response.data.data
      }
      
      console.log('Processed history data:', historyData.length, 'items')
      setHistory(historyData)
      
      if (historyData.length > 0) {
        setSnackbar({
          open: true,
          message: `${historyData.length} transaction history items loaded`,
          severity: 'success'
        })
      } else {
        setSnackbar({
          open: true,
          message: 'No transaction history found',
          severity: 'info'
        })
      }
    } catch (error) {
      console.error('Failed to fetch transaction history:', error)
      console.error('Error details:', error.response?.data)
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to load transaction history',
        severity: 'error'
      })
      setHistory([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (historyId) => {
    if (window.confirm('Are you sure you want to delete this history item?')) {
      try {
        await api.delete(`/admin/transaction-history/${historyId}`)
        setSnackbar({
          open: true,
          message: 'History item deleted successfully',
          severity: 'success'
        })
        fetchHistory()
      } catch (error) {
        console.error('Failed to delete history item:', error)
        let errorMsg = 'Failed to delete history item'
        if (error.response) {
          errorMsg = error.response.data?.error ||
            `Error ${error.response.status}: ${error.response.statusText}`
        } else if (error.message) {
          errorMsg = error.message
        }
        setSnackbar({
          open: true,
          message: errorMsg,
          severity: 'error'
        })
      }
    }
  }

  const handleRefresh = () => {
    setSearchTerm('')
    setTypeFilter('')
    setCategoryFilter('')
    setDateRange({ start: '', end: '' })
    fetchHistory()
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const paginatedHistory = Array.isArray(history)
    ? history.slice((page - 1) * rowsPerPage, page * rowsPerPage)
    : []

  const totalPages = Math.ceil((history?.length || 0) / rowsPerPage)

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Transaction History
        </Typography>
        <IconButton onClick={handleRefresh} color="primary">
          <Refresh />
        </IconButton>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <TextField
            label="Search history..."
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              label="Type"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="income">Income</MenuItem>
              <MenuItem value="expense">Expense</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="food">Food</MenuItem>
              <MenuItem value="transport">Transport</MenuItem>
              <MenuItem value="shopping">Shopping</MenuItem>
              <MenuItem value="salary">Salary</MenuItem>
              <MenuItem value="investment">Investment</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2.5}>
          <TextField
            label="Start Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={2.5}>
          <TextField
            label="End Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          />
        </Grid>
      </Grid>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Item/Description</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : paginatedHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="textSecondary">No transaction history found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedHistory.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell sx={{ fontSize: '0.75rem', maxWidth: 120 }}>
                      {item._id?.substring(0, 8) || 'N/A'}...
                    </TableCell>
                    <TableCell>{item.item || item.title || item.description || 'N/A'}</TableCell>
                    <TableCell>
                      {item.type ? (
                        <Chip
                          label={item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                          color={item.type === 'income' ? 'success' : 'error'}
                          size="small"
                        />
                      ) : (
                        <Chip label="N/A" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.category || 'uncategorized'}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        color={item.type === 'income' ? 'success.main' : item.type === 'expense' ? 'error.main' : 'text.primary'}
                        fontWeight="bold"
                      >
                        {item.type === 'income' ? '+' : item.type === 'expense' ? '-' : ''}₹
                        {typeof item.amount === 'number' ? item.amount.toFixed(2) : '0.00'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {item.userId?.name || item.userId?.email || (typeof item.userId === 'string' ? item.userId.substring(0, 8) + '...' : 'N/A')}
                    </TableCell>
                    <TableCell>
                      {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleDelete(item._id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {totalPages > 1 && (
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
            sx={{ p: 2, display: 'flex', justifyContent: 'center' }}
          />
        )}
      </Paper>
                    
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
                    
export default TransactionHistory
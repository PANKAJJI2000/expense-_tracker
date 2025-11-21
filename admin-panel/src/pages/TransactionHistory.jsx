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
      
      const response = await api.get(`/admin/transaction-history?${params}`)
      setHistory(response.data.histories || response.data || [])
      
      setSnackbar({
        open: true,
        message: 'Transaction history loaded successfully',
        severity: 'success'
      })
    } catch (error) {
      console.error('Failed to fetch transaction history:', error)
      setSnackbar({
        open: true,
        message: 'Failed to load transaction history',
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
        setSnackbar({
          open: true,
          message: 'Failed to delete history item',
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
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Note</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : paginatedHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography color="textSecondary">No transaction history found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedHistory.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell sx={{ fontSize: '0.75rem', maxWidth: 120 }}>
                      {item._id}
                    </TableCell>
                    <TableCell>{item.title || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.type || 'N/A'}
                        color={item.type === 'income' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{item.category || 'N/A'}</TableCell>
                    <TableCell>
                      <Typography
                        color={item.type === 'income' ? 'success.main' : 'error.main'}
                        fontWeight="bold"
                      >
                        {item.type === 'income' ? '+' : '-'}${item.amount?.toFixed(2) || '0.00'}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.userId?.name || item.userId?.email || 'N/A'}</TableCell>
                    <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.note || '-'}
                    </TableCell>
                    <TableCell>
                      {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <IconButton size="small" title="View Details">
                          <Visibility />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleDelete(item._id)} 
                          size="small"
                          title="Delete"
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(event, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default TransactionHistory

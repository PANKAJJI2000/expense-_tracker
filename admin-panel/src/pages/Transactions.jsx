import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Chip,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material'
import { Edit, Delete, Visibility, Refresh } from '@mui/icons-material'
import api from '../config/api'

const Transactions = () => {
  const [transactions, setTransactions] = useState([])
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
    fetchTransactions()
  }, [searchTerm, dateRange, typeFilter, categoryFilter])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (typeFilter) params.append('type', typeFilter)
      if (categoryFilter) params.append('category', categoryFilter)
      if (dateRange.start) params.append('startDate', dateRange.start)
      if (dateRange.end) params.append('endDate', dateRange.end)
      
      const response = await api.get(`/admin/transactions?${params}`)
      console.log('Transactions response:', response.data)
      setTransactions(response.data.transactions || response.data || [])
      
      setSnackbar({
        open: true,
        message: 'Transactions loaded successfully',
        severity: 'success'
      })
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
      setSnackbar({
        open: true,
        message: 'Failed to load transactions',
        severity: 'error'
      })
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction? This will also remove it from transaction history.')) {
      try {
        await api.delete(`/admin/transactions/${transactionId}`)
        setSnackbar({
          open: true,
          message: 'Transaction deleted successfully from both transaction and history',
          severity: 'success'
        })
        fetchTransactions()
      } catch (error) {
        console.error('Failed to delete transaction:', error)
        setSnackbar({
          open: true,
          message: 'Failed to delete transaction',
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
    fetchTransactions()
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const paginatedTransactions = Array.isArray(transactions) 
    ? transactions.slice((page - 1) * rowsPerPage, page * rowsPerPage)
    : []

  const totalPages = Math.ceil((transactions?.length || 0) / rowsPerPage)

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Transactions Management
        </Typography>
        <IconButton onClick={handleRefresh} color="primary">
          <Refresh />
        </IconButton>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <TextField
            label="Search transactions..."
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
                <TableCell>Payment Method</TableCell>
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
              ) : paginatedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography color="textSecondary">No transactions found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTransactions.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell sx={{ fontSize: '0.75rem', maxWidth: 120 }}>
                      {transaction._id?.substring(0, 8) || 'N/A'}...
                    </TableCell>
                    <TableCell>{transaction.item || transaction.description || 'N/A'}</TableCell>
                    <TableCell>
                      {transaction.type ? (
                        <Chip
                          label={transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                          color={transaction.type === 'income' ? 'success' : 'error'}
                          size="small"
                        />
                      ) : (
                        <Chip label="N/A" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={transaction.category || 'uncategorized'} 
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        color={transaction.type === 'income' ? 'success.main' : transaction.type === 'expense' ? 'error.main' : 'text.primary'}
                        fontWeight="bold"
                      >
                        {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}₹
                        {typeof transaction.amount === 'number' ? transaction.amount.toFixed(2) : '0.00'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {transaction.userId?.name || transaction.userId?.email || (typeof transaction.userId === 'string' ? transaction.userId.substring(0, 8) + '...' : 'N/A')}
                    </TableCell>
                    <TableCell>
                      {transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={transaction.paymentMethod || 'cash'} 
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <IconButton size="small" title="View Details">
                          <Visibility />
                        </IconButton>
                        <IconButton size="small" title="Edit">
                          <Edit />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleDelete(transaction._id)} 
                          size="small"
                          title="Delete (removes from history too)"
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

export default Transactions

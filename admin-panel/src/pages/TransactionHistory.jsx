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
  CircularProgress
} from '@mui/material'
import { Delete, Visibility } from '@mui/icons-material'
import api from '../config/api'

const TransactionHistory = () => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  })
  const [page, setPage] = useState(1)
  const [rowsPerPage] = useState(10)

  useEffect(() => {
    fetchHistory()
  }, [searchTerm, dateRange])

  const fetchHistory = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (dateRange.start) params.append('startDate', dateRange.start)
      if (dateRange.end) params.append('endDate', dateRange.end)
      
      const response = await api.get(`/admin/transaction-history?${params}`)
      setHistory(response.data)
    } catch (error) {
      console.error('Failed to fetch transaction history:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (historyId) => {
    if (window.confirm('Are you sure you want to delete this history item?')) {
      try {
        await api.delete(`/admin/transaction-history/${historyId}`)
        fetchHistory()
      } catch (error) {
        console.error('Failed to delete history item:', error)
      }
    }
  }

  const paginatedHistory = history.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  )

  const totalPages = Math.ceil(history.length / rowsPerPage)

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Transaction History
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            label="Search history..."
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Start Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={4}>
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
                <TableCell>Action</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Transaction ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedHistory.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell sx={{ fontSize: '0.75rem', maxWidth: 120 }}>
                      {item._id}
                    </TableCell>
                    <TableCell>{item.action}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.userEmail}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', maxWidth: 120 }}>
                      {item.transactionId?._id || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {new Date(item.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(item._id)} size="small">
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
        
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(event, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      </Paper>
    </Box>
  )
}

export default TransactionHistory

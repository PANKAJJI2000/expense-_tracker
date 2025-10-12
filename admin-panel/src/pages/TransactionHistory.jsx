import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  IconButton,
  TextField,
  Grid,
  Chip
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
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

  const columns = [
    { field: '_id', headerName: 'ID', width: 220 },
    { field: 'action', headerName: 'Action', width: 150 },
    { field: 'description', headerName: 'Description', width: 250 },
    { field: 'userEmail', headerName: 'User', width: 200 },
    {
      field: 'transactionId',
      headerName: 'Transaction ID',
      width: 200,
      valueGetter: (params) => params.row.transactionId?._id || 'N/A',
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      width: 180,
      valueFormatter: (params) => new Date(params.value).toLocaleString(),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box>
          <IconButton size="small">
            <Visibility />
          </IconButton>
          <IconButton onClick={() => handleDelete(params.row._id)} size="small">
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ]

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

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={history}
          columns={columns}
          getRowId={(row) => row._id}
          loading={loading}
          pageSizeOptions={[5, 10, 25]}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
        />
      </Paper>
    </Box>
  )
}

export default TransactionHistory

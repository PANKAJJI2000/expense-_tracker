import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Chip,
  TextField,
  Grid
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { Edit, Delete, Visibility } from '@mui/icons-material'
import api from '../config/api'

const AutoExpenses = () => {
  const [autoExpenses, setAutoExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchAutoExpenses()
  }, [searchTerm])

  const fetchAutoExpenses = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await api.get(`/admin/auto-expenses?${params}`)
      setAutoExpenses(response.data)
    } catch (error) {
      console.error('Failed to fetch auto expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (autoExpenseId) => {
    if (window.confirm('Are you sure you want to delete this auto expense?')) {
      try {
        await api.delete(`/admin/auto-expenses/${autoExpenseId}`)
        fetchAutoExpenses()
      } catch (error) {
        console.error('Failed to delete auto expense:', error)
      }
    }
  }

  const columns = [
    { field: '_id', headerName: 'ID', width: 220 },
    { field: 'title', headerName: 'Title', width: 200 },
    { field: 'description', headerName: 'Description', width: 200 },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 120,
      valueFormatter: (params) => `$${params.value?.toFixed(2)}`,
    },
    { field: 'category', headerName: 'Category', width: 150 },
    { field: 'userEmail', headerName: 'User', width: 200 },
    {
      field: 'frequency',
      headerName: 'Frequency',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color="primary"
          size="small"
        />
      ),
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
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
          <IconButton size="small">
            <Edit />
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
        Auto Expenses Management
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Search auto expenses..."
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
      </Grid>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={autoExpenses}
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

export default AutoExpenses

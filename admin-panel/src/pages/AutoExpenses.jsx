import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Chip,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  CircularProgress
} from '@mui/material'
import { Edit, Delete, Visibility } from '@mui/icons-material'
import api from '../config/api'

const AutoExpenses = () => {
  const [autoExpenses, setAutoExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage] = useState(10)

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

  const paginatedAutoExpenses = autoExpenses.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  )

  const totalPages = Math.ceil(autoExpenses.length / rowsPerPage)

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

      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Frequency</TableCell>
                <TableCell>Status</TableCell>
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
              ) : (
                paginatedAutoExpenses.map((expense) => (
                  <TableRow key={expense._id}>
                    <TableCell sx={{ fontSize: '0.75rem', maxWidth: 120 }}>
                      {expense._id}
                    </TableCell>
                    <TableCell>{expense.title}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>${expense.amount?.toFixed(2)}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>{expense.userEmail}</TableCell>
                    <TableCell>
                      <Chip
                        label={expense.frequency}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={expense.isActive ? 'Active' : 'Inactive'}
                        color={expense.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(expense._id)} size="small">
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

export default AutoExpenses

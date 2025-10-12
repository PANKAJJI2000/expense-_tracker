import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  Chip
} from '@mui/material'
import { Edit, Delete, Add } from '@mui/icons-material'
import api from '../config/api'

const Categories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editCategory, setEditCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#1976d2'
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await api.get('/admin/categories')
      setCategories(response.data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (category) => {
    setEditCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#1976d2'
    })
    setOpenDialog(true)
  }

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await api.delete(`/admin/categories/${categoryId}`)
        fetchCategories()
      } catch (error) {
        console.error('Failed to delete category:', error)
      }
    }
  }

  const handleSave = async () => {
    try {
      if (editCategory) {
        await api.put(`/admin/categories/${editCategory._id}`, formData)
      } else {
        await api.post('/admin/categories', formData)
      }
      setOpenDialog(false)
      setEditCategory(null)
      setFormData({ name: '', description: '', color: '#1976d2' })
      fetchCategories()
    } catch (error) {
      console.error('Failed to save category:', error)
    }
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Categories Management</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
        >
          Add Category
        </Button>
      </Box>

      <Grid container spacing={3}>
        {categories.map((category) => (
          <Grid item xs={12} sm={6} md={4} key={category._id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {category.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {category.description}
                    </Typography>
                    <Chip
                      label={`${category.expenseCount || 0} expenses`}
                      size="small"
                      color="primary"
                    />
                  </Box>
                  <Box>
                    <IconButton onClick={() => handleEdit(category)} size="small">
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(category._id)} size="small">
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>
                <Box
                  sx={{
                    width: '100%',
                    height: 4,
                    backgroundColor: category.color || '#1976d2',
                    mt: 2,
                    borderRadius: 1
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Color"
            type="color"
            fullWidth
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Categories

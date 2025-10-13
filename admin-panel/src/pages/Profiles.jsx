import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  IconButton,
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

const Profiles = () => {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage] = useState(10)

  useEffect(() => {
    fetchProfiles()
  }, [searchTerm])

  const fetchProfiles = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await api.get(`/admin/profiles?${params}`)
      setProfiles(response.data)
    } catch (error) {
      console.error('Failed to fetch profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (profileId) => {
    if (window.confirm('Are you sure you want to delete this profile?')) {
      try {
        await api.delete(`/admin/profiles/${profileId}`)
        fetchProfiles()
      } catch (error) {
        console.error('Failed to delete profile:', error)
      }
    }
  }

  const paginatedProfiles = profiles.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  )

  const totalPages = Math.ceil(profiles.length / rowsPerPage)

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profiles Management
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Search profiles..."
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
                <TableCell>First Name</TableCell>
                <TableCell>Last Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>User Email</TableCell>
                <TableCell>Date of Birth</TableCell>
                <TableCell>Created</TableCell>
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
              ) : (
                paginatedProfiles.map((profile) => (
                  <TableRow key={profile._id}>
                    <TableCell sx={{ fontSize: '0.75rem', maxWidth: 120 }}>
                      {profile._id}
                    </TableCell>
                    <TableCell>{profile.firstName}</TableCell>
                    <TableCell>{profile.lastName}</TableCell>
                    <TableCell>{profile.phone}</TableCell>
                    <TableCell>{profile.userEmail}</TableCell>
                    <TableCell>
                      {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : ''}
                    </TableCell>
                    <TableCell>
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(profile._id)} size="small">
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

export default Profiles

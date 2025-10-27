import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  Button,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import {
  Refresh,
  Delete,
  Visibility,
  CleaningServices
} from '@mui/icons-material'
import api from '../services/api'

const Sessions = () => {
  const [sessions, setSessions] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalSessions, setTotalSessions] = useState(0)
  const [selectedSession, setSelectedSession] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const fetchSessions = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/admin/sessions?page=${page + 1}&limit=${rowsPerPage}`)
      
      if (response.data.success) {
        setSessions(response.data.data)
        setTotalSessions(response.data.pagination.totalSessions)
      } else {
        setError('Failed to fetch sessions')
      }
    } catch (err) {
      console.error('Error fetching sessions:', err)
      setError(err.response?.data?.error || 'Failed to fetch sessions')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/sessions/stats')
      if (response.data.success) {
        setStats(response.data.stats)
      }
    } catch (err) {
      console.error('Error fetching session stats:', err)
    }
  }

  const handleCleanupExpired = async () => {
    if (!window.confirm('Are you sure you want to delete all expired sessions?')) {
      return
    }

    try {
      const response = await api.delete('/admin/sessions/cleanup')
      if (response.data.success) {
        alert(`Successfully deleted ${response.data.deletedCount} expired sessions`)
        fetchSessions()
        fetchStats()
      }
    } catch (err) {
      console.error('Error cleaning up sessions:', err)
      alert('Failed to cleanup expired sessions')
    }
  }

  const handleViewDetails = (session) => {
    setSelectedSession(session)
    setDetailsOpen(true)
  }

  const handleCloseDetails = () => {
    setDetailsOpen(false)
    setSelectedSession(null)
  }

  useEffect(() => {
    fetchSessions()
    fetchStats()
  }, [page, rowsPerPage])

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString()
  }

  const getSessionStatus = (session) => {
    return session.isExpired ? 'Expired' : 'Active'
  }

  const getStatusColor = (session) => {
    return session.isExpired ? 'error' : 'success'
  }

  if (loading && !sessions.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Session Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<CleaningServices />}
            onClick={handleCleanupExpired}
            sx={{ mr: 1 }}
          >
            Cleanup Expired
          </Button>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={() => {
              fetchSessions()
              fetchStats()
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Sessions
                </Typography>
                <Typography variant="h4">
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Sessions
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.active}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Expired Sessions
                </Typography>
                <Typography variant="h4" color="error.main">
                  {stats.expired}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Unique Users
                </Typography>
                <Typography variant="h4">
                  {stats.uniqueUsers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Sessions Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Session ID</TableCell>
                  <TableCell>User Email</TableCell>
                  <TableCell>User Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Expires</TableCell>
                  <TableCell>Last Activity</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No sessions found
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session) => (
                    <TableRow key={session.sessionId}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {session.sessionId.toString().substring(0, 16)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {session.user?.email || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {session.user?.role || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getSessionStatus(session)}
                          color={getStatusColor(session)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {formatDate(session.expires)}
                      </TableCell>
                      <TableCell>
                        {formatDate(session.lastActivity)}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(session)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalSessions}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Session Details Dialog */}
      <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>Session Details</DialogTitle>
        <DialogContent>
          {selectedSession && (
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Session ID:</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 2 }}>
                {selectedSession.sessionId.toString()}
              </Typography>

              <Typography variant="subtitle2" color="textSecondary">Status:</Typography>
              <Chip
                label={getSessionStatus(selectedSession)}
                color={getStatusColor(selectedSession)}
                size="small"
                sx={{ mb: 2 }}
              />

              <Typography variant="subtitle2" color="textSecondary">User Information:</Typography>
              <Box sx={{ pl: 2, mb: 2 }}>
                <Typography variant="body2">Email: {selectedSession.user?.email || 'N/A'}</Typography>
                <Typography variant="body2">User ID: {selectedSession.user?.id || 'N/A'}</Typography>
                <Typography variant="body2">Role: {selectedSession.user?.role || 'N/A'}</Typography>
              </Box>

              <Typography variant="subtitle2" color="textSecondary">Timestamps:</Typography>
              <Box sx={{ pl: 2, mb: 2 }}>
                <Typography variant="body2">Expires: {formatDate(selectedSession.expires)}</Typography>
                <Typography variant="body2">Last Activity: {formatDate(selectedSession.lastActivity)}</Typography>
              </Box>

              {selectedSession.cookie && (
                <>
                  <Typography variant="subtitle2" color="textSecondary">Cookie Settings:</Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography variant="body2">Max Age: {selectedSession.cookie.maxAge || 'N/A'}</Typography>
                    <Typography variant="body2">HTTP Only: {selectedSession.cookie.httpOnly ? 'Yes' : 'No'}</Typography>
                    <Typography variant="body2">Secure: {selectedSession.cookie.secure ? 'Yes' : 'No'}</Typography>
                    <Typography variant="body2">Same Site: {selectedSession.cookie.sameSite || 'N/A'}</Typography>
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Sessions

import React from 'react'
import {
  Box,
  Typography,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@mui/material'
import {
  Dashboard,
  People,
  Receipt,
  Category,
  Schedule,
  Person,
  SwapHoriz,
  History,
  Lock,
  AccountBalanceWallet
} from '@mui/icons-material'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../config/api'

const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/' },
    { text: 'Users', icon: <People />, path: '/users' },
    { text: 'Expenses', icon: <Receipt />, path: '/expenses' },
    { text: 'Categories', icon: <Category />, path: '/categories' },
    { text: 'Auto Expenses', icon: <Schedule />, path: '/auto-expenses' },
    { text: 'Profiles', icon: <Person />, path: '/profiles' },
    { text: 'Transactions', icon: <SwapHoriz />, path: '/transactions' },
    { text: 'History', icon: <History />, path: '/history' },
    { text: 'Sessions', icon: <Lock />, path: '/sessions' },
    { text: 'Budgets', icon: <AccountBalanceWallet />, path: '/budgets' },
  ]

  const handleItemClick = (path) => {
    if (location.pathname !== path) {
      navigate(path)
    }
  }

  return (
    <Box
      sx={{
        width: 250,
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box p={2}>
        <Typography variant="h6" fontWeight="bold">
          Expense Tracker
        </Typography>
      </Box>

      <Divider />

      <Box flexGrow={1}>
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => handleItemClick(item.path)}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Box>

      <Divider />

      <Box p={2}>
        <Typography variant="caption" color="textSecondary">
          &copy; {new Date().getFullYear()} Expense Tracker. All rights reserved.
        </Typography>
      </Box>
    </Box>
  )
}

export default Sidebar
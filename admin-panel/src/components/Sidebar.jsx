import React from 'react'
import {
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
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
  AccountBalanceWallet,
  Description,
  AccountBalance
} from '@mui/icons-material'
import { NavLink } from 'react-router-dom'

const Sidebar = () => {
  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/' },
    { text: 'Users', icon: <People />, path: '/users' },
    { text: 'Expenses', icon: <Receipt />, path: '/expenses' },
    { text: 'Categories', icon: <Category />, path: '/categories' },
    { text: 'Auto Expenses', icon: <Schedule />, path: '/auto-expenses' },
    { text: 'Manage Expenses', icon: <Description />, path: '/manage-expenses' },
    { text: 'Income Tax Help', icon: <AccountBalance />, path: '/income-tax-help' },
    { text: 'Budgets', icon: <AccountBalanceWallet />, path: '/budgets' },
    { text: 'Profiles', icon: <Person />, path: '/profiles' },
    { text: 'Transactions', icon: <SwapHoriz />, path: '/transactions' },
    { text: 'History', icon: <History />, path: '/history' },
    // { text: 'Sessions', icon: <Lock />, path: '/sessions' },
  ]

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
              key={item.text}
              disablePadding
              sx={{ display: 'block' }}
            >
              <NavLink
                to={item.path}
                end={item.path === '/'}
                style={({ isActive }) => ({
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  backgroundColor: isActive ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                  borderRight: isActive ? '3px solid #1976d2' : 'none',
                })}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </NavLink>
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
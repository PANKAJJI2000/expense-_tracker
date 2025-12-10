import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Expenses from './pages/Expenses'
import Categories from './pages/Categories'
import AutoExpenses from './pages/AutoExpenses'
import Profiles from './pages/Profiles'
import Transactions from './pages/Transactions'
import TransactionHistory from './pages/TransactionHistory'
import Sessions from './pages/Sessions' // Add this import
import Budget from './pages/Budget'

function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="categories" element={<Categories />} />
            <Route path="auto-expenses" element={<AutoExpenses />} />
            <Route path="profiles" element={<Profiles />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="transaction-history" element={<TransactionHistory />} />
            <Route path="/sessions" element={<Sessions />} /> {/* Add this route */}
            <Route path="/budgets" element={<Budget />} /> {/* Add this route */}
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
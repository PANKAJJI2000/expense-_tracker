const express = require('express');
const router = express.Router();
const { 
  signup, 
  login, 
  forgotPassword, 
  resetPassword 
} = require('../controllers/authController');
const { 
  signupValidation, 
  loginValidation, 
  handleValidationErrors 
} = require('../middleware/validation');
const { body } = require('express-validator');
const jwt = require('jsonwebtoken');

// Token blacklist (in production, use Redis or database)
const tokenBlacklist = new Set();

// Middleware to check if token is blacklisted
const checkBlacklist = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (token && tokenBlacklist.has(token)) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token has been invalidated' 
    });
  }
  
  next();
};

// Signup route
router.post('/signup', signupValidation, handleValidationErrors, signup);

// Login route
router.post('/login', loginValidation, handleValidationErrors, login);

// Forgot password route
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please provide a valid email')
], handleValidationErrors, forgotPassword);

// Reset password route
router.put('/reset-password/:token', [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
], handleValidationErrors, resetPassword);

// Logout route
router.post('/logout', checkBlacklist, (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }
    
    // Verify token before blacklisting
    jwt.verify(token, process.env.JWT_SECRET);
    
    // Add token to blacklist
    tokenBlacklist.add(token);
    
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});


router.checkBlacklist = checkBlacklist;

module.exports = router;

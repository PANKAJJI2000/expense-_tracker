const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post('/signin/linkedin', authController.linkedinSignin);
router.post('/signin/google', authController.googleSignin);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Protected routes - require authentication
router.get('/profile', authMiddleware, authController.getProfile);
router.get('/me', authMiddleware, authController.getProfile); // Alternative route

module.exports = router;
const express = require('express');
const router = express.Router();
const {
  createProfile,
  getAllProfiles,
  getProfileById,
  getProfileByUserId,
  updateProfileByUserId,
  updateProfile,
  deleteProfile,
  deleteProfileByUserId,
  getProfileByReferralCode,
  getProfileByEmail,
  uploadProfilePic
} = require('../controllers/profileController');

// Public routes
router.get('/referral/:code', getProfileByReferralCode);

// Profile by email
router.post('/by-email', getProfileByEmail);

// Profile CRUD routes (user-based) - must be before /:id routes
router.get('/user/:userId', getProfileByUserId);
router.put('/user/:userId', uploadProfilePic.single('profilePicture'), updateProfileByUserId);
router.delete('/user/:userId', deleteProfileByUserId);

// Profile CRUD routes (profile ID based)
router.post('/', createProfile);
router.get('/', getAllProfiles);
router.get('/:id', getProfileById);
router.put('/:id', uploadProfilePic.single('profilePicture'), updateProfile);
router.delete('/:id', deleteProfile);

module.exports = router;

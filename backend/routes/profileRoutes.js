const express = require('express');
const router = express.Router();
const {
  createProfile,
  getAllProfiles,
  getProfileById,
  getProfileByUserId,
  updateProfile,
  deleteProfile,
  getProfileByReferralCode
} = require('../controllers/profileController');

// Public routes
router.get('/referral/:code', getProfileByReferralCode);

// Profile CRUD routes
router.post('/', createProfile);
router.get('/', getAllProfiles);
router.get('/:id', getProfileById);
router.get('/user/:userId', getProfileByUserId);
router.put('/:id', updateProfile);
router.delete('/:id', deleteProfile);

module.exports = router;

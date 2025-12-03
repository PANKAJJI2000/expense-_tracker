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
  getProfileByReferralCode,
  uploadProfilePic
} = require('../controllers/profileController');

// Public routes
router.get('/referral/:code', getProfileByReferralCode);

// Profile CRUD routes
router.post('/', createProfile);
router.get('/', getAllProfiles);
router.get('/:id', getProfileById);
router.get('/user/:userId', getProfileByUserId);
router.put('/user/:userId', updateProfileByUserId);
router.put(
  '/profiles/user/:userId',
  uploadProfilePic.single('profilePicture'),
  updateProfileByUserId
);

router.put('/:id', updateProfile);
router.put(
  '/profiles/:id',
  uploadProfilePic.single('profilePicture'),
  updateProfile
);
router.delete('/:id', deleteProfile);

module.exports = router;

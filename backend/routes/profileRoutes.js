const express = require('express');
const multer = require('multer');
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
  updateProfilePictureByUserId,
  uploadProfilePic
} = require('../controllers/profileController');

const runProfileUpload = (req, res, next) => {
  uploadProfilePic.single('profilePicture')(req, res, (err) => {
    if (!err) return next();

    const uploadErrorMessage =
      err instanceof multer.MulterError
        ? err.message
        : err?.message === 'Unexpected end of form'
          ? 'Malformed multipart/form-data request. Make sure the upload body is complete and let the HTTP client set the Content-Type boundary automatically.'
          : err?.message === 'Only image files are allowed'
            ? err.message
            : null;

    if (uploadErrorMessage) {
      return res.status(400).json({
        success: false,
        message: uploadErrorMessage,
      });
    }

    return next(err);
  });
};

// Public routes
router.get('/referral/:code', getProfileByReferralCode);

// Profile by email
router.post('/by-email', getProfileByEmail);

// Profile CRUD routes (user-based) - must be before /:id routes
router.get('/user/:userId', getProfileByUserId);
router.patch('/user/:userId/profile-picture', runProfileUpload, updateProfilePictureByUserId);
router.put('/user/:userId', runProfileUpload, updateProfileByUserId);
router.delete('/user/:userId', deleteProfileByUserId);

// Profile CRUD routes (profile ID based)
router.post('/', runProfileUpload, createProfile);
router.get('/', getAllProfiles);
router.get('/:id', getProfileById);
router.put('/:id', runProfileUpload, updateProfile);
router.delete('/:id', deleteProfile);

module.exports = router;

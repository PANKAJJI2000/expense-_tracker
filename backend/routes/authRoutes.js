const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post('/signin/linkedin', authController.linkedinSignin);
router.post('/signin/google', authController.googleSignin);


module.exports = router;

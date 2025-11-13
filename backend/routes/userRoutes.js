const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  updatePassword,
  deleteUser
} = require("../controllers/userController");

// Base routes
router.get("/", getAllUsers);

// ID-based routes
router.route("/:id")
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

// Password update route
router.put("/:id/password", updatePassword);

module.exports = router;
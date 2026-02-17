const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    console.log("Auth middleware - Headers:", req.headers);
    console.log("Auth middleware - Session:", req.session);

    // Get token from header
    const token =
      req.header("Authorization")?.replace("Bearer ", "") ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        error: "No token provided",
        message: "Authentication required",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");

    // Find user by id
    const user = await User.findById(decoded.userId || decoded.id);

    if (!user) {
      return res.status(401).json({
        error: "User not found",
        message: "Invalid authentication token",
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Invalid token",
        message: "Authentication failed",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expired",
        message: "Please login again",
      });
    }

    res.status(500).json({
      error: "Server error",
      details: error.message,
    });
  }
};

module.exports = authMiddleware;

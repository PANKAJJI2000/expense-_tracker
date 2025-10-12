const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure userId is present in req.user
    if (!decoded.userId) {
      // Try to get userId from DB if only _id or email is present
      let user;
      if (decoded._id) {
        user = await User.findById(decoded._id);
      } else if (decoded.email) {
        user = await User.findOne({ email: decoded.email });
      }
      if (user) {
        req.user = { ...decoded, userId: user._id.toString() };
      } else {
        return res
          .status(401)
          .json({ success: false, message: "User not found in token" });
      }
    } else {
      req.user = decoded;
    }
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Token is not valid" });
  }
};

module.exports = authMiddleware;

const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    console.log("Auth middleware - Headers:", req.headers);
    console.log("Auth middleware - Session:", req.session);

    // Check for JWT token in Authorization header
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      console.log("Token found in Authorization header:", token);

      if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not set in environment variables");
        return res.status(500).json({ error: "Server misconfiguration: JWT secret missing" });
      }

      if (!token) {
        console.error("No token provided after Bearer");
        return res.status(401).json({ error: "No token provided" });
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Token decoded:", decoded);
        req.user = decoded;

        return next();
      } catch (jwtError) {
        console.error("JWT verification failed:", jwtError.message);
        return res.status(401).json({ error: "Invalid or expired token", details: jwtError.message });
      }
    }

    // Check for session-based authentication
    if (req.session && req.session.user) {
      console.log("User found in session:", req.session.user);
      req.user = req.session.user;
      return next();
    }

    console.log("No authentication found");
    return res.status(401).json({ error: "Authentication required" });
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
};

module.exports = authMiddleware;

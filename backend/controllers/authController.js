const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const axios = require('axios');
const User = require('../models/User');

const authController = {
  async signup(req, res) {
    try {
      const { name, email, password, phone, gender, currency } = req.body;
      
      if (!email || !password || !name) {
        return res.status(400).json({ 
          success: false,
          error: 'Name, email and password are required' 
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, ...(phone ? [{ phone }] : [])],
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message:
            existingUser.email === email
              ? "Email already registered"
              : "Phone number already registered",
        });
      }

      // Create new user with all fields
      const userData = {
        name,
        email,
        password,
      };

      // Only add optional fields if they are provided
      if (phone) userData.phone = phone;
      if (gender) userData.gender = gender;
      if (currency) userData.currency = currency;

      const user = new User(userData);

      await user.save();

      // Generate token
      const token = jwt.sign(
        { userId: user._id }, 
        process.env.JWT_SECRET || 'your-secret-key', 
        { expiresIn: '7d' }
      );

      // Return success response with all user data
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone || null,
            gender: user.gender || null,
            currency: user.currency || null,
            profilePicture: user.profilePicture || null,
            authProvider: user.authProvider || 'local',
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          },
          token,
        },
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          success: false,
          error: 'Email and password are required' 
        });
      }

      // Find user by email - ensure all fields are fetched
      const user = await User.findOne({ email }).lean();
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Re-fetch with password for comparison
      const userWithPassword = await User.findById(user._id).select('+password');
      
      // Check password
      const isPasswordValid = await userWithPassword.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Generate token
      const token = jwt.sign(
        { userId: user._id }, 
        process.env.JWT_SECRET || 'your-secret-key', 
        { expiresIn: '7d' }
      );

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone || null,
            gender: user.gender || null,
            currency: user.currency || null,
            profilePicture: user.profilePicture || null,
            authProvider: user.authProvider || 'local',
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          },
          token,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  async googleSignin(req, res) {
    try {
      const { idToken } = req.body;
      
      if (!idToken) {
        return res.status(400).json({ error: 'Google ID token is required' });
      }

      // Verify Google ID token
      const { OAuth2Client } = require('google-auth-library');
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      
      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      
      // Extract user information
      const googleProfile = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture
      };

      // Find or create user
      const user = await User.findOrCreateGoogleUser(googleProfile);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id }, 
        process.env.JWT_SECRET || 'your-secret-key', 
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Google signin successful',
        token,
        user: { 
          id: user._id, 
          email: user.email, 
          name: user.name,
          profilePicture: user.profilePicture,
          authProvider: user.authProvider
        }
      });
    } catch (error) {
      console.error('Google signin error:', error);
      res.status(500).json({ 
        error: 'Google signin failed', 
        details: error.message 
      });
    }
  },

  async linkedinSignin(req, res) {
    try {
      const { accessToken, code } = req.body;
      
      if (!accessToken && !code) {
        return res.status(400).json({ error: 'LinkedIn access token or authorization code is required' });
      }

      let token = accessToken;
      
      // If code is provided, exchange it for access token
      if (code && !accessToken) {
        const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', {
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET
        }, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        
        token = tokenResponse.data.access_token;
      }

      // Get user profile from LinkedIn API
      const profileResponse = await axios.get('https://api.linkedin.com/v2/people/~:(id,firstName,lastName,profilePicture(displayImage~:playableStreams))', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Get email from LinkedIn API
      const emailResponse = await axios.get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const profile = profileResponse.data;
      const emailData = emailResponse.data;

      // Extract user information
      const linkedinProfile = {
        id: profile.id,
        name: `${profile.firstName.localized.en_US} ${profile.lastName.localized.en_US}`,
        email: emailData.elements[0]['handle~'].emailAddress,
        picture: profile.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier
      };

      // Find or create user
      const user = await User.findOrCreateLinkedInUser(linkedinProfile);

      // Generate JWT token
      const jwtToken = jwt.sign(
        { userId: user._id }, 
        process.env.JWT_SECRET || 'your-secret-key', 
        { expiresIn: '7d' }
      );

      res.json({
        message: 'LinkedIn signin successful',
        token: jwtToken,
        user: { 
          id: user._id, 
          email: user.email, 
          name: user.name,
          profilePicture: user.profilePicture,
          authProvider: user.authProvider
        }
      });
    } catch (error) {
      console.error('LinkedIn signin error:', error);
      res.status(500).json({ 
        error: 'LinkedIn signin failed', 
        details: error.response?.data || error.message 
      });
    }
  },

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found with this email",
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Set reset token and expiry (1 hour from now)
      user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
      
      await user.save();

      // Create reset URL
      const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;

      // Email configuration
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      const message = {
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: 'Password Reset Request',
        html: `
          <h1>Password Reset Request</h1>
          <p>Hi ${user.name},</p>
          <p>You have requested a password reset. Please click the link below to reset your password:</p>
          <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      };

      await transporter.sendMail(message);

      res.status(200).json({
        success: true,
        message: "Password reset email sent successfully",
      });

    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        success: false,
        message: "Email could not be sent",
        error: error.message,
      });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;

      // Hash the token and find user
      const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
      
      const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired reset token",
        });
      }

      // Set new password
      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      
      await user.save();

      // Generate new token
      const authToken = jwt.sign(
        { userId: user._id }, 
        process.env.JWT_SECRET || 'your-secret-key', 
        { expiresIn: '7d' }
      );

      res.status(200).json({
        success: true,
        message: "Password reset successfully",
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            gender: user.gender,
            currency: user.currency,
          },
          token: authToken,
        },
      });

    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  async getProfile(req, res) {
    try {
      // req.userId should be set by authentication middleware
      const userId = req.userId || req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - No user ID found",
        });
      }

      // Find user and exclude password
      const user = await User.findById(userId).select('-password -resetPasswordToken -resetPasswordExpire');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "User profile retrieved successfully",
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone || null,
            gender: user.gender || null,
            currency: user.currency || null,
            profilePicture: user.profilePicture || null,
            authProvider: user.authProvider || 'local',
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        },
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  async getUserData(req, res) {
    try {
      // req.userId should be set by authentication middleware
      const userId = req.userId || req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - No user ID found",
        });
      }

      // Find user and get only signup-related data
      const user = await User.findById(userId).select('name email phone gender currency profilePicture authProvider createdAt');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "User signup data retrieved successfully",
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || null,
          gender: user.gender || null,
          currency: user.currency || null,
          profilePicture: user.profilePicture || null,
          authProvider: user.authProvider || 'local',
          createdAt: user.createdAt
        },
      });
    } catch (error) {
      console.error("Get user data error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
};

module.exports = authController;
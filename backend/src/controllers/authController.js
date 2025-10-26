import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendOTPEmail } from '../utils/emailService.js';

// In-memory OTP storage (use Redis in production)
const otpStore = new Map();

// Helper function to generate OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Helper function to store OTP with expiry
const storeOTP = (email, otp) => {
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(email.toLowerCase(), { otp, expiresAt });
};

// Helper function to verify OTP
const verifyOTP = (email, otp) => {
  const stored = otpStore.get(email.toLowerCase());
  
  if (!stored) {
    return { valid: false, message: 'OTP not found or expired' };
  }
  
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return { valid: false, message: 'OTP has expired' };
  }
  
  if (stored.otp !== otp) {
    return { valid: false, message: 'Invalid OTP' };
  }
  
  return { valid: true };
};

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'your-secret-key-change-in-production', {
    expiresIn: '30d'
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ 
      where: { 
        email: email.toLowerCase() 
      } 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Check if username exists
    const existingUsername = await User.findOne({ 
      where: { 
        username: username.toLowerCase() 
      } 
    });

    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken'
      });
    }

    // Create user
    const user = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      mode: 'private' // Default mode
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: user.toSafeObject(),
        token
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = await User.findOne({ 
      where: { 
        email: email.toLowerCase() 
      } 
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate token
    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toSafeObject(),
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user.toSafeObject()
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
};

// @desc    Update user mode (private/public)
// @route   PUT /api/auth/mode
// @access  Private
export const updateMode = async (req, res) => {
  try {
    const { mode } = req.body;

    if (!mode || !['private', 'public'].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mode. Must be "private" or "public"'
      });
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({ mode });

    res.status(200).json({
      success: true,
      message: 'Mode updated successfully',
      data: {
        mode: user.mode
      }
    });

  } catch (error) {
    console.error('Update mode error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating mode'
    });
  }
};

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    // In a JWT system, logout is typically handled client-side by removing the token
    // But we can track it server-side if needed
    
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout'
    });
  }
};

// @desc    Send OTP for password reset
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email address'
      });
    }

    // Check if user exists
    const user = await User.findOne({
      where: {
        email: email.toLowerCase()
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP
    storeOTP(email, otp);

    // Send email
    await sendOTPEmail(email, otp, user.username);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email address'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request. Please try again.'
    });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTPCode = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and OTP'
      });
    }

    // Verify OTP
    const verification = verifyOTP(email, otp);

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: verification.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Verify OTP one more time
    const verification = verifyOTP(email, otp);

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: verification.message
      });
    }

    // Find user
    const user = await User.findOne({
      where: {
        email: email.toLowerCase()
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password (will be hashed by the model hook)
    await user.update({ password: newPassword });

    // Clear OTP from store
    otpStore.delete(email.toLowerCase());

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
};
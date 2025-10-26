import express from 'express';
import { 
  register, 
  login, 
  getMe, 
  updateMode, 
  logout,
  forgotPassword,
  verifyOTPCode,
  resetPassword
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Password reset routes (Public)
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTPCode);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/mode', protect, updateMode);
router.post('/logout', protect, logout);

export default router;
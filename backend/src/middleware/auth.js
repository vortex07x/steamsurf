import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
      // Get user from token
      const user = await User.findByPk(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account has been deactivated'
        });
      }
      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or expired'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Optional authentication - sets req.user if token exists, but doesn't block request
export const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('🔍 Optional Auth: Token found');
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
        console.log('🔍 Optional Auth: Token decoded, user ID:', decoded.id);
        
        const user = await User.findByPk(decoded.id);
        
        if (user && user.isActive) {
          req.user = user;
          console.log('🔍 Optional Auth: User authenticated:', user.email);
        } else {
          console.log('🔍 Optional Auth: User not found or inactive');
        }
      } catch (tokenError) {
        console.log('🔍 Optional Auth: Token invalid:', tokenError.message);
      }
    } else {
      console.log('🔍 Optional Auth: No token provided');
    }

    // Always continue, even if there's no user
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    // Don't block the request, just continue without user
    next();
  }
};

// Middleware to check if user is admin
export const adminOnly = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization error'
    });
  }
};
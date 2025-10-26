import express from 'express';
import multer from 'multer';
import {
  getAllUsers,
  updateUserRole,
  updateUserEmail,
  deleteUser,
  getAllVideosAdmin,
  uploadVideoToCloudinary,
  updateVideoAdmin,
  deleteVideoAdmin,
  getUserActivity,
  cleanupOldActivities // ADD THIS
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  }
});

// All routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

// User management routes
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/email', updateUserEmail);
router.delete('/users/:id', deleteUser);

// Video management routes
router.get('/videos', getAllVideosAdmin);
router.post('/videos/upload', upload.single('video'), uploadVideoToCloudinary);
router.put('/videos/:id', updateVideoAdmin);
router.delete('/videos/:id', deleteVideoAdmin);

// Activity routes
router.get('/activity', getUserActivity);
router.delete('/activity/cleanup', cleanupOldActivities); // ADD THIS NEW ROUTE

export default router;
import express from 'express';
import {
  getAllVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
  getTrendingVideos,
  getAllTags,
  likeVideo,
  dislikeVideo,
  incrementView,
  saveVideoController,
  unsaveVideoController,
  checkVideoSavedController,
  getSavedVideos,
  getViewHistory
} from '../controllers/videoController.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes with optional auth
router.get('/', optionalAuth, getAllVideos);
router.get('/trending', optionalAuth, getTrendingVideos);
router.get('/tags', getAllTags);

// User's saved videos and history (MUST come BEFORE /:id)
router.get('/saved', protect, getSavedVideos);
router.get('/history', protect, getViewHistory);

// Single video by ID
router.get('/:id', optionalAuth, getVideoById);

// Protected routes (require login)
router.post('/:id/like', protect, likeVideo);
router.post('/:id/dislike', protect, dislikeVideo);
router.post('/:id/view', protect, incrementView);

// Save/Unsave routes (require login)
router.post('/:id/save', protect, saveVideoController);
router.delete('/:id/unsave', protect, unsaveVideoController);
router.get('/:id/is-saved', protect, checkVideoSavedController);

// Admin routes (add authentication middleware later)
router.post('/', createVideo);
router.put('/:id', updateVideo);
router.delete('/:id', deleteVideo);

export default router;
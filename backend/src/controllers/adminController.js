import User from '../models/User.js';
import Video from '../models/Video.js';
import VideoInteraction from '../models/VideoInteraction.js';
import { Op } from 'sequelize';
import cloudinary from '../config/cloudinary.js';
import { sequelize } from '../config/database.js';

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "user" or "admin"'
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent changing own role
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    await user.update({ role });

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: user.toSafeObject()
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user role',
      error: error.message
    });
  }
};

// @desc    Update user email
// @route   PUT /api/admin/users/:id/email
// @access  Private/Admin
export const updateUserEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const { id } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({
      where: {
        email: email.toLowerCase(),
        id: { [Op.ne]: id }
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }

    await user.update({ email: email.toLowerCase() });

    res.json({
      success: true,
      message: 'Email updated successfully',
      data: user.toSafeObject()
    });
  } catch (error) {
    console.error('Update user email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating email',
      error: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting own account
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Prevent deleting other admins
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// @desc    Get all videos (including unpublished)
// @route   GET /api/admin/videos
// @access  Private/Admin
export const getAllVideosAdmin = async (req, res) => {
  try {
    const videos = await Video.findAll({
      order: [['createdAt', 'DESC']]
    });

    // Get interaction counts
    const videoIds = videos.map(v => v.id);
    const interactionCounts = await VideoInteraction.findAll({
      where: { videoId: { [Op.in]: videoIds } },
      attributes: [
        'videoId',
        'type',
        [sequelize.fn('COUNT', sequelize.col('type')), 'count']
      ],
      group: ['videoId', 'type']
    });

    const interactionMap = {};
    videoIds.forEach(id => {
      interactionMap[id] = { likes: 0, dislikes: 0, views: 0 };
    });

    interactionCounts.forEach(({ videoId, type, count }) => {
      interactionMap[videoId][type + 's'] = parseInt(count) || 0;
    });

    const videosWithCounts = videos.map(video => {
      const videoData = video.toJSON();
      const interactions = interactionMap[video.id];
      videoData.likes = interactions.likes;
      videoData.dislikes = interactions.dislikes;
      videoData.views = interactions.views;
      return videoData;
    });

    res.json({
      success: true,
      data: videosWithCounts
    });
  } catch (error) {
    console.error('Get all videos admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching videos',
      error: error.message
    });
  }
};

// @desc    Upload video to Cloudinary
// @route   POST /api/admin/videos/upload
// @access  Private/Admin
export const uploadVideoToCloudinary = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file provided'
      });
    }

    const { title, description, category, tags } = req.body;

    if (!title || !description) {
      // Clean up uploaded file if validation fails
      if (req.file?.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (cleanupError) {
          console.error('Error deleting temporary file:', cleanupError);
        }
      }
      
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'video',
      folder: 'streamsurf/videos',
      eager: [
        { width: 1280, height: 720, crop: 'fill', format: 'jpg' }
      ],
      eager_async: true
    });

    // Delete temporary file after successful upload to Cloudinary
    if (req.file?.path) {
      try {
        const fs = await import('fs/promises');
        await fs.unlink(req.file.path);
        console.log('✅ Temporary file deleted:', req.file.path);
      } catch (cleanupError) {
        console.error('⚠️ Error deleting temporary file:', cleanupError);
        // Don't fail the request if cleanup fails
      }
    }

    // Get video duration from Cloudinary
    const duration = Math.floor(result.duration || 0);

    // Parse tags
    let parsedTags = [];
    try {
      if (tags) {
        parsedTags = JSON.parse(tags);
      }
    } catch (e) {
      console.error('Error parsing tags:', e);
    }

    // Create video record
    const video = await Video.create({
      title,
      description,
      category: category || 'Other',
      tags: parsedTags,
      videoUrl: result.secure_url,
      thumbnailUrl: result.eager?.[0]?.secure_url || result.secure_url.replace(/\.(mp4|webm|mov)$/, '.jpg'),
      cloudinaryId: result.public_id,
      duration,
      uploadedBy: req.user.username
    });

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      data: video
    });
  } catch (error) {
    console.error('Upload video error:', error);
    
    // Clean up temporary file if upload fails
    if (req.file?.path) {
      try {
        const fs = await import('fs/promises');
        await fs.unlink(req.file.path);
        console.log('✅ Temporary file deleted after error');
      } catch (cleanupError) {
        console.error('⚠️ Error deleting temporary file:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Error uploading video',
      error: error.message
    });
  }
};

// @desc    Update video details
// @route   PUT /api/admin/videos/:id
// @access  Private/Admin
export const updateVideoAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, tags, description, category, isPublished } = req.body;

    const video = await Video.findByPk(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (tags !== undefined) updates.tags = tags;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (isPublished !== undefined) updates.isPublished = isPublished;

    await video.update(updates);

    res.json({
      success: true,
      message: 'Video updated successfully',
      data: video
    });
  } catch (error) {
    console.error('Update video admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating video',
      error: error.message
    });
  }
};

// @desc    Delete video
// @route   DELETE /api/admin/videos/:id
// @access  Private/Admin
export const deleteVideoAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const video = await Video.findByPk(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Delete from Cloudinary if exists
    if (video.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(video.cloudinaryId, { resource_type: 'video' });
      } catch (cloudinaryError) {
        console.error('Cloudinary deletion error:', cloudinaryError);
        // Continue with database deletion even if Cloudinary fails
      }
    }

    // Delete from database (will cascade delete interactions)
    await video.destroy();

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Delete video admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting video',
      error: error.message
    });
  }
};

// @desc    Get user activity
// @route   GET /api/admin/activity
// @access  Private/Admin
export const getUserActivity = async (req, res) => {
  try {
    const activities = await VideoInteraction.findAll({
      order: [['createdAt', 'DESC']],
      limit: 1000,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        },
        {
          model: Video,
          as: 'video',
          attributes: ['id', 'title', 'thumbnailUrl']
        }
      ]
    });

    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      createdAt: activity.createdAt,
      username: activity.user?.username || 'Unknown',
      userEmail: activity.user?.email || '',
      videoTitle: activity.video?.title || 'Unknown Video',
      videoId: activity.videoId,
      userId: activity.userId
    }));

    res.json({
      success: true,
      data: formattedActivities
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity',
      error: error.message
    });
  }
};

// @desc    Cleanup old activities (older than 24 hours)
// @route   DELETE /api/admin/activity/cleanup
// @access  Private/Admin
export const cleanupOldActivities = async (req, res) => {
  try {
    // Calculate date 24 hours ago
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Delete all VideoInteractions older than 24 hours
    const result = await VideoInteraction.destroy({
      where: {
        createdAt: {
          [Op.lt]: oneDayAgo
        }
      }
    });

    res.json({
      success: true,
      deletedCount: result,
      message: `Successfully deleted ${result} activity record${result !== 1 ? 's' : ''} older than 24 hours`
    });
  } catch (error) {
    console.error('Cleanup old activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cleaning up activities',
      error: error.message
    });
  }
};
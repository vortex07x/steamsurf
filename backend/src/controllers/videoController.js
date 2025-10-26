import Video from '../models/Video.js';
import VideoInteraction from '../models/VideoInteraction.js';
import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';

// Get all videos with filtering, sorting, and pagination
export const getAllVideos = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      search = '', 
      category = '', 
      sortBy = 'createdAt',
      order = 'DESC',
      tags = ''
    } = req.query;

    const where = { isPublished: true };

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (category && category !== 'all' && category !== 'All') {
      where.category = category;
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      where.tags = { [Op.overlap]: tagArray };
    }

    const offset = (page - 1) * limit;

    const { count, rows: videos } = await Video.findAndCountAll({
      where,
      order: [[sortBy, order]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const videoIds = videos.map(v => v.id);
    
    console.log('🔍 DEBUG: Fetching data for', videoIds.length, 'videos');
    console.log('🔍 DEBUG: User logged in?', !!req.user, req.user?.id);

    // Get ALL interactions for these videos
    const allInteractions = await VideoInteraction.findAll({
      where: { videoId: { [Op.in]: videoIds } },
      raw: true
    });

    console.log('🔍 DEBUG: Total interactions found:', allInteractions.length);

    // Count manually
    const interactionMap = {};
    videoIds.forEach(id => {
      interactionMap[id] = { likes: 0, dislikes: 0, views: 0 };
    });

    allInteractions.forEach(interaction => {
      const { videoId, type } = interaction;
      if (interactionMap[videoId]) {
        interactionMap[videoId][type + 's']++;
      }
    });

    console.log('🔍 DEBUG: Interaction counts:', interactionMap);

    // Get user interactions if logged in
    let userInteractionMap = {};
    if (req.user) {
      console.log('🔍 DEBUG: Fetching user interactions for user:', req.user.id);
      
      const userInteractions = await VideoInteraction.findAll({
        where: {
          userId: req.user.id,
          videoId: { [Op.in]: videoIds }
        },
        raw: true
      });

      console.log('🔍 DEBUG: User interactions found:', userInteractions.length);
      console.log('🔍 DEBUG: User interactions:', JSON.stringify(userInteractions, null, 2));

      // Build user interaction map
      userInteractions.forEach(interaction => {
        if (!userInteractionMap[interaction.videoId]) {
          userInteractionMap[interaction.videoId] = { like: false, dislike: false };
        }
        
        if (interaction.type === 'like') {
          userInteractionMap[interaction.videoId].like = true;
        } else if (interaction.type === 'dislike') {
          userInteractionMap[interaction.videoId].dislike = true;
        }
      });

      console.log('🔍 DEBUG: User interaction map:', JSON.stringify(userInteractionMap, null, 2));
    }

    const videosWithInteractions = videos.map(video => {
      const videoData = video.toJSON();
      const interactions = interactionMap[video.id];
      
      videoData.likes = interactions.likes;
      videoData.dislikes = interactions.dislikes;
      videoData.views = interactions.views;
      videoData.userInteraction = userInteractionMap[video.id] || { like: false, dislike: false };
      
      return videoData;
    });

    console.log('🔍 DEBUG: Sample video with interactions:', JSON.stringify(videosWithInteractions[0], null, 2));

    res.json({
      success: true,
      data: videosWithInteractions,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(count / limit),
        totalVideos: count,
        hasMore: page * limit < count
      }
    });
  } catch (error) {
    console.error('Get all videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching videos',
      error: error.message
    });
  }
};

// Get single video by ID
export const getVideoById = async (req, res) => {
  try {
    const video = await Video.findByPk(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Get actual interaction counts
    const interactionCounts = await VideoInteraction.findAll({
      where: { videoId: video.id },
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('type')), 'count']
      ],
      group: ['type']
    });

    const interactions = { likes: 0, dislikes: 0, views: 0 };
    interactionCounts.forEach(({ type, count }) => {
      interactions[type + 's'] = parseInt(count) || 0;
    });

    // Get user interactions if logged in
    let userInteraction = { like: false, dislike: false };
    if (req.user) {
      const userInteractions = await VideoInteraction.findAll({
        where: {
          userId: req.user.id,
          videoId: video.id
        }
      });

      userInteractions.forEach(interaction => {
        userInteraction[interaction.type] = true;
      });
    }

    const videoData = video.toJSON();
    videoData.likes = interactions.likes;
    videoData.dislikes = interactions.dislikes;
    videoData.views = interactions.views;
    videoData.userInteraction = userInteraction;

    res.json({
      success: true,
      data: videoData
    });
  } catch (error) {
    console.error('Get video by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching video',
      error: error.message
    });
  }
};

// Increment view count (Protected - requires login)
// Increment view count (Protected - requires login)
export const incrementView = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const video = await Video.findByPk(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Create a new view record every time (allows multiple views per user)
    await VideoInteraction.create({
      videoId: video.id,
      userId: req.user.id,
      type: 'view'
    });

    // Count total views
    const viewCount = await VideoInteraction.count({
      where: {
        videoId: video.id,
        type: 'view'
      }
    });

    console.log(`📊 View count for video ${video.id}: ${viewCount}`);

    res.json({
      success: true,
      data: {
        videoId: video.id,
        views: viewCount
      }
    });
  } catch (error) {
    console.error('Increment view error:', error);
    res.status(500).json({
      success: false,
      message: 'Error incrementing view',
      error: error.message
    });
  }
};

// Like video (Protected - requires login)
export const likeVideo = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to like videos'
      });
    }

    const video = await Video.findByPk(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check if user already liked or disliked
    const existingLike = await VideoInteraction.findOne({
      where: {
        videoId: video.id,
        userId: req.user.id,
        type: 'like'
      }
    });

    const existingDislike = await VideoInteraction.findOne({
      where: {
        videoId: video.id,
        userId: req.user.id,
        type: 'dislike'
      }
    });

    if (existingLike) {
      // User already liked, remove like
      await existingLike.destroy();

      // Count totals
      const likeCount = await VideoInteraction.count({
        where: { videoId: video.id, type: 'like' }
      });
      const dislikeCount = await VideoInteraction.count({
        where: { videoId: video.id, type: 'dislike' }
      });

      return res.json({
        success: true,
        message: 'Like removed',
        data: {
          videoId: video.id,
          likes: likeCount,
          dislikes: dislikeCount,
          userLiked: false,
          userDisliked: false
        }
      });
    }

    if (existingDislike) {
      // Remove dislike first
      await existingDislike.destroy();
    }

    // Add like
    await VideoInteraction.create({
      videoId: video.id,
      userId: req.user.id,
      type: 'like'
    });

    // Count totals
    const likeCount = await VideoInteraction.count({
      where: { videoId: video.id, type: 'like' }
    });
    const dislikeCount = await VideoInteraction.count({
      where: { videoId: video.id, type: 'dislike' }
    });

    res.json({
      success: true,
      message: 'Video liked',
      data: {
        videoId: video.id,
        likes: likeCount,
        dislikes: dislikeCount,
        userLiked: true,
        userDisliked: false
      }
    });
  } catch (error) {
    console.error('Like video error:', error);
    res.status(500).json({
      success: false,
      message: 'Error liking video',
      error: error.message
    });
  }
};

// Dislike video (Protected - requires login)
export const dislikeVideo = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to dislike videos'
      });
    }

    const video = await Video.findByPk(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check if user already liked or disliked
    const existingLike = await VideoInteraction.findOne({
      where: {
        videoId: video.id,
        userId: req.user.id,
        type: 'like'
      }
    });

    const existingDislike = await VideoInteraction.findOne({
      where: {
        videoId: video.id,
        userId: req.user.id,
        type: 'dislike'
      }
    });

    if (existingDislike) {
      // User already disliked, remove dislike
      await existingDislike.destroy();

      // Count totals
      const likeCount = await VideoInteraction.count({
        where: { videoId: video.id, type: 'like' }
      });
      const dislikeCount = await VideoInteraction.count({
        where: { videoId: video.id, type: 'dislike' }
      });

      return res.json({
        success: true,
        message: 'Dislike removed',
        data: {
          videoId: video.id,
          likes: likeCount,
          dislikes: dislikeCount,
          userLiked: false,
          userDisliked: false
        }
      });
    }

    if (existingLike) {
      // Remove like first
      await existingLike.destroy();
    }

    // Add dislike
    await VideoInteraction.create({
      videoId: video.id,
      userId: req.user.id,
      type: 'dislike'
    });

    // Count totals
    const likeCount = await VideoInteraction.count({
      where: { videoId: video.id, type: 'like' }
    });
    const dislikeCount = await VideoInteraction.count({
      where: { videoId: video.id, type: 'dislike' }
    });

    res.json({
      success: true,
      message: 'Video disliked',
      data: {
        videoId: video.id,
        likes: likeCount,
        dislikes: dislikeCount,
        userLiked: false,
        userDisliked: true
      }
    });
  } catch (error) {
    console.error('Dislike video error:', error);
    res.status(500).json({
      success: false,
      message: 'Error disliking video',
      error: error.message
    });
  }
};

// Create new video
export const createVideo = async (req, res) => {
  try {
    const video = await Video.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Video created successfully',
      data: video
    });
  } catch (error) {
    console.error('Create video error:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating video',
      error: error.message
    });
  }
};

// Update video
export const updateVideo = async (req, res) => {
  try {
    const video = await Video.findByPk(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    await video.update(req.body);

    res.json({
      success: true,
      message: 'Video updated successfully',
      data: video
    });
  } catch (error) {
    console.error('Update video error:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating video',
      error: error.message
    });
  }
};

// Delete video
export const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findByPk(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    await video.destroy();

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting video',
      error: error.message
    });
  }
};

// Get trending videos
export const getTrendingVideos = async (req, res) => {
  try {
    // Get videos with most views from VideoInteraction
    const trendingVideos = await VideoInteraction.findAll({
      where: { type: 'view' },
      attributes: [
        'videoId',
        [sequelize.fn('COUNT', sequelize.col('videoId')), 'viewCount']
      ],
      group: ['videoId'],
      order: [[sequelize.literal('viewCount'), 'DESC']],
      limit: 10
    });

    const videoIds = trendingVideos.map(v => v.videoId);

    if (videoIds.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Fetch full video details
    const videos = await Video.findAll({
      where: {
        id: { [Op.in]: videoIds },
        isPublished: true
      }
    });

    // Add interaction counts
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

    // Sort by view count
    videosWithCounts.sort((a, b) => b.views - a.views);

    res.json({
      success: true,
      data: videosWithCounts
    });
  } catch (error) {
    console.error('Get trending videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending videos',
      error: error.message
    });
  }
};

// Get all unique tags
export const getAllTags = async (req, res) => {
  try {
    const videos = await Video.findAll({
      attributes: ['tags'],
      where: { isPublished: true }
    });

    // Flatten and get unique tags
    const allTags = videos
      .flatMap(video => video.tags)
      .filter((tag, index, self) => tag && self.indexOf(tag) === index)
      .sort();

    res.json({
      success: true,
      data: allTags
    });
  } catch (error) {
    console.error('Get all tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tags',
      error: error.message
    });
  }
};

// Save video (Protected - requires login)
export const saveVideoController = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const video = await Video.findByPk(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Import SavedVideo model
    const { default: SavedVideo } = await import('../models/SavedVideo.js');

    // Check if already saved
    const existingSave = await SavedVideo.findOne({
      where: {
        videoId: video.id,
        userId: req.user.id
      }
    });

    if (existingSave) {
      return res.status(400).json({
        success: false,
        message: 'Video already saved'
      });
    }

    // Save video
    await SavedVideo.create({
      videoId: video.id,
      userId: req.user.id
    });

    res.json({
      success: true,
      message: 'Video saved successfully',
      data: {
        videoId: video.id,
        saved: true
      }
    });
  } catch (error) {
    console.error('Save video error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving video',
      error: error.message
    });
  }
};

// Unsave video (Protected - requires login)
export const unsaveVideoController = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Import SavedVideo model
    const { default: SavedVideo } = await import('../models/SavedVideo.js');

    const savedVideo = await SavedVideo.findOne({
      where: {
        videoId: req.params.id,
        userId: req.user.id
      }
    });

    if (!savedVideo) {
      return res.status(404).json({
        success: false,
        message: 'Video not found in saved list'
      });
    }

    await savedVideo.destroy();

    res.json({
      success: true,
      message: 'Video removed from saved',
      data: {
        videoId: req.params.id,
        saved: false
      }
    });
  } catch (error) {
    console.error('Unsave video error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing saved video',
      error: error.message
    });
  }
};

// Check if video is saved (Protected - requires login)
export const checkVideoSavedController = async (req, res) => {
  try {
    if (!req.user) {
      return res.json({
        success: true,
        data: { isSaved: false }
      });
    }

    // Import SavedVideo model
    const { default: SavedVideo } = await import('../models/SavedVideo.js');

    const savedVideo = await SavedVideo.findOne({
      where: {
        videoId: req.params.id,
        userId: req.user.id
      }
    });

    res.json({
      success: true,
      data: {
        isSaved: !!savedVideo
      }
    });
  } catch (error) {
    console.error('Check saved status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking saved status',
      error: error.message
    });
  }
};

// Get saved videos (Protected - requires login)
// Get saved videos (Protected - requires login)
export const getSavedVideos = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Import SavedVideo model
    const { default: SavedVideo } = await import('../models/SavedVideo.js');

    const savedVideos = await SavedVideo.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Video,
          as: 'video',
          where: { isPublished: true }
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (savedVideos.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const videoIds = savedVideos.map(sv => sv.video.id);

    // Get ALL interaction counts for these videos
    const allInteractions = await VideoInteraction.findAll({
      where: { videoId: { [Op.in]: videoIds } },
      raw: true
    });

    console.log('🔍 SavedVideos: Total interactions found:', allInteractions.length);

    // Count manually
    const interactionMap = {};
    videoIds.forEach(id => {
      interactionMap[id] = { likes: 0, dislikes: 0, views: 0 };
    });

    allInteractions.forEach(interaction => {
      const { videoId, type } = interaction;
      if (interactionMap[videoId]) {
        interactionMap[videoId][type + 's']++;
      }
    });

    console.log('🔍 SavedVideos: Interaction counts:', interactionMap);

    // Get user's own interactions
    let userInteractionMap = {};
    if (req.user) {
      const userInteractions = await VideoInteraction.findAll({
        where: {
          userId: req.user.id,
          videoId: { [Op.in]: videoIds }
        },
        raw: true
      });

      console.log('🔍 SavedVideos: User interactions found:', userInteractions.length);

      userInteractions.forEach(interaction => {
        if (!userInteractionMap[interaction.videoId]) {
          userInteractionMap[interaction.videoId] = { like: false, dislike: false };
        }
        
        if (interaction.type === 'like') {
          userInteractionMap[interaction.videoId].like = true;
        } else if (interaction.type === 'dislike') {
          userInteractionMap[interaction.videoId].dislike = true;
        }
      });

      console.log('🔍 SavedVideos: User interaction map:', userInteractionMap);
    }

    const videosWithData = savedVideos.map(sv => {
      const videoData = sv.video.toJSON();
      const interactions = interactionMap[videoData.id];
      
      videoData.likes = interactions.likes;
      videoData.dislikes = interactions.dislikes;
      videoData.views = interactions.views;
      videoData.userInteraction = userInteractionMap[videoData.id] || { like: false, dislike: false };
      videoData.savedAt = sv.createdAt;
      
      console.log('✅ SavedVideo prepared:', {
        id: videoData.id,
        title: videoData.title,
        likes: videoData.likes,
        dislikes: videoData.dislikes,
        views: videoData.views,
        userInteraction: videoData.userInteraction
      });
      
      return videoData;
    });

    res.json({
      success: true,
      data: videosWithData
    });
  } catch (error) {
    console.error('Get saved videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching saved videos',
      error: error.message
    });
  }
};

// Get view history (Protected - requires login)
export const getViewHistory = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    console.log('📜 Fetching view history for user:', req.user.id);

    // Get ALL view interactions for this user
    const viewInteractions = await VideoInteraction.findAll({
      where: {
        userId: req.user.id,
        type: 'view'
      },
      attributes: ['videoId', 'createdAt'],
      order: [['createdAt', 'DESC']],
      raw: true
    });

    console.log('📜 Total view records found:', viewInteractions.length);

    if (viewInteractions.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get unique video IDs and their last viewed timestamp
    const videoMap = new Map();
    viewInteractions.forEach(interaction => {
      if (!videoMap.has(interaction.videoId)) {
        videoMap.set(interaction.videoId, interaction.createdAt);
      }
    });

    const videoIds = Array.from(videoMap.keys());
    console.log('📜 Unique videos watched:', videoIds.length);

    // Fetch video details
    const videos = await Video.findAll({
      where: {
        id: { [Op.in]: videoIds },
        isPublished: true
      }
    });

    console.log('📜 Published videos found:', videos.length);

    if (videos.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const publishedVideoIds = videos.map(v => v.id);

    // Get ALL interactions for these videos
    const allInteractions = await VideoInteraction.findAll({
      where: { videoId: { [Op.in]: publishedVideoIds } },
      raw: true
    });

    console.log('🔍 History: Total interactions found:', allInteractions.length);

    // Count manually
    const interactionMap = {};
    publishedVideoIds.forEach(id => {
      interactionMap[id] = { likes: 0, dislikes: 0, views: 0 };
    });

    allInteractions.forEach(interaction => {
      const { videoId, type } = interaction;
      if (interactionMap[videoId]) {
        interactionMap[videoId][type + 's']++;
      }
    });

    console.log('🔍 History: Interaction counts:', interactionMap);

    // Get user's own interactions
    let userInteractionMap = {};
    const userInteractions = await VideoInteraction.findAll({
      where: {
        userId: req.user.id,
        videoId: { [Op.in]: publishedVideoIds },
        type: { [Op.in]: ['like', 'dislike'] }
      },
      raw: true
    });

    console.log('🔍 History: User interactions found:', userInteractions.length);

    userInteractions.forEach(interaction => {
      if (!userInteractionMap[interaction.videoId]) {
        userInteractionMap[interaction.videoId] = { like: false, dislike: false };
      }
      
      if (interaction.type === 'like') {
        userInteractionMap[interaction.videoId].like = true;
      } else if (interaction.type === 'dislike') {
        userInteractionMap[interaction.videoId].dislike = true;
      }
    });

    const videosWithData = videos.map(video => {
      const videoData = video.toJSON();
      const interactions = interactionMap[video.id];
      
      videoData.likes = interactions.likes;
      videoData.dislikes = interactions.dislikes;
      videoData.views = interactions.views;
      videoData.userInteraction = userInteractionMap[video.id] || { like: false, dislike: false };
      videoData.viewedAt = videoMap.get(video.id);
      
      console.log('✅ History video prepared:', {
        id: videoData.id,
        title: videoData.title,
        likes: videoData.likes,
        dislikes: videoData.dislikes,
        views: videoData.views,
        viewedAt: videoData.viewedAt
      });
      
      return videoData;
    });

    // Sort by last viewed date (most recent first)
    videosWithData.sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt));

    // Limit to 50 most recent
    const limitedVideos = videosWithData.slice(0, 50);

    console.log('✅ Returning', limitedVideos.length, 'videos in history');

    res.json({
      success: true,
      data: limitedVideos
    });
  } catch (error) {
    console.error('Get view history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching view history',
      error: error.message
    });
  }
};
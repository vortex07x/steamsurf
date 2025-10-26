import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const VideoInteraction = sequelize.define('VideoInteraction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  videoId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'videos',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  type: {
    type: DataTypes.ENUM('like', 'dislike', 'view'),
    allowNull: false
  }
}, {
  tableName: 'video_interactions',
  timestamps: true,
  indexes: [
    // Only likes and dislikes are unique per user
    // Views can have multiple records
    {
      unique: true,
      fields: ['videoId', 'userId', 'type'],
      name: 'unique_user_video_like_dislike',
      where: {
        type: ['like', 'dislike']
      }
    },
    {
      fields: ['videoId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['type']
    }
  ]
});

// Import models for associations
import User from './User.js';
import Video from './Video.js';

// Define associations
VideoInteraction.belongsTo(User, { as: 'user', foreignKey: 'userId' });
VideoInteraction.belongsTo(Video, { as: 'video', foreignKey: 'videoId' });

export default VideoInteraction;
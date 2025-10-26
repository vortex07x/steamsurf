import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const SavedVideo = sequelize.define('SavedVideo', {
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
  }
}, {
  tableName: 'saved_videos',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['videoId', 'userId'],
      name: 'unique_user_video_save'
    },
    {
      fields: ['userId']
    },
    {
      fields: ['videoId']
    }
  ]
});

// Import models for associations
import User from './User.js';
import Video from './Video.js';

// Define associations
SavedVideo.belongsTo(User, { as: 'user', foreignKey: 'userId' });
SavedVideo.belongsTo(Video, { as: 'video', foreignKey: 'videoId' });

export default SavedVideo;
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Video = sequelize.define('Video', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Video title is required'
      },
      len: {
        args: [1, 500],
        msg: 'Title must be between 1 and 500 characters'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Description is required'
      },
      len: {
        args: [1, 2000],
        msg: 'Description cannot exceed 2000 characters'
      }
    }
  },
  videoUrl: {
    type: DataTypes.STRING(1000),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Video URL is required'
      }
    }
  },
  thumbnailUrl: {
    type: DataTypes.STRING(1000),
    defaultValue: '/uploads/default-thumbnail.jpg'
  },
  cloudinaryId: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Cloudinary public ID for the video'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  category: {
    type: DataTypes.ENUM('Music', 'Tutorial', 'Gaming', 'Vlog', 'Documentary', 'Other'),
    defaultValue: 'Other',
    allowNull: false
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  quality: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: ['original']
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  dislikes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  uploadedBy: {
    type: DataTypes.STRING,
    defaultValue: 'Admin'
  }
}, {
  tableName: 'videos',
  timestamps: true,
  indexes: [
    {
      fields: ['category']
    },
    {
      fields: ['views']
    },
    {
      fields: ['likes']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['cloudinaryId']
    },
    {
      fields: ['isPublished']
    }
  ]
});

export default Video;
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Helper function to generate video URL
export const getVideoUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    resource_type: 'video',
    secure: true,
    ...options
  });
};

// Helper function to generate thumbnail URL from video
export const getThumbnailUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    resource_type: 'video',
    format: 'jpg',
    transformation: [
      { width: 1280, height: 720, crop: 'fill', quality: 'auto' },
      ...(options.transformation || [])
    ],
    secure: true
  });
};

export default cloudinary;
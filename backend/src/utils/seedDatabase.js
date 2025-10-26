import cloudinary, { getThumbnailUrl, getVideoUrl } from '../config/cloudinary.js';
import { sequelize } from '../config/database.js';
import Video from '../models/Video.js';
import User from '../models/User.js';
import VideoInteraction from '../models/VideoInteraction.js';
import dotenv from 'dotenv';

dotenv.config();

// Category-based tags mapping (all lowercase)
const CATEGORY_TAGS = {
  'Music': ['music', 'guitar', 'rock', 'metal', 'concert', 'live', 'performance', 'song', 'band', 'artist'],
  'Gaming': ['gaming', 'gameplay', 'game', 'player', 'esports', 'multiplayer', 'adventure', 'fps', 'rpg', 'strategy'],
  'Tutorial': ['tutorial', 'howto', 'guide', 'learn', 'education', 'training', 'tips', 'tricks', 'diy', 'course'],
  'Documentary': ['documentary', 'nature', 'wildlife', 'history', 'science', 'ocean', 'animals', 'planet', 'earth', 'exploration'],
  'Vlog': ['vlog', 'daily', 'life', 'lifestyle', 'personal', 'diary', 'day', 'routine', 'travel', 'experience'],
  'Other': ['video', 'content', 'media', 'entertainment', 'misc', 'general']
};

// Helper: Extract clean title from Cloudinary public_id
const extractCleanTitle = (publicId) => {
  try {
    const filename = publicId.split('/').pop();
    
    let cleaned = filename
      .replace(/\.[^/.]+$/, '')
      .replace(/_[a-f0-9]{32}_/gi, ' ')
      .replace(/_[a-z0-9]{6}$/gi, '')
      .replace(/__+/g, ' ')
      .replace(/_+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    cleaned = cleaned
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    if (cleaned.length > 200) {
      cleaned = cleaned.substring(0, 197) + '...';
    }
    
    return cleaned || 'Untitled Video';
  } catch (error) {
    console.error('Error extracting title:', error);
    return 'Untitled Video';
  }
};

// Helper: Categorize video based on tags and title
const categorizeVideo = (title, tags = []) => {
  const lower = title.toLowerCase();
  const allTags = tags.join(' ').toLowerCase();
  
  if (allTags.includes('music') || allTags.includes('guitar') || allTags.includes('concert') || 
      lower.includes('music') || lower.includes('guitar') || lower.includes('concert') ||
      lower.includes('song') || lower.includes('metal')) {
    return 'Music';
  }
  
  if (allTags.includes('gaming') || allTags.includes('game') || allTags.includes('play') ||
      lower.includes('game') || lower.includes('gaming') || lower.includes('player')) {
    return 'Gaming';
  }
  
  if (allTags.includes('tutorial') || allTags.includes('how to') || allTags.includes('guide') ||
      lower.includes('tutorial') || lower.includes('how to') || lower.includes('learn')) {
    return 'Tutorial';
  }
  
  if (allTags.includes('documentary') || allTags.includes('nature') || allTags.includes('wildlife') ||
      lower.includes('documentary') || lower.includes('nature') || lower.includes('ocean')) {
    return 'Documentary';
  }
  
  if (allTags.includes('vlog') || allTags.includes('daily') || allTags.includes('life') ||
      lower.includes('vlog') || lower.includes('daily')) {
    return 'Vlog';
  }
  
  return 'Other';
};

// Helper: Generate category-based tags
const generateTags = (category, cloudinaryTags = []) => {
  const baseTags = CATEGORY_TAGS[category] || CATEGORY_TAGS['Other'];
  
  // Randomly select 4-8 tags from category
  const numTags = Math.floor(Math.random() * 5) + 4;
  const selectedTags = [];
  
  // Shuffle and select random tags
  const shuffled = [...baseTags].sort(() => 0.5 - Math.random());
  selectedTags.push(...shuffled.slice(0, numTags));
  
  // Add cloudinary tags if available (lowercase)
  const normalizedCloudinaryTags = cloudinaryTags
    .map(tag => tag.toLowerCase())
    .filter(tag => tag && tag.length > 2);
  
  selectedTags.push(...normalizedCloudinaryTags.slice(0, 3));
  
  // Remove duplicates and return
  return [...new Set(selectedTags)].slice(0, 10);
};

// Helper: Generate random but realistic metadata
const generateMetadata = () => ({
  views: Math.floor(Math.random() * 150000) + 5000,
  likes: Math.floor(Math.random() * 10000) + 100,
  dislikes: Math.floor(Math.random() * 500)
});

// Helper: Get video duration from Cloudinary (fetch detailed info)
const getVideoDuration = async (publicId) => {
  try {
    // Fetch detailed resource info
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'video',
      image_metadata: false,
      media_metadata: true
    });
    
    // Duration is in seconds
    if (result.duration) {
      return Math.round(result.duration);
    }
    
    // If duration not available, generate random realistic duration (30s to 10min)
    return Math.floor(Math.random() * 570) + 30;
  } catch (error) {
    console.error(`Error fetching duration for ${publicId}:`, error.message);
    // Return random duration if API fails
    return Math.floor(Math.random() * 570) + 30;
  }
};

// Main seed function
const seedDatabase = async () => {
  try {
    console.log('🔄 Starting database seed from Cloudinary...\n');

    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');

    console.log('⚠️  Dropping existing tables and recreating...');
    await sequelize.sync({ force: true });
    console.log('📊 Database synced\n');

    console.log('📥 Fetching videos from Cloudinary...');
    
    let allResources = [];
    let nextCursor = null;
    
    do {
      const result = await cloudinary.api.resources({
        resource_type: 'video',
        type: 'upload',
        max_results: 500,
        next_cursor: nextCursor
      });
      
      allResources = allResources.concat(result.resources);
      nextCursor = result.next_cursor;
      
      console.log(`   Fetched ${result.resources.length} videos...`);
    } while (nextCursor);

    if (allResources.length === 0) {
      console.log('\n⚠️  No videos found in Cloudinary');
      console.log('   Please upload videos to your Cloudinary account first.');
      process.exit(0);
    }

    console.log(`✅ Found ${allResources.length} videos in Cloudinary\n`);
    console.log('⏳ Fetching detailed video information (this may take a moment)...\n');

    // Fetch detailed info for each video with duration
    const videosToInsert = [];
    
    for (let i = 0; i < allResources.length; i++) {
      const resource = allResources[i];
      
      // Show progress
      if ((i + 1) % 3 === 0 || i === allResources.length - 1) {
        process.stdout.write(`   Processing video ${i + 1}/${allResources.length}...\r`);
      }
      
      const metadata = generateMetadata();
      const cloudinaryTags = resource.tags || [];
      const title = extractCleanTitle(resource.public_id);
      const category = categorizeVideo(title, cloudinaryTags);
      const tags = generateTags(category, cloudinaryTags);
      
      // Fetch actual duration from Cloudinary
      const duration = await getVideoDuration(resource.public_id);
      
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;

      videosToInsert.push({
        title: title,
        description: `${title}. Duration: ${minutes}m ${seconds}s. Uploaded from Cloudinary.`,
        videoUrl: resource.secure_url,
        thumbnailUrl: getThumbnailUrl(resource.public_id),
        cloudinaryId: resource.public_id,
        duration: duration,
        tags: tags,
        category: category,
        quality: ['original'],
        views: metadata.views,
        likes: metadata.likes,
        dislikes: metadata.dislikes,
        isPublished: true,
        uploadedBy: 'Admin'
      });
    }

    console.log('\n\n💾 Inserting videos into database...\n');
    await Video.bulkCreate(videosToInsert, {
      validate: true
    });
    
    console.log(`✅ Successfully inserted ${videosToInsert.length} videos\n`);

    console.log('🎉 Database seeded successfully!\n');
    console.log('📹 Videos added:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    videosToInsert.slice(0, 10).forEach((video, index) => {
      const minutes = Math.floor(video.duration / 60);
      const seconds = video.duration % 60;
      console.log(`${(index + 1).toString().padStart(2, '0')}. ${video.title.substring(0, 60)}`);
      console.log(`    Category: ${video.category} | Duration: ${minutes}m ${seconds}s | Views: ${video.views.toLocaleString()}`);
      console.log(`    Tags: ${video.tags.slice(0, 5).join(', ')}`);
      console.log('');
    });

    if (videosToInsert.length > 10) {
      console.log(`    ... and ${videosToInsert.length - 10} more videos\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const categoryCount = videosToInsert.reduce((acc, video) => {
      acc[video.category] = (acc[video.category] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📊 Category Breakdown:');
    Object.entries(categoryCount).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} video(s)`);
    });
    
    const totalDuration = videosToInsert.reduce((sum, v) => sum + v.duration, 0);
    const avgDuration = Math.floor(totalDuration / videosToInsert.length);
    console.log(`\n⏱️  Total Duration: ${Math.floor(totalDuration / 3600)}h ${Math.floor((totalDuration % 3600) / 60)}m`);
    console.log(`   Average Duration: ${Math.floor(avgDuration / 60)}m ${avgDuration % 60}s`);
    console.log(`   Shortest: ${Math.floor(Math.min(...videosToInsert.map(v => v.duration)) / 60)}m ${Math.min(...videosToInsert.map(v => v.duration)) % 60}s`);
    console.log(`   Longest: ${Math.floor(Math.max(...videosToInsert.map(v => v.duration)) / 60)}m ${Math.max(...videosToInsert.map(v => v.duration)) % 60}s`);

    // Tag statistics
    const allTags = videosToInsert.flatMap(v => v.tags);
    const uniqueTags = [...new Set(allTags)];
    console.log(`\n🏷️  Total Unique Tags: ${uniqueTags.length}`);
    console.log(`   Sample Tags: ${uniqueTags.slice(0, 15).join(', ')}`);

    console.log('\n✨ Seed completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    console.error('\nError Details:', error.message);
    
    if (error.error && error.error.message) {
      console.error('Cloudinary Error:', error.error.message);
    }
    
    if (error.name === 'SequelizeValidationError') {
      console.error('\nValidation Errors:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path}: ${err.message}`);
      });
    }
    
    process.exit(1);
  }
};

// Run the seed
seedDatabase();
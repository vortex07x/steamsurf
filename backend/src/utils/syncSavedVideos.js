import { sequelize } from '../config/database.js';
import SavedVideo from '../models/SavedVideo.js';

const syncSavedVideos = async () => {
  try {
    console.log('🔄 Syncing SavedVideo table...');
    
    await SavedVideo.sync({ alter: true });
    
    console.log('✅ SavedVideo table synced successfully');
  } catch (error) {
    console.error('❌ Error syncing SavedVideo table:', error);
    throw error;
  }
};

export default syncSavedVideos;
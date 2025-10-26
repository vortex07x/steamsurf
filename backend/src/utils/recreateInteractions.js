import { sequelize } from '../config/database.js';
import VideoInteraction from '../models/VideoInteraction.js';

async function recreateTable() {
  try {
    console.log('🔧 Dropping video_interactions table...');
    await sequelize.query('DROP TABLE IF EXISTS video_interactions CASCADE;');
    
    console.log('🔧 Recreating video_interactions table...');
    await VideoInteraction.sync({ force: true });
    
    console.log('✅ Table recreated successfully!');
    console.log('⚠️  Note: All previous interactions have been cleared.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

recreateTable();